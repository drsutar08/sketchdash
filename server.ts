import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import {
  AVATAR_COLORS,
  DAILY_CHALLENGE_BONUS_POINTS,
  DAILY_CHALLENGE_MULTIPLIER,
  DAILY_CHALLENGE_WORD_COUNT,
  MAX_ROOM_PLAYERS,
  QUICK_REACTIONS,
  SPONSOR_CARDS,
  WORD_PACKS,
  getDailyChallengeWordSet,
  getLocalizedWordPack,
  getWordPack,
  normalizeLanguage,
  sanitizeAvatarConfig,
  type AvatarConfig,
  type ChatEntry,
  type ClientMessage,
  type DailyChallengeState,
  type DailyFinisher,
  type DrawStroke,
  type GameMode,
  type LeaderboardEntry,
  type PlayerInfo,
  type RoomPhase,
  type RoomPublicState,
  type ServerMessage,
  type SupportedLanguage,
  type TriviaQuestionFull,
} from './shared/gameData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const LEADERBOARD_FILE = path.join(__dirname, '.leaderboard.json');
const DAILY_CHALLENGE_FILE = path.join(__dirname, '.daily_challenge.json');

interface PlayerConn extends PlayerInfo {
  ws: WebSocket | null;
  triviaChoice: number | null;
  triviaTimeLeft: number;
}

interface RoomState {
  code: string;
  hostId: string;
  isPublic: boolean;
  mode: GameMode;
  language: SupportedLanguage;
  packId: string;
  customWords: string[];
  adFree: boolean;
  phase: RoomPhase;
  round: number;
  roundsTotal: number;
  turnIndex: number;
  turnOrder: string[];
  roundDuration: number;
  timeLeft: number;
  drawerId: string | null;
  secretWord: string;
  revealedIndices: Set<number>;
  wordOptions: string[];
  usedWords: Set<string>;
  triviaQueue: TriviaQuestionFull[];
  currentTrivia: TriviaQuestionFull | null;
  strokes: DrawStroke[];
  chat: ChatEntry[];
  players: Map<string, PlayerConn>;
  sponsorIndex: number;
  timer: NodeJS.Timeout | null;
  lastActivity: number;
}

const rooms = new Map<string, RoomState>();
const socketMeta = new WeakMap<WebSocket, { roomCode: string; playerId: string }>();
const leaderboard = new Map<string, LeaderboardEntry>();
const dailyCompletions = new Map<string, Map<string, DailyFinisher>>();

function toDateKey(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function build7DayHistory(entry: LeaderboardEntry): NonNullable<LeaderboardEntry['history7Days']> {
  const daily = entry.dailyPoints && Object.keys(entry.dailyPoints).length > 0
    ? entry.dailyPoints
    : { [toDateKey(entry.lastActive || Date.now())]: entry.totalPoints };

  const now = new Date();
  const keys: string[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - offset);
    keys.push(d.toISOString().slice(0, 10));
  }

  const windowSum = keys.reduce((sum, k) => sum + (daily[k] || 0), 0);
  let running = Math.max(0, entry.totalPoints - windowSum);

  return keys.map((key, idx) => {
    const earned = daily[key] || 0;
    running += earned;
    const label =
      idx === keys.length - 1
        ? 'Today'
        : new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          });
    return {
      date: key,
      label,
      earned,
      cumulative: running,
    };
  });
}

function loadLeaderboard() {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) return;
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (entry && typeof entry.name === 'string') {
          if (!entry.dailyPoints) {
            entry.dailyPoints = { [toDateKey(entry.lastActive || Date.now())]: entry.totalPoints };
          }
          leaderboard.set(entry.name.toLowerCase(), entry);
        }
      }
    }
  } catch {
    // Ignore corrupt or missing file
  }
}

function saveLeaderboard() {
  try {
    const entries = [...leaderboard.values()];
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    // Ignore disk write errors
  }
}

function recordPublicPoints(
  name: string,
  avatarColor: string,
  pointsDelta: number,
  avatar?: AvatarConfig
) {
  if (pointsDelta <= 0) return;
  const key = name.trim().toLowerCase();
  if (!key) return;
  const now = Date.now();
  const dayKey = toDateKey(now);
  const existing = leaderboard.get(key);
  if (existing) {
    existing.totalPoints += pointsDelta;
    existing.avatarColor = avatarColor;
    if (avatar) existing.avatar = avatar;
    existing.lastActive = now;
    existing.dailyPoints = existing.dailyPoints || {};
    existing.dailyPoints[dayKey] = (existing.dailyPoints[dayKey] || 0) + pointsDelta;
  } else {
    leaderboard.set(key, {
      id: makeId('lb'),
      name: name.trim(),
      avatarColor,
      avatar,
      totalPoints: pointsDelta,
      gamesPlayed: 0,
      wins: 0,
      lastActive: now,
      dailyPoints: { [dayKey]: pointsDelta },
    });
  }
  saveLeaderboard();
}

function recordPublicGameCompletion(room: RoomState) {
  if (!room.isPublic) return;
  const participants = [...room.players.values()].filter(
    (p) => !p.isSpectator && (p.connected || p.score > 0)
  );
  if (participants.length === 0) return;
  const topScore = Math.max(...participants.map((p) => p.score));
  const now = Date.now();

  for (const p of participants) {
    const key = p.name.trim().toLowerCase();
    if (!key) continue;
    const existing = leaderboard.get(key) || {
      id: makeId('lb'),
      name: p.name.trim(),
      avatarColor: p.avatarColor,
      avatar: p.avatar,
      totalPoints: 0,
      gamesPlayed: 0,
      wins: 0,
      lastActive: now,
      dailyPoints: {},
    };
    existing.gamesPlayed += 1;
    if (topScore > 0 && p.score === topScore) {
      existing.wins += 1;
    }
    existing.avatarColor = p.avatarColor;
    if (p.avatar) existing.avatar = p.avatar;
    existing.lastActive = now;
    leaderboard.set(key, existing);
  }
  saveLeaderboard();
}

function getTopLeaderboardPlayers(limit = 10): LeaderboardEntry[] {
  const todayKey = toDateKey();
  return [...leaderboard.values()]
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.lastActive - a.lastActive;
    })
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      hasDailyBadge: hasDailyChallengeBadge(entry.name, todayKey),
      history7Days: build7DayHistory(entry),
    }));
}

function loadDailyCompletions() {
  try {
    if (!fs.existsSync(DAILY_CHALLENGE_FILE)) return;
    const raw = fs.readFileSync(DAILY_CHALLENGE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, DailyFinisher[]>;
    if (parsed && typeof parsed === 'object') {
      for (const [dateKey, list] of Object.entries(parsed)) {
        if (!Array.isArray(list)) continue;
        const map = new Map<string, DailyFinisher>();
        for (const item of list) {
          if (item && typeof item.name === 'string') {
            map.set(item.name.trim().toLowerCase(), item);
          }
        }
        dailyCompletions.set(dateKey, map);
      }
    }
  } catch {
    // Ignore corrupt or missing file
  }
}

function saveDailyCompletions() {
  try {
    const out: Record<string, DailyFinisher[]> = {};
    for (const [dateKey, map] of dailyCompletions.entries()) {
      out[dateKey] = [...map.values()];
    }
    fs.writeFileSync(DAILY_CHALLENGE_FILE, JSON.stringify(out, null, 2), 'utf8');
  } catch {
    // Ignore disk write errors
  }
}

function hasDailyChallengeBadge(playerName: string, dateKey = toDateKey()): boolean {
  const key = playerName.trim().toLowerCase();
  if (!key) return false;
  return Boolean(dailyCompletions.get(dateKey)?.has(key));
}

function getDailyChallengeStateForPlayer(
  language: SupportedLanguage,
  playerName?: string
): DailyChallengeState {
  const dateKey = toDateKey();
  const { words, packSourceTitle } = getDailyChallengeWordSet(dateKey, language);
  const map = dailyCompletions.get(dateKey);
  const finishers = map ? [...map.values()] : [];
  finishers.sort((a, b) => {
    if (a.elapsedSeconds !== b.elapsedSeconds) return a.elapsedSeconds - b.elapsedSeconds;
    return a.completedAt - b.completedAt;
  });

  const playerKey = String(playerName || '').trim().toLowerCase();
  const playerResult = playerKey ? map?.get(playerKey) : undefined;

  return {
    dateKey,
    multiplier: DAILY_CHALLENGE_MULTIPLIER,
    bonusPoints: DAILY_CHALLENGE_BONUS_POINTS,
    words,
    packSourceTitle,
    totalFinishers: finishers.length,
    topFinishers: finishers.slice(0, 5),
    completedByPlayer: Boolean(playerResult),
    playerResult,
  };
}

loadLeaderboard();
loadDailyCompletions();

function makeId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 25; attempt++) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function sanitizeName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, 18);
  return trimmed || 'Player';
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function buildWordMask(word: string, revealed: Set<number>): string {
  if (!word) return '';
  return [...word]
    .map((ch, idx) => {
      if (ch === ' ' || ch === '-') return ch === ' ' ? '  ' : '-';
      return revealed.has(idx) ? ch : '_';
    })
    .join(' ');
}

function send(ws: WebSocket | null, msg: ServerMessage) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(msg));
}

function getPublicStateForPlayer(room: RoomState, viewerId: string): RoomPublicState {
  const pack = getLocalizedWordPack(room.packId, room.language);
  const todayKey = toDateKey();
  const players: PlayerInfo[] = [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    avatarColor: p.avatarColor,
    avatar: p.avatar,
    score: p.score,
    roundDelta: p.roundDelta,
    hasGuessed: p.hasGuessed,
    hasAnsweredTrivia: p.hasAnsweredTrivia,
    connected: p.connected,
    isSpectator: p.isSpectator,
    streak: p.streak,
    hasDailyBadge: hasDailyChallengeBadge(p.name, todayKey),
  }));

  const isDrawer = room.drawerId === viewerId;
  const sponsor = SPONSOR_CARDS[room.sponsorIndex % SPONSOR_CARDS.length];

  const base: RoomPublicState = {
    code: room.code,
    hostId: room.hostId,
    isPublic: room.isPublic,
    mode: room.mode,
    language: room.language,
    packId: room.packId,
    packTitle: pack.title,
    adFree: room.adFree,
    phase: room.phase,
    round: room.round,
    roundsTotal: room.roundsTotal,
    turnIndex: room.turnIndex,
    totalTurnsInRound: Math.max(1, room.turnOrder.length),
    roundDuration: room.roundDuration,
    timeLeft: room.timeLeft,
    drawerId: room.drawerId,
    wordMask: buildWordMask(room.secretWord, room.revealedIndices),
    wordLength: room.secretWord.replace(/\s+/g, '').length,
    players,
    strokes: room.strokes,
    chat: room.chat.slice(-60),
    sponsorSlot: sponsor,
  };

  if (room.phase === 'WORD_CHOICE' && isDrawer) {
    base.wordOptions = room.wordOptions;
  }
  if (room.phase === 'DRAWING' && isDrawer) {
    base.secretWord = room.secretWord;
  }
  if (room.phase === 'ROUND_SUMMARY' && room.mode === 'draw') {
    base.revealedWord = room.secretWord;
  }
  if ((room.phase === 'TRIVIA' || room.phase === 'ROUND_SUMMARY') && room.currentTrivia) {
    base.triviaQuestion = {
      id: room.currentTrivia.id,
      category: room.currentTrivia.category,
      prompt: room.currentTrivia.prompt,
      options: room.currentTrivia.options,
    };
    if (room.phase === 'ROUND_SUMMARY') {
      base.triviaCorrectIndex = room.currentTrivia.correctIndex;
      base.triviaFactoid = room.currentTrivia.factoid;
    }
  }

  return base;
}

function broadcastRoomState(room: RoomState) {
  for (const player of room.players.values()) {
    send(player.ws, {
      type: 'room:state',
      state: getPublicStateForPlayer(room, player.id),
    });
  }
}

function broadcastChat(room: RoomState, entry: ChatEntry) {
  room.chat.push(entry);
  if (room.chat.length > 80) room.chat.shift();
  for (const player of room.players.values()) {
    send(player.ws, { type: 'chat:entry', entry });
  }
}

function clearRoomTimer(room: RoomState) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

function pickWordCandidates(room: RoomState): string[] {
  const pack = getLocalizedWordPack(room.packId, room.language);
  const fallbackWords = getLocalizedWordPack(WORD_PACKS[0].id, room.language).words;
  let pool = room.packId === 'custom' && room.customWords.length >= 3
    ? [...room.customWords]
    : [...pack.words];

  if (room.packId === 'custom' && room.customWords.length > 0 && room.customWords.length < 3) {
    pool = [...room.customWords, ...fallbackWords];
  }

  const unused = pool.filter((w) => !room.usedWords.has(w));
  const source = unused.length >= 3 ? unused : pool;
  return shuffle(source).slice(0, 3);
}

function startNextDrawTurn(room: RoomState) {
  clearRoomTimer(room);
  room.strokes = [];
  room.secretWord = '';
  room.revealedIndices.clear();
  for (const p of room.players.values()) {
    p.hasGuessed = false;
    p.roundDelta = 0;
  }

  const activeIds = room.turnOrder.filter((id) => {
    const p = room.players.get(id);
    return Boolean(p?.connected && !p.isSpectator);
  });
  if (activeIds.length === 0) {
    room.phase = 'LOBBY';
    broadcastRoomState(room);
    return;
  }

  while (room.turnIndex < room.turnOrder.length) {
    const candidateId = room.turnOrder[room.turnIndex];
    const p = room.players.get(candidateId);
    if (p?.connected && !p.isSpectator) break;
    room.turnIndex++;
  }

  if (room.turnIndex >= room.turnOrder.length) {
    if (room.round >= room.roundsTotal) {
      room.phase = 'GAME_OVER';
      room.drawerId = null;
      recordPublicGameCompletion(room);
      broadcastRoomState(room);
      return;
    }
    room.round += 1;
    room.turnIndex = 0;
    room.turnOrder = [...room.players.values()]
      .filter((p) => p.connected && !p.isSpectator)
      .map((p) => p.id);
  }

  const drawerId = room.turnOrder[room.turnIndex];
  room.drawerId = drawerId || activeIds[0];
  room.wordOptions = pickWordCandidates(room);
  room.phase = 'WORD_CHOICE';
  room.timeLeft = 12;

  broadcastRoomState(room);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    if (room.timeLeft <= 0) {
      const fallback = room.wordOptions[0] || 'Skateboard';
      beginDrawingPhase(room, fallback);
      return;
    }
    for (const p of room.players.values()) {
      send(p.ws, { type: 'timer:tick', timeLeft: room.timeLeft });
    }
  }, 1000);
}

function beginDrawingPhase(room: RoomState, chosenWord: string) {
  clearRoomTimer(room);
  room.secretWord = chosenWord;
  room.usedWords.add(chosenWord);
  room.wordOptions = [];
  room.revealedIndices.clear();
  room.strokes = [];
  room.phase = 'DRAWING';
  room.timeLeft = room.roundDuration;

  const drawer = room.drawerId ? room.players.get(room.drawerId) : null;
  broadcastChat(room, {
    id: makeId('sys'),
    text: `${drawer?.name || 'Drawer'} is sketching now!`,
    kind: 'system',
    timestamp: Date.now(),
  });
  broadcastRoomState(room);

  const revealFirstAt = Math.floor(room.roundDuration * 0.55);
  const revealSecondAt = Math.floor(room.roundDuration * 0.28);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    let maskChanged = false;
    if (room.timeLeft === revealFirstAt || room.timeLeft === revealSecondAt) {
      const letterIndices = [...room.secretWord]
        .map((ch, idx) => (ch !== ' ' && ch !== '-' && !room.revealedIndices.has(idx) ? idx : -1))
        .filter((idx) => idx >= 0);
      if (letterIndices.length > 1) {
        const pick = letterIndices[Math.floor(Math.random() * letterIndices.length)];
        room.revealedIndices.add(pick);
        maskChanged = true;
      }
    }

    if (room.timeLeft <= 0) {
      finishTurnToSummary(room);
      return;
    }

    const mask = maskChanged ? buildWordMask(room.secretWord, room.revealedIndices) : undefined;
    for (const p of room.players.values()) {
      send(p.ws, {
        type: 'timer:tick',
        timeLeft: room.timeLeft,
        wordMask: mask,
      });
    }
  }, 1000);
}

function finishTurnToSummary(room: RoomState) {
  clearRoomTimer(room);
  room.phase = 'ROUND_SUMMARY';
  room.timeLeft = 6;
  room.sponsorIndex = (room.sponsorIndex + 1) % SPONSOR_CARDS.length;

  if (room.mode === 'draw') {
    for (const p of room.players.values()) {
      if (p.connected && !p.isSpectator && p.id !== room.drawerId && !p.hasGuessed) {
        p.streak = 0;
      }
    }
    broadcastChat(room, {
      id: makeId('sys'),
      text: `Time's up! The word was "${room.secretWord}".`,
      kind: 'system',
      timestamp: Date.now(),
    });
  } else if (room.currentTrivia) {
    const q = room.currentTrivia;
    const todayKey = toDateKey();
    for (const p of room.players.values()) {
      p.roundDelta = 0;
      if (p.connected && !p.isSpectator && p.triviaChoice === q.correctIndex) {
        const baseGained = 140 + Math.round((p.triviaTimeLeft / 18) * 160);
        const hasBoost = hasDailyChallengeBadge(p.name, todayKey);
        const gained = hasBoost ? Math.round(baseGained * DAILY_CHALLENGE_MULTIPLIER) : baseGained;
        p.score += gained;
        p.roundDelta = gained;
        p.streak += 1;
        if (room.isPublic) {
          recordPublicPoints(p.name, p.avatarColor, gained, p.avatar);
        }
      } else if (p.connected && !p.isSpectator) {
        p.streak = 0;
      }
    }
  }

  broadcastRoomState(room);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    if (room.timeLeft <= 0) {
      advanceAfterSummary(room);
      return;
    }
    for (const p of room.players.values()) {
      send(p.ws, { type: 'timer:tick', timeLeft: room.timeLeft });
    }
  }, 1000);
}

function startNextTriviaQuestion(room: RoomState) {
  clearRoomTimer(room);
  for (const p of room.players.values()) {
    p.hasAnsweredTrivia = false;
    p.triviaChoice = null;
    p.triviaTimeLeft = 0;
    p.roundDelta = 0;
  }

  if (room.turnIndex >= room.triviaQueue.length) {
    room.phase = 'GAME_OVER';
    room.currentTrivia = null;
    recordPublicGameCompletion(room);
    broadcastRoomState(room);
    return;
  }

  room.round = room.turnIndex + 1;
  room.currentTrivia = room.triviaQueue[room.turnIndex];
  room.phase = 'TRIVIA';
  room.timeLeft = 18;
  broadcastRoomState(room);

  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    if (room.timeLeft <= 0) {
      finishTurnToSummary(room);
      return;
    }
    for (const p of room.players.values()) {
      send(p.ws, { type: 'timer:tick', timeLeft: room.timeLeft });
    }
  }, 1000);
}

function advanceAfterSummary(room: RoomState) {
  clearRoomTimer(room);
  room.turnIndex += 1;
  if (room.mode === 'draw') {
    startNextDrawTurn(room);
  } else {
    startNextTriviaQuestion(room);
  }
}

function startMatch(room: RoomState) {
  clearRoomTimer(room);
  const activePlayers = [...room.players.values()].filter((p) => p.connected && !p.isSpectator);
  if (activePlayers.length < 2) return;

  for (const p of room.players.values()) {
    p.score = 0;
    p.roundDelta = 0;
    p.hasGuessed = false;
    p.hasAnsweredTrivia = false;
    p.triviaChoice = null;
    p.streak = 0;
  }

  room.usedWords.clear();
  room.strokes = [];
  room.round = 1;
  room.turnIndex = 0;

  if (room.mode === 'draw') {
    room.turnOrder = shuffle(activePlayers.map((p) => p.id));
    startNextDrawTurn(room);
  } else {
    const pack = getLocalizedWordPack(room.packId, room.language);
    const fallbackTrivia = getLocalizedWordPack(WORD_PACKS[0].id, room.language).trivia;
    const basePool = pack.trivia.length >= 6 ? pack.trivia : [...pack.trivia, ...fallbackTrivia];
    const desiredCount = Math.min(basePool.length, Math.max(4, room.roundsTotal * 3));
    room.triviaQueue = shuffle(basePool).slice(0, desiredCount);
    room.roundsTotal = room.triviaQueue.length;
    room.turnOrder = room.triviaQueue.map((q) => q.id);
    startNextTriviaQuestion(room);
  }
}

function handleDisconnect(ws: WebSocket) {
  const meta = socketMeta.get(ws);
  if (!meta) return;
  const room = rooms.get(meta.roomCode);
  if (!room) return;

  const player = room.players.get(meta.playerId);
  if (!player) return;
  player.connected = false;
  player.ws = null;
  room.lastActivity = Date.now();

  const connectedAll = [...room.players.values()].filter((p) => p.connected);
  if (connectedAll.length === 0) {
    clearRoomTimer(room);
    return;
  }

  const activePlayers = connectedAll.filter((p) => !p.isSpectator);

  if (room.hostId === player.id) {
    const nextHost = activePlayers[0] || connectedAll[0];
    room.hostId = nextHost.id;
    broadcastChat(room, {
      id: makeId('sys'),
      text: `${nextHost.name} is now room host.`,
      kind: 'system',
      timestamp: Date.now(),
    });
  }

  const waitingSpectators = connectedAll.filter((p) => p.isSpectator);
  broadcastChat(room, {
    id: makeId('sys'),
    text:
      !player.isSpectator && waitingSpectators.length > 0 && activePlayers.length < MAX_ROOM_PLAYERS
        ? `${player.name} left — a player spot just opened!`
        : `${player.name} left the room.`,
    kind: 'system',
    timestamp: Date.now(),
  });

  if (
    room.mode === 'draw' &&
    room.drawerId === player.id &&
    (room.phase === 'WORD_CHOICE' || room.phase === 'DRAWING')
  ) {
    if (activePlayers.length < 2) {
      clearRoomTimer(room);
      room.phase = 'LOBBY';
      broadcastRoomState(room);
      return;
    }
    finishTurnToSummary(room);
    return;
  }

  broadcastRoomState(room);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size });
  });

  app.get('/api/leaderboard', (_req, res) => {
    res.json({ players: getTopLeaderboardPlayers(10) });
  });

  app.get('/api/daily-challenge', (req, res) => {
    const lang = normalizeLanguage(typeof req.query.lang === 'string' ? req.query.lang : 'en');
    const playerName = typeof req.query.player === 'string' ? req.query.player : '';
    res.json(getDailyChallengeStateForPlayer(lang, playerName));
  });

  app.post('/api/daily-challenge/complete', (req, res) => {
    const body = req.body as {
      name?: string;
      avatarColor?: string;
      avatar?: AvatarConfig;
      elapsedSeconds?: number;
      wordsCompleted?: number;
      language?: string;
    };
    const wordsCompleted = Number(body?.wordsCompleted || 0);
    if (wordsCompleted < DAILY_CHALLENGE_WORD_COUNT) {
      res.status(400).json({ error: 'Complete all daily words to claim the badge and multiplier.' });
      return;
    }

    const name = sanitizeName(String(body?.name || 'Player'));
    const sanitizedAvatar = sanitizeAvatarConfig(body?.avatar, body?.avatarColor);
    const elapsedSeconds = Math.max(5, Math.min(3600, Math.round(Number(body?.elapsedSeconds) || 30)));
    const lang = normalizeLanguage(body?.language);
    const dateKey = toDateKey();

    let dayMap = dailyCompletions.get(dateKey);
    if (!dayMap) {
      dayMap = new Map<string, DailyFinisher>();
      dailyCompletions.set(dateKey, dayMap);
    }

    const key = name.trim().toLowerCase();
    const existing = dayMap.get(key);
    let awardedBonus = 0;

    if (!existing) {
      awardedBonus = DAILY_CHALLENGE_BONUS_POINTS;
      dayMap.set(key, {
        id: makeId('dc'),
        name,
        avatarColor: sanitizedAvatar.color,
        avatar: sanitizedAvatar,
        elapsedSeconds,
        completedAt: Date.now(),
        bonusPoints: awardedBonus,
      });
      recordPublicPoints(name, sanitizedAvatar.color, awardedBonus, sanitizedAvatar);
    } else {
      existing.avatarColor = sanitizedAvatar.color;
      existing.avatar = sanitizedAvatar;
      if (elapsedSeconds < existing.elapsedSeconds) {
        existing.elapsedSeconds = elapsedSeconds;
        existing.completedAt = Date.now();
      }
      dayMap.set(key, existing);
    }

    saveDailyCompletions();
    res.json({
      awardedBonus,
      state: getDailyChallengeStateForPlayer(lang, name),
    });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = String(req.params.code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ exists: false });
      return;
    }
    const connectedCount = [...room.players.values()].filter((p) => p.connected).length;
    res.json({
      exists: true,
      code: room.code,
      isPublic: room.isPublic,
      mode: room.mode,
      language: room.language,
      packTitle: getLocalizedWordPack(room.packId, room.language).title,
      playerCount: connectedCount,
      phase: room.phase,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let alive = true;
    ws.on('pong', () => {
      alive = true;
    });

    const pingInterval = setInterval(() => {
      if (!alive) {
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, 25000);

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        return;
      }

      if (msg.type === 'room:create') {
        const code = generateRoomCode();
        const playerId = makeId('p');
        const sanitizedAvatar = sanitizeAvatarConfig(msg.avatar, msg.avatarColor || AVATAR_COLORS[0]);
        const player: PlayerConn = {
          id: playerId,
          name: sanitizeName(msg.name),
          avatarColor: sanitizedAvatar.color,
          avatar: sanitizedAvatar,
          score: 0,
          roundDelta: 0,
          hasGuessed: false,
          hasAnsweredTrivia: false,
          connected: true,
          isSpectator: false,
          streak: 0,
          ws,
          triviaChoice: null,
          triviaTimeLeft: 0,
        };

        const room: RoomState = {
          code,
          hostId: playerId,
          isPublic: msg.isPublic !== false,
          mode: msg.mode === 'trivia' ? 'trivia' : 'draw',
          language: normalizeLanguage(msg.language),
          packId: getWordPack(msg.packId).id,
          customWords: Array.isArray(msg.customWords)
            ? msg.customWords.map((w) => w.trim()).filter((w) => w.length >= 2).slice(0, 60)
            : [],
          adFree: Boolean(msg.adFree),
          phase: 'LOBBY',
          round: 1,
          roundsTotal: Math.min(4, Math.max(1, Number(msg.roundsTotal) || 2)),
          turnIndex: 0,
          turnOrder: [],
          roundDuration: Math.min(90, Math.max(30, Number(msg.roundDuration) || 60)),
          timeLeft: 0,
          drawerId: null,
          secretWord: '',
          revealedIndices: new Set(),
          wordOptions: [],
          usedWords: new Set(),
          triviaQueue: [],
          currentTrivia: null,
          strokes: [],
          chat: [
            {
              id: makeId('sys'),
              text: `${player.name} opened room ${code}. Share the invite link!`,
              kind: 'system',
              timestamp: Date.now(),
            },
          ],
          players: new Map([[playerId, player]]),
          sponsorIndex: 0,
          timer: null,
          lastActivity: Date.now(),
        };

        rooms.set(code, room);
        socketMeta.set(ws, { roomCode: code, playerId });
        send(ws, {
          type: 'room:joined',
          playerId,
          state: getPublicStateForPlayer(room, playerId),
        });
        return;
      }

      if (msg.type === 'room:join') {
        const code = String(msg.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          send(ws, { type: 'error', message: `Room "${code}" was not found. Check the code or create a new room.` });
          return;
        }
        const connectedAll = [...room.players.values()].filter((p) => p.connected);
        const activeCount = connectedAll.filter((p) => !p.isSpectator).length;
        const spectatorCount = connectedAll.filter((p) => p.isSpectator).length;
        const wantsSpectate = Boolean(msg.spectate);

        if (!wantsSpectate && activeCount >= MAX_ROOM_PLAYERS) {
          send(ws, {
            type: 'room:full',
            code: room.code,
            activeCount,
            spectatorCount,
          });
          return;
        }

        if (wantsSpectate && spectatorCount >= 24) {
          send(ws, { type: 'error', message: 'Spectator capacity for this room is full.' });
          return;
        }

        const fallbackJoinColor = msg.avatarColor || AVATAR_COLORS[connectedAll.length % AVATAR_COLORS.length];
        const sanitizedAvatar = sanitizeAvatarConfig(msg.avatar, fallbackJoinColor);
        const playerId = makeId('p');
        const player: PlayerConn = {
          id: playerId,
          name: sanitizeName(msg.name),
          avatarColor: sanitizedAvatar.color,
          avatar: sanitizedAvatar,
          score: 0,
          roundDelta: 0,
          hasGuessed: false,
          hasAnsweredTrivia: false,
          connected: true,
          isSpectator: wantsSpectate,
          streak: 0,
          ws,
          triviaChoice: null,
          triviaTimeLeft: 0,
        };

        room.players.set(playerId, player);
        room.lastActivity = Date.now();
        socketMeta.set(ws, { roomCode: code, playerId });

        send(ws, {
          type: 'room:joined',
          playerId,
          state: getPublicStateForPlayer(room, playerId),
        });
        broadcastChat(room, {
          id: makeId('sys'),
          text: wantsSpectate
            ? `${player.name} joined as a spectator.`
            : `${player.name} joined the party.`,
          kind: 'system',
          timestamp: Date.now(),
        });
        broadcastRoomState(room);
        return;
      }

      const meta = socketMeta.get(ws);
      if (!meta) return;
      const room = rooms.get(meta.roomCode);
      const player = room?.players.get(meta.playerId);
      if (!room || !player) return;
      room.lastActivity = Date.now();

      if (msg.type === 'room:claim_spot') {
        if (!player.isSpectator) return;
        const activeCount = [...room.players.values()].filter(
          (p) => p.connected && !p.isSpectator
        ).length;
        if (activeCount >= MAX_ROOM_PLAYERS) {
          send(ws, {
            type: 'error',
            message: 'Room is still full (12/12 players). Hang tight—you will see when a spot opens.',
          });
          return;
        }
        player.isSpectator = false;
        player.hasGuessed = false;
        player.hasAnsweredTrivia = false;
        broadcastChat(room, {
          id: makeId('sys'),
          text: `${player.name} claimed an open player spot!`,
          kind: 'system',
          timestamp: Date.now(),
        });
        broadcastRoomState(room);
        return;
      }

      if (msg.type === 'room:update_settings') {
        if (room.hostId !== player.id || room.phase !== 'LOBBY') return;
        if (msg.mode) room.mode = msg.mode === 'trivia' ? 'trivia' : 'draw';
        if (msg.language) room.language = normalizeLanguage(msg.language);
        if (msg.packId) room.packId = getWordPack(msg.packId).id;
        if (typeof msg.roundsTotal === 'number') {
          room.roundsTotal = Math.min(4, Math.max(1, msg.roundsTotal));
        }
        if (typeof msg.roundDuration === 'number') {
          room.roundDuration = Math.min(90, Math.max(30, msg.roundDuration));
        }
        if (Array.isArray(msg.customWords)) {
          room.customWords = msg.customWords
            .map((w) => w.trim())
            .filter((w) => w.length >= 2)
            .slice(0, 60);
        }
        if (typeof msg.adFree === 'boolean') {
          room.adFree = msg.adFree;
        }
        if (typeof msg.isPublic === 'boolean') {
          room.isPublic = msg.isPublic;
        }
        broadcastRoomState(room);
        return;
      }

      if (msg.type === 'game:start') {
        if (room.hostId !== player.id) return;
        startMatch(room);
        return;
      }

      if (msg.type === 'game:restart') {
        if (room.hostId !== player.id) return;
        clearRoomTimer(room);
        room.phase = 'LOBBY';
        room.strokes = [];
        room.secretWord = '';
        room.drawerId = null;
        for (const p of room.players.values()) {
          p.score = 0;
          p.roundDelta = 0;
          p.hasGuessed = false;
          p.hasAnsweredTrivia = false;
          p.streak = 0;
        }
        broadcastRoomState(room);
        return;
      }

      if (msg.type === 'game:next_turn') {
        if (room.hostId !== player.id || room.phase !== 'ROUND_SUMMARY') return;
        advanceAfterSummary(room);
        return;
      }

      if (msg.type === 'word:select') {
        if (room.phase !== 'WORD_CHOICE' || room.drawerId !== player.id) return;
        if (!room.wordOptions.includes(msg.word)) return;
        beginDrawingPhase(room, msg.word);
        return;
      }

      if (msg.type === 'draw:preview') {
        if (room.phase !== 'DRAWING' || room.drawerId !== player.id) return;
        for (const p of room.players.values()) {
          if (p.id !== player.id) {
            send(p.ws, { type: 'draw:preview', stroke: msg.stroke });
          }
        }
        return;
      }

      if (msg.type === 'draw:stroke') {
        if (room.phase !== 'DRAWING' || room.drawerId !== player.id) return;
        if (!room.strokes.some((s) => s.id === msg.stroke.id)) {
          room.strokes.push(msg.stroke);
        }
        for (const p of room.players.values()) {
          if (p.id !== player.id) {
            send(p.ws, { type: 'draw:stroke', stroke: msg.stroke });
          }
        }
        return;
      }

      if (msg.type === 'draw:undo') {
        if (room.phase !== 'DRAWING' || room.drawerId !== player.id) return;
        room.strokes.pop();
        for (const p of room.players.values()) {
          send(p.ws, { type: 'draw:sync_strokes', strokes: room.strokes });
        }
        return;
      }

      if (msg.type === 'draw:clear') {
        if (room.phase !== 'DRAWING' || room.drawerId !== player.id) return;
        room.strokes = [];
        for (const p of room.players.values()) {
          send(p.ws, { type: 'draw:sync_strokes', strokes: room.strokes });
        }
        return;
      }

      if (msg.type === 'chat:guess') {
        const text = String(msg.text || '').trim().slice(0, 80);
        if (!text) return;

        if (player.isSpectator && (room.phase === 'DRAWING' || room.phase === 'TRIVIA')) {
          send(ws, {
            type: 'chat:entry',
            entry: {
              id: makeId('sys'),
              text: 'Spectators send emoji reactions during live rounds.',
              kind: 'system',
              timestamp: Date.now(),
            },
          });
          return;
        }

        if (
          !player.isSpectator &&
          room.mode === 'draw' &&
          room.phase === 'DRAWING' &&
          room.drawerId !== player.id &&
          !player.hasGuessed
        ) {
          const normalizeText = (s: string) =>
            s
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/\s+/g, ' ');
          const normalizedGuess = normalizeText(text);
          const normalizedTarget = normalizeText(room.secretWord);

          if (normalizedGuess === normalizedTarget) {
            player.hasGuessed = true;
            player.streak += 1;
            const speedBonus = Math.round((room.timeLeft / room.roundDuration) * 180);
            const baseGained = 120 + speedBonus + Math.min(60, (player.streak - 1) * 20);
            const hasBoost = hasDailyChallengeBadge(player.name);
            const gained = hasBoost ? Math.round(baseGained * DAILY_CHALLENGE_MULTIPLIER) : baseGained;
            player.score += gained;
            player.roundDelta = gained;
            if (room.isPublic) {
              recordPublicPoints(player.name, player.avatarColor, gained, player.avatar);
            }

            const drawer = room.drawerId ? room.players.get(room.drawerId) : null;
            if (drawer) {
              const drawerGain = hasDailyChallengeBadge(drawer.name)
                ? Math.round(50 * DAILY_CHALLENGE_MULTIPLIER)
                : 50;
              drawer.score += drawerGain;
              drawer.roundDelta += drawerGain;
              if (room.isPublic) {
                recordPublicPoints(drawer.name, drawer.avatarColor, drawerGain, drawer.avatar);
              }
            }

            broadcastChat(room, {
              id: makeId('win'),
              playerId: player.id,
              playerName: player.name,
              playerColor: player.avatarColor,
              text: hasBoost
                ? `${player.name} guessed the word! (+${gained} pts · 1.5x Daily Boost)`
                : `${player.name} guessed the word! (+${gained} pts)`,
              kind: 'correct',
              timestamp: Date.now(),
            });

            const guessers = [...room.players.values()].filter(
              (p) => p.connected && !p.isSpectator && p.id !== room.drawerId
            );
            const allGuessed = guessers.length > 0 && guessers.every((p) => p.hasGuessed);
            if (allGuessed) {
              finishTurnToSummary(room);
            } else {
              broadcastRoomState(room);
            }
            return;
          }

          if (normalizedTarget.length >= 4 && levenshtein(normalizedGuess, normalizedTarget) <= 2) {
            send(ws, {
              type: 'chat:entry',
              entry: {
                id: makeId('close'),
                text: `"${text}" is super close!`,
                kind: 'close',
                timestamp: Date.now(),
              },
            });
            return;
          }
        }

        // Prevent spoilers from drawer or players who already guessed
        if (
          room.mode === 'draw' &&
          room.phase === 'DRAWING' &&
          (room.drawerId === player.id || player.hasGuessed) &&
          text.toLowerCase().includes(room.secretWord.toLowerCase())
        ) {
          send(ws, {
            type: 'chat:entry',
            entry: {
              id: makeId('blk'),
              text: 'Shh—keep the secret word hidden from other guessers!',
              kind: 'system',
              timestamp: Date.now(),
            },
          });
          return;
        }

        broadcastChat(room, {
          id: makeId('msg'),
          playerId: player.id,
          playerName: player.name,
          playerColor: player.avatarColor,
          text,
          kind: 'chat',
          timestamp: Date.now(),
        });
        return;
      }

      if (msg.type === 'chat:reaction') {
        const emoji = String(msg.emoji || '');
        if (!(QUICK_REACTIONS as readonly string[]).includes(emoji)) return;
        broadcastChat(room, {
          id: makeId('rxn'),
          playerId: player.id,
          playerName: player.name,
          playerColor: player.avatarColor,
          text: emoji,
          kind: 'reaction',
          timestamp: Date.now(),
        });
        return;
      }

      if (msg.type === 'trivia:answer') {
        if (player.isSpectator || room.mode !== 'trivia' || room.phase !== 'TRIVIA' || player.hasAnsweredTrivia) return;
        if (msg.optionIndex < 0 || msg.optionIndex > 3) return;
        player.hasAnsweredTrivia = true;
        player.triviaChoice = msg.optionIndex;
        player.triviaTimeLeft = room.timeLeft;

        const activeConnected = [...room.players.values()].filter((p) => p.connected && !p.isSpectator);
        if (activeConnected.length > 0 && activeConnected.every((p) => p.hasAnsweredTrivia)) {
          finishTurnToSummary(room);
        } else {
          broadcastRoomState(room);
        }
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      handleDisconnect(ws);
    });
  });

  // Clean up idle rooms older than 30 minutes
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
      const hasConnected = [...room.players.values()].some((p) => p.connected);
      if (!hasConnected && room.lastActivity < cutoff) {
        clearRoomTimer(room);
        rooms.delete(code);
      }
    }
  }, 60000);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SketchDash server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
