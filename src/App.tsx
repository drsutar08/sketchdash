import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AVATAR_COLORS,
  DEFAULT_AVATAR_CONFIG,
  WORD_PACKS,
  normalizeLanguage,
  sanitizeAvatarConfig,
  type AvatarConfig,
  type ClientMessage,
  type DailyChallengeState,
  type DrawStroke,
  type GameMode,
  type RoomPublicState,
  type ServerMessage,
  type SupportedLanguage,
} from '../shared/gameData';
import { DailyChallengeView } from './components/DailyChallengeView';
import { PackStoreModal } from './components/PackStoreModal';
import { RoomStage } from './components/RoomStage';
import { SoloWarmupView } from './components/SoloWarmupView';
import { TitleScreen } from './components/TitleScreen';
import { TopPlayersLeaderboard } from './components/TopPlayersLeaderboard';
import { soundEngine } from './utils/sound';

const STORAGE_KEY = 'sketchdash_profile_v1';

interface StoredProfile {
  name: string;
  avatarColor: string;
  avatar: AvatarConfig;
  unlockedPackIds: string[];
  adFree: boolean;
  selectedPackId: string;
  customWords: string[];
  language: SupportedLanguage;
}

function loadProfile(): StoredProfile {
  const fallback: StoredProfile = {
    name: '',
    avatarColor: AVATAR_COLORS[0],
    avatar: DEFAULT_AVATAR_CONFIG,
    unlockedPackIds: ['classic', 'hostel', 'pop_culture'],
    adFree: false,
    selectedPackId: 'hostel',
    customWords: ['Room 304 Raid', 'Missing Charger', 'Hostel Cat', 'Midnight Maggi'],
    language: 'en',
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredProfile>;
    const avatar = sanitizeAvatarConfig(parsed.avatar, parsed.avatarColor);
    return {
      name: typeof parsed.name === 'string' ? parsed.name : fallback.name,
      avatarColor: avatar.color,
      avatar,
      unlockedPackIds: Array.isArray(parsed.unlockedPackIds)
        ? parsed.unlockedPackIds
        : fallback.unlockedPackIds,
      adFree: Boolean(parsed.adFree),
      selectedPackId: typeof parsed.selectedPackId === 'string' ? parsed.selectedPackId : fallback.selectedPackId,
      customWords: Array.isArray(parsed.customWords) ? parsed.customWords : fallback.customWords,
      language: normalizeLanguage(parsed.language),
    };
  } catch {
    return fallback;
  }
}

function getInitialRoomCodeFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

export default function App() {
  const [profile, setProfile] = useState<StoredProfile>(loadProfile);
  const [initialRoomCode] = useState<string>(getInitialRoomCodeFromUrl);
  const [room, setRoom] = useState<RoomPublicState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [livePreviewStroke, setLivePreviewStroke] = useState<DrawStroke | null>(null);
  const [soloWarmup, setSoloWarmup] = useState(false);
  const [dailyModeActive, setDailyModeActive] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeState | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [draftName, setDraftName] = useState(profile.name);
  const [storeOpen, setStoreOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fullRoomOffer, setFullRoomOffer] = useState<{
    code: string;
    activeCount: number;
    spectatorCount: number;
  } | null>(null);
  const [connecting, setConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchDailyChallenge = useCallback(async (lang: SupportedLanguage, playerName: string) => {
    setDailyLoading(true);
    try {
      const cleaned = playerName.trim() || 'Player';
      const res = await fetch(
        `/api/daily-challenge?lang=${encodeURIComponent(lang)}&player=${encodeURIComponent(cleaned)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as DailyChallengeState;
      setDailyChallenge(data);
    } catch {
      // Keep previous daily challenge state if offline
    } finally {
      setDailyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (room || soloWarmup || dailyModeActive) return;
    const timer = window.setTimeout(() => {
      fetchDailyChallenge(profile.language, draftName || profile.name);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [room, soloWarmup, dailyModeActive, profile.language, profile.name, draftName, fetchDailyChallenge]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota issues
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = profile.language;
    }
  }, [profile]);

  const sendWs = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(msg));
    return true;
  }, []);

  const connectAndSend = useCallback((initialMessage: ClientMessage) => {
    setErrorMsg(null);
    setConnecting(true);

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnecting(false);
      ws.send(JSON.stringify(initialMessage));
    };

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      if (msg.type === 'room:joined') {
        setFullRoomOffer(null);
        setPlayerId(msg.playerId);
        setRoom(msg.state);
        setLivePreviewStroke(null);
        window.history.replaceState(null, '', `?room=${msg.state.code}`);
        return;
      }

      if (msg.type === 'room:full') {
        setConnecting(false);
        setErrorMsg(null);
        setFullRoomOffer({
          code: msg.code,
          activeCount: msg.activeCount,
          spectatorCount: msg.spectatorCount,
        });
        return;
      }

      if (msg.type === 'room:state') {
        setRoom((prev) => {
          if (prev && prev.phase !== 'ROUND_SUMMARY' && msg.state.phase === 'ROUND_SUMMARY') {
            soundEngine.playRoundEnd();
          }
          return msg.state;
        });
        setLivePreviewStroke(null);
        return;
      }

      if (msg.type === 'draw:preview') {
        setLivePreviewStroke(msg.stroke);
        return;
      }

      if (msg.type === 'draw:stroke') {
        setLivePreviewStroke(null);
        setRoom((prev) => {
          if (!prev) return prev;
          if (prev.strokes.some((s) => s.id === msg.stroke.id)) return prev;
          return { ...prev, strokes: [...prev.strokes, msg.stroke] };
        });
        return;
      }

      if (msg.type === 'draw:sync_strokes') {
        setLivePreviewStroke(null);
        setRoom((prev) => (prev ? { ...prev, strokes: msg.strokes } : prev));
        return;
      }

      if (msg.type === 'chat:entry') {
        if (msg.entry.kind === 'correct') {
          soundEngine.playCorrect();
        }
        setRoom((prev) => {
          if (!prev) return prev;
          if (prev.chat.some((c) => c.id === msg.entry.id)) return prev;
          return { ...prev, chat: [...prev.chat, msg.entry].slice(-80) };
        });
        return;
      }

      if (msg.type === 'timer:tick') {
        if (msg.timeLeft > 0 && msg.timeLeft <= 5) {
          soundEngine.playTick(true);
        }
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                timeLeft: msg.timeLeft,
                wordMask: msg.wordMask ?? prev.wordMask,
              }
            : prev
        );
        return;
      }

      if (msg.type === 'error') {
        setErrorMsg(msg.message);
        setConnecting(false);
      }
    };

    ws.onerror = () => {
      setConnecting(false);
      setErrorMsg('Unable to connect to the game server. Please try again.');
    };

    ws.onclose = () => {
      setConnecting(false);
    };
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    soundEngine.muted = next;
    setMuted(next);
    if (!next) soundEngine.playClick();
  };

  const handleCreateRoom = ({
    name,
    avatar,
    mode,
    isPublic,
  }: {
    name: string;
    avatar: AvatarConfig;
    mode: GameMode;
    isPublic: boolean;
  }) => {
    setFullRoomOffer(null);
    setProfile((prev) => ({ ...prev, name, avatarColor: avatar.color, avatar }));
    connectAndSend({
      type: 'room:create',
      name,
      avatarColor: avatar.color,
      avatar,
      mode,
      language: profile.language,
      packId: profile.selectedPackId,
      roundsTotal: 2,
      roundDuration: 60,
      customWords: profile.customWords,
      adFree: profile.adFree,
      isPublic,
    });
  };

  const handleJoinRoom = ({
    name,
    avatar,
    code,
    spectate,
  }: {
    name: string;
    avatar: AvatarConfig;
    code: string;
    spectate?: boolean;
  }) => {
    setFullRoomOffer(null);
    setProfile((prev) => ({ ...prev, name, avatarColor: avatar.color, avatar }));
    connectAndSend({
      type: 'room:join',
      code,
      name,
      avatarColor: avatar.color,
      avatar,
      spectate,
    });
  };

  const handleLeaveRoom = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setRoom(null);
    setPlayerId(null);
    setFullRoomOffer(null);
    setLivePreviewStroke(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const handleCommitStroke = (stroke: DrawStroke) => {
    setRoom((prev) => {
      if (!prev) return prev;
      if (prev.strokes.some((s) => s.id === stroke.id)) return prev;
      return { ...prev, strokes: [...prev.strokes, stroke] };
    });
    sendWs({ type: 'draw:stroke', stroke });
  };

  const handlePreviewStroke = (stroke: DrawStroke) => {
    sendWs({ type: 'draw:preview', stroke });
  };

  const handleUndoStroke = () => {
    setRoom((prev) => (prev ? { ...prev, strokes: prev.strokes.slice(0, -1) } : prev));
    sendWs({ type: 'draw:undo' });
  };

  const handleClearCanvas = () => {
    setRoom((prev) => (prev ? { ...prev, strokes: [] } : prev));
    sendWs({ type: 'draw:clear' });
  };

  const handleUnlockPack = (packId: string) => {
    setProfile((prev) => ({
      ...prev,
      unlockedPackIds: prev.unlockedPackIds.includes(packId)
        ? prev.unlockedPackIds
        : [...prev.unlockedPackIds, packId],
      selectedPackId: packId,
    }));
    if (room && playerId === room.hostId) {
      sendWs({ type: 'room:update_settings', packId });
    }
  };

  const handleUnlockProPass = () => {
    const allIds = WORD_PACKS.map((p) => p.id);
    setProfile((prev) => ({
      ...prev,
      unlockedPackIds: allIds,
      adFree: true,
    }));
    if (room && playerId === room.hostId) {
      sendWs({ type: 'room:update_settings', adFree: true });
    }
  };

  const handleSelectPack = (packId: string) => {
    setProfile((prev) => ({ ...prev, selectedPackId: packId }));
    if (room && playerId === room.hostId) {
      sendWs({ type: 'room:update_settings', packId });
    }
  };

  const handleSaveCustomWords = (words: string[]) => {
    setProfile((prev) => ({ ...prev, customWords: words }));
    if (room && playerId === room.hostId) {
      sendWs({ type: 'room:update_settings', customWords: words, packId: 'custom' });
    }
  };

  const handleChangeLanguage = (language: SupportedLanguage) => {
    setProfile((prev) => ({ ...prev, language }));
  };

  return (
    <>
      {room && playerId ? (
        <RoomStage
          room={room}
          playerId={playerId}
          language={profile.language}
          livePreviewStroke={livePreviewStroke}
          unlockedPackIds={profile.unlockedPackIds}
          adFree={profile.adFree}
          muted={muted}
          onToggleMute={handleToggleMute}
          onLeaveRoom={handleLeaveRoom}
          onOpenStore={() => setStoreOpen(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onUpdateSettings={(settings) => sendWs({ type: 'room:update_settings', ...settings })}
          onStartGame={() => sendWs({ type: 'game:start' })}
          onRestartGame={() => sendWs({ type: 'game:restart' })}
          onNextTurn={() => sendWs({ type: 'game:next_turn' })}
          onSelectWord={(word) => sendWs({ type: 'word:select', word })}
          onCommitStroke={handleCommitStroke}
          onPreviewStroke={handlePreviewStroke}
          onUndoStroke={handleUndoStroke}
          onClearCanvas={handleClearCanvas}
          onSendChat={(text) => sendWs({ type: 'chat:guess', text })}
          onSendReaction={(emoji) => sendWs({ type: 'chat:reaction', emoji })}
          onAnswerTrivia={(optionIndex) => sendWs({ type: 'trivia:answer', optionIndex })}
          onClaimSpot={() => sendWs({ type: 'room:claim_spot' })}
        />
      ) : dailyModeActive && dailyChallenge ? (
        <DailyChallengeView
          challenge={dailyChallenge}
          playerName={profile.name || draftName || 'Player'}
          avatar={profile.avatar}
          language={profile.language}
          muted={muted}
          onToggleMute={handleToggleMute}
          onCompleteSuccess={(_awardedBonus, updatedState) => {
            setDailyChallenge(updatedState);
          }}
          onExit={() => {
            setDailyModeActive(false);
            fetchDailyChallenge(profile.language, profile.name || draftName);
          }}
        />
      ) : soloWarmup ? (
        <SoloWarmupView
          packId={profile.selectedPackId}
          language={profile.language}
          customWords={profile.customWords}
          muted={muted}
          onToggleMute={handleToggleMute}
          onExit={() => setSoloWarmup(false)}
        />
      ) : (
        <TitleScreen
          initialRoomCode={initialRoomCode}
          initialName={profile.name}
          initialAvatar={profile.avatar}
          selectedPackId={profile.selectedPackId}
          language={profile.language}
          muted={muted}
          errorMsg={errorMsg}
          fullRoomOffer={fullRoomOffer}
          connecting={connecting}
          dailyChallenge={dailyChallenge}
          dailyLoading={dailyLoading}
          onNameChange={setDraftName}
          onChangeLanguage={handleChangeLanguage}
          onToggleMute={handleToggleMute}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onOpenStore={() => setStoreOpen(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onStartSoloWarmup={() => setSoloWarmup(true)}
          onStartDailyChallenge={({ name, avatar }) => {
            const cleanName = name.trim() || 'Player';
            setProfile((prev) => ({
              ...prev,
              name: cleanName,
              avatarColor: avatar.color,
              avatar,
            }));
            setDraftName(cleanName);
            setDailyModeActive(true);
          }}
        />
      )}

      <TopPlayersLeaderboard
        isOpen={leaderboardOpen}
        language={profile.language}
        onClose={() => setLeaderboardOpen(false)}
      />

      <PackStoreModal
        isOpen={storeOpen}
        language={room ? room.language : profile.language}
        onClose={() => setStoreOpen(false)}
        unlockedPackIds={profile.unlockedPackIds}
        adFree={profile.adFree}
        selectedPackId={room ? room.packId : profile.selectedPackId}
        customWords={profile.customWords}
        onUnlockPack={handleUnlockPack}
        onUnlockProPass={handleUnlockProPass}
        onSelectPack={handleSelectPack}
        onSaveCustomWords={handleSaveCustomWords}
      />
    </>
  );
}
