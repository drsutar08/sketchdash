import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Crown,
  Eye,
  Flame,
  Keyboard,
  LogOut,
  Package,
  Palette,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  MAX_ROOM_PLAYERS,
  QUICK_REACTIONS,
  SUPPORTED_LANGUAGES,
  getLocalizedWordPacks,
  getWordPack,
  type ChatEntry,
  type DrawStroke,
  type GameMode,
  type RoomPublicState,
  type SupportedLanguage,
} from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';
import { DrawingCanvas } from './DrawingCanvas';
import { ProceduralAvatar } from './ProceduralAvatar';

interface RoomStageProps {
  room: RoomPublicState;
  playerId: string;
  language: SupportedLanguage;
  livePreviewStroke: DrawStroke | null;
  unlockedPackIds: string[];
  adFree: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLeaveRoom: () => void;
  onOpenStore: () => void;
  onOpenLeaderboard: () => void;
  onUpdateSettings: (settings: {
    mode?: GameMode;
    language?: SupportedLanguage;
    packId?: string;
    roundsTotal?: number;
    roundDuration?: number;
    isPublic?: boolean;
  }) => void;
  onStartGame: () => void;
  onRestartGame: () => void;
  onNextTurn: () => void;
  onSelectWord: (word: string) => void;
  onCommitStroke: (stroke: DrawStroke) => void;
  onPreviewStroke: (stroke: DrawStroke) => void;
  onUndoStroke: () => void;
  onClearCanvas: () => void;
  onSendChat: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onAnswerTrivia: (optionIndex: number) => void;
  onClaimSpot: () => void;
}

const ConfettiOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const palette = ['#FF5A36', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];
    const particles = Array.from({ length: 75 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 260,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2.5 + Math.random() * 4,
      size: 6 + Math.random() * 6,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.16,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    let rafId = 0;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        if (p.y < canvas.height + 30) active = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (active) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-40" />;
};

export const RoomStage: React.FC<RoomStageProps> = ({
  room,
  playerId,
  language,
  livePreviewStroke,
  unlockedPackIds,
  muted,
  onToggleMute,
  onLeaveRoom,
  onOpenStore,
  onOpenLeaderboard,
  onUpdateSettings,
  onStartGame,
  onRestartGame,
  onNextTurn,
  onSelectWord,
  onCommitStroke,
  onPreviewStroke,
  onUndoStroke,
  onClearCanvas,
  onSendChat,
  onSendReaction,
  onAnswerTrivia,
  onClaimSpot,
}) => {
  const [guessText, setGuessText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTriviaOpt, setSelectedTriviaOpt] = useState<number | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const t = getUIText(language);
  const localizedLobbyPacks = useMemo(
    () => getLocalizedWordPacks(room.language || language),
    [room.language, language]
  );

  const isHost = room.hostId === playerId;
  const isDrawer = room.drawerId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const isSpectator = Boolean(me?.isSpectator);
  const connectedPlayers = room.players.filter((p) => p.connected);
  const activePlayers = connectedPlayers.filter((p) => !p.isSpectator);
  const spectators = connectedPlayers.filter((p) => p.isSpectator);
  const drawerPlayer = room.players.find((p) => p.id === room.drawerId);

  const copyTimeoutRef = useRef<number | null>(null);

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', room.code);
    return url.toString();
  }, [room.code]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chat]);

  useEffect(() => {
    if (room.phase === 'TRIVIA') {
      setSelectedTriviaOpt(null);
    }
    if (room.phase === 'GAME_OVER') {
      soundEngine.playVictory();
    }
  }, [room.phase, room.triviaQuestion?.id]);

  const handleCopyInvite = useCallback(async () => {
    soundEngine.playClick();
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (copied) {
      setCopiedLink(true);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [inviteUrl]);

  const submitChatMessage = useCallback(() => {
    if (isSpectator && (room.phase === 'DRAWING' || room.phase === 'TRIVIA')) return;
    const cleaned = guessText.trim();
    if (!cleaned) return;
    onSendChat(cleaned);
    setGuessText('');
  }, [guessText, isSpectator, room.phase, onSendChat]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitChatMessage();
  };

  useEffect(() => {
    const handleRoomKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shortcutsOpen) {
          e.preventDefault();
          setShortcutsOpen(false);
          return;
        }
        if (document.activeElement === chatInputRef.current) {
          chatInputRef.current?.blur();
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        e.preventDefault();
        submitChatMessage();
        return;
      }

      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        soundEngine.playClick();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        chatInputRef.current?.focus();
        return;
      }

      const lower = e.key.toLowerCase();
      if (lower === 'm') {
        e.preventDefault();
        onToggleMute();
        return;
      }

      if (lower === 'l') {
        e.preventDefault();
        handleCopyInvite();
        return;
      }

      if (
        room.phase === 'TRIVIA' &&
        room.triviaQuestion &&
        !isSpectator &&
        !me?.hasAnsweredTrivia &&
        ['1', '2', '3', '4'].includes(e.key)
      ) {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < room.triviaQuestion.options.length) {
          e.preventDefault();
          soundEngine.playClick();
          setSelectedTriviaOpt(idx);
          onAnswerTrivia(idx);
        }
        return;
      }

      if (
        room.phase === 'WORD_CHOICE' &&
        isDrawer &&
        room.wordOptions &&
        ['1', '2', '3'].includes(e.key)
      ) {
        const idx = Number(e.key) - 1;
        const chosenWord = room.wordOptions[idx];
        if (chosenWord) {
          e.preventDefault();
          soundEngine.playClick();
          onSelectWord(chosenWord);
        }
      }
    };

    window.addEventListener('keydown', handleRoomKeyDown);
    return () => window.removeEventListener('keydown', handleRoomKeyDown);
  }, [
    shortcutsOpen,
    submitChatMessage,
    onToggleMute,
    handleCopyInvite,
    room.phase,
    room.triviaQuestion,
    room.wordOptions,
    isSpectator,
    isDrawer,
    me?.hasAnsweredTrivia,
    onAnswerTrivia,
    onSelectWord,
  ]);

  const sortedPlayers = useMemo(
    () =>
      [...activePlayers].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      }),
    [activePlayers]
  );

  const renderHeaderCenter = () => {
    if (room.phase === 'LOBBY') {
      return (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <span className="font-semibold text-white">
            {room.mode === 'draw' ? t.common.drawAndGuess : t.common.triviaBlitz}
          </span>
          <span aria-hidden="true">·</span>
          <span>{room.isPublic ? t.common.publicLabel : t.common.privateLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{room.packTitle}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {activePlayers.length}/{MAX_ROOM_PLAYERS} {t.room.playersCountSuffix}
          </span>
        </div>
      );
    }

    if (room.mode === 'draw' && room.phase === 'DRAWING') {
      if (isDrawer && room.secretWord) {
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400">{t.room.drawLabel}</span>
            <span className="font-display text-lg font-bold text-[#FF5A36]">
              {room.secretWord}
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3">
          <span className="font-mono text-base sm:text-lg font-bold tracking-[0.22em] text-white">
            {room.wordMask}
          </span>
          <span className="text-xs text-slate-400 tabular-nums hidden sm:inline">
            ({room.wordLength} {t.room.lettersLabel})
          </span>
        </div>
      );
    }

    if (room.phase === 'WORD_CHOICE') {
      return (
        <div className="text-xs sm:text-sm text-slate-300">
          <span className="font-semibold text-white">{drawerPlayer?.name || 'Drawer'}</span>{' '}
          {t.room.isPickingWord}
        </div>
      );
    }

    if (room.mode === 'trivia') {
      return (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
          <span className="font-semibold text-white tabular-nums">
            {t.room.questionOf} {room.round} {t.room.ofWord} {room.roundsTotal}
          </span>
          <span aria-hidden="true">·</span>
          <span>{room.packTitle}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
        <span className="font-semibold text-white tabular-nums">
          {t.room.roundOf} {room.round} {t.room.ofWord} {room.roundsTotal}
        </span>
        <span aria-hidden="true">·</span>
        <span>{room.packTitle}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#14171F] flex flex-col">
      {room.phase === 'GAME_OVER' && <ConfettiOverlay />}

      <header className="px-4 sm:px-6 py-2.5 border-b border-white/8 bg-[#181C26] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 36 36" className="w-7 h-7 shrink-0" aria-hidden="true">
              <rect x="2" y="2" width="32" height="32" rx="8" fill="#FF5A36" />
              <path d="M10 26 L14 14 L23 9 L26 12 L21 21 Z" fill="#FCFBF7" />
            </svg>
            <span className="font-display text-base font-bold text-white whitespace-nowrap shrink-0">
              SketchDash
            </span>
          </div>

          <span className="text-slate-600" aria-hidden="true">/</span>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-wider text-slate-200 tabular-nums">
              {room.code}
            </span>
            <button
              type="button"
              onClick={handleCopyInvite}
              title={`${t.room.copyInviteLink} (${inviteUrl})`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/8 hover:bg-white/14 text-white'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t.room.linkCopied : t.room.copyInviteLink}</span>
            </button>
          </div>
        </div>

        <div className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-center">
          {renderHeaderCenter()}
        </div>

        <div className="order-2 sm:order-3 flex items-center gap-2">
          {room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER' && (
            <>
              {!isSpectator && me?.hasDailyBadge && (
                <div
                  title={t.daily.badgeTooltip}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/12 border border-amber-400/35 text-xs font-bold text-amber-300 tabular-nums whitespace-nowrap shrink-0"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>1.5x</span>
                </div>
              )}
              {!isSpectator && (
                <div
                  aria-label={`${t.room.streak}: ${me?.streak ?? 0}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-transform duration-150 ${
                    (me?.streak ?? 0) >= 2
                      ? 'bg-amber-500/12 border-amber-400/35 text-amber-300'
                      : (me?.streak ?? 0) === 1
                      ? 'bg-[#14171F] border-white/12 text-slate-200'
                      : 'bg-[#14171F] border-white/8 text-slate-400'
                  }`}
                >
                  <Flame
                    className={`w-3.5 h-3.5 shrink-0 ${
                      (me?.streak ?? 0) >= 2
                        ? 'text-amber-400'
                        : (me?.streak ?? 0) === 1
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>
                    {t.room.streak} {me?.streak ?? 0}
                  </span>
                </div>
              )}
              <div
                className={`font-mono text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg bg-[#14171F] border border-white/8 ${
                  room.timeLeft <= 10 ? 'text-rose-400' : 'text-white'
                }`}
              >
                {room.timeLeft}s
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenLeaderboard();
            }}
            title={t.common.topPlayers}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14171F] hover:bg-white/10 border border-white/8 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.common.topPlayers}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenStore();
            }}
            title={t.common.wordPacks}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14171F] hover:bg-white/10 border border-white/8 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span className="hidden md:inline">{t.common.packs}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShortcutsOpen(true);
            }}
            title={`${t.shortcuts.title} (?)`}
            aria-label={t.shortcuts.title}
            className="p-2 rounded-lg bg-[#14171F] hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            title={`${muted ? t.common.unmuteSound : t.common.muteSound} (M)`}
            aria-label={muted ? t.common.unmuteSound : t.common.muteSound}
            className="p-2 rounded-lg bg-[#14171F] hover:bg-white/10 border border-white/8 text-slate-300 hover:text-white cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onLeaveRoom();
            }}
            title={t.room.leaveRoom}
            className="p-2 rounded-lg bg-[#14171F] hover:bg-rose-500/20 border border-white/8 text-slate-300 hover:text-rose-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[230px_1fr_300px] gap-4 p-4 max-w-[1440px] w-full mx-auto">
        <aside className="rounded-2xl bg-[#1A1E28] border border-white/8 p-3.5 flex flex-col gap-2.5 order-2 lg:order-1">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/6">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{t.room.players}</span>
            </span>
            <span className="tabular-nums">
              {activePlayers.length}/{MAX_ROOM_PLAYERS}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[260px] lg:max-h-[460px]">
            {sortedPlayers.map((p, idx) => {
              const pIsHost = p.id === room.hostId;
              const pIsDrawer = room.mode === 'draw' && p.id === room.drawerId && room.phase !== 'LOBBY';
              const pIsMe = p.id === playerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border transition-colors ${
                    p.hasGuessed
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : pIsDrawer
                      ? 'bg-[#FF5A36]/10 border-[#FF5A36]/30'
                      : 'bg-[#14171F]/70 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProceduralAvatar
                      avatar={p.avatar}
                      color={p.avatarColor}
                      name={p.name}
                      className="w-8 h-8"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                        <span className="truncate">{p.name}</span>
                        {p.hasDailyBadge && (
                          <span title={t.daily.badgeTooltip} className="inline-flex shrink-0">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                        {pIsMe && <span className="text-slate-400 font-normal shrink-0">{t.common.youTag}</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 flex-wrap">
                        {pIsHost && (
                          <span className="inline-flex items-center gap-0.5 text-amber-300">
                            <Crown className="w-3 h-3" />
                            {t.room.host}
                          </span>
                        )}
                        {pIsDrawer && (
                          <span className="inline-flex items-center gap-0.5 text-[#FF5A36]">
                            <Palette className="w-3 h-3" />
                            {t.room.drawing}
                          </span>
                        )}
                        {p.hasGuessed && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-400">
                            <Check className="w-3 h-3" />
                            {t.room.guessed}
                          </span>
                        )}
                        {room.mode === 'trivia' && p.hasAnsweredTrivia && room.phase === 'TRIVIA' && (
                          <span className="text-emerald-400">{t.room.lockedIn}</span>
                        )}
                        {!pIsHost && !pIsDrawer && !p.hasGuessed && !(room.mode === 'trivia' && p.hasAnsweredTrivia) && (
                          <span>#{idx + 1}</span>
                        )}
                        {p.streak >= 2 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 text-amber-300 font-medium tabular-nums">
                              <Flame className="w-3 h-3 text-amber-400" />
                              {p.streak}x
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-white tabular-nums">
                      {p.score}
                    </div>
                    {p.roundDelta > 0 && (
                      <div className="font-mono text-[10px] text-emerald-400 tabular-nums">
                        +{p.roundDelta}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {spectators.length > 0 && (
            <div className="pt-2 border-t border-white/6 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{t.room.spectators}</span>
                </span>
                <span className="tabular-nums">{spectators.length}</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {spectators.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-[#14171F]/50 text-xs text-slate-300"
                  >
                    <span className="truncate">
                      {s.name}
                      {s.id === playerId && <span className="text-slate-500 ml-1">{t.common.youTag}</span>}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">{t.room.watching}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="order-1 lg:order-2 flex flex-col justify-center gap-3 min-w-0">
          {isSpectator && (
            <div className="px-4 py-2.5 rounded-xl bg-[#1A1E28] border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-200">
                <Eye className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span>{t.room.spectatorModeBanner}</span>
              </div>
              {activePlayers.length < MAX_ROOM_PLAYERS ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onClaimSpot();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {t.room.joinOpenSpot}
                </button>
              ) : (
                <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                  {t.room.roomFullLabel} ({activePlayers.length}/{MAX_ROOM_PLAYERS})
                </span>
              )}
            </div>
          )}
          {room.phase === 'LOBBY' && (
            <div className="rounded-2xl bg-[#1A1E28] border border-white/8 p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/8">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    {t.room.partyLobby} {room.code}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    {t.room.lobbySubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="px-4 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#e84b29] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? t.room.linkCopied : t.room.copyInviteLink}</span>
                </button>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#14171F] border border-white/8 flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-slate-300 truncate">{inviteUrl}</span>
                <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">{t.room.shareUrl}</span>
              </div>

              {isHost ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        {t.room.gameMode}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#14171F]">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onUpdateSettings({ mode: 'draw' });
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            room.mode === 'draw' ? 'bg-[#FF5A36] text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.common.drawAndGuess}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            onUpdateSettings({ mode: 'trivia' });
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            room.mode === 'trivia' ? 'bg-[#FF5A36] text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.common.triviaBlitz}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        {t.room.wordTriviaPack}
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={room.packId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            const p = getWordPack(nextId);
                            if (p.tier !== 'free' && !unlockedPackIds.includes(p.id)) {
                              onOpenStore();
                              return;
                            }
                            soundEngine.playClick();
                            onUpdateSettings({ packId: nextId });
                          }}
                          className="flex-1 h-10 px-3 rounded-xl bg-[#14171F] border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-[#FF5A36]"
                        >
                          {localizedLobbyPacks.map((p) => {
                            const locked = p.tier !== 'free' && !unlockedPackIds.includes(p.id);
                            return (
                              <option key={p.id} value={p.id}>
                                {p.title} {locked ? t.room.lockedStoreSuffix : ''}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={onOpenStore}
                          className="h-10 px-3 rounded-xl bg-[#14171F] hover:bg-white/10 border border-white/10 text-xs font-medium text-amber-300 whitespace-nowrap cursor-pointer"
                        >
                          {t.room.storeBtn}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        {t.room.rounds}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#14171F]">
                        {[1, 2, 3].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              onUpdateSettings({ roundsTotal: r });
                            }}
                            className={`py-1.5 rounded-lg text-xs font-semibold tabular-nums cursor-pointer ${
                              room.roundsTotal === r ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {r} {r === 1 ? t.room.roundSingular : t.room.roundPlural}
                          </button>
                        ))}
                      </div>
                    </div>

                    {room.mode === 'draw' ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          {t.room.drawTimer}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#14171F]">
                          {[45, 60, 75].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                soundEngine.playClick();
                                onUpdateSettings({ roundDuration: sec });
                              }}
                              className={`py-1.5 rounded-lg text-xs font-semibold tabular-nums cursor-pointer ${
                                room.roundDuration === sec ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          {t.room.packLanguage}
                        </label>
                        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#14171F]">
                          {SUPPORTED_LANGUAGES.map((opt) => (
                            <button
                              key={opt.code}
                              type="button"
                              onClick={() => {
                                soundEngine.playClick();
                                onUpdateSettings({ language: opt.code });
                              }}
                              className={`py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                                room.language === opt.code
                                  ? 'bg-white/15 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {opt.shortCode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {room.mode === 'draw' && (
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-xs font-medium text-slate-300">
                        {t.room.packLanguage}
                      </span>
                      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#14171F] shrink-0">
                        {SUPPORTED_LANGUAGES.map((opt) => (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              onUpdateSettings({ language: opt.code });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                              room.language === opt.code
                                ? 'bg-white/15 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.shortCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div>
                      <div className="text-xs font-medium text-slate-300">
                        {t.room.publicLeaderboardTitle}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.room.publicLeaderboardDesc}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#14171F] shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onUpdateSettings({ isPublic: true });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          room.isPublic ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.common.publicLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onUpdateSettings({ isPublic: false });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          !room.isPublic ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.common.privateLabel}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      {activePlayers.length < 2
                        ? t.room.needPlayersHint
                        : `${activePlayers.length} ${t.room.playersReadySuffix}`}
                    </span>
                    <button
                      type="button"
                      disabled={activePlayers.length < 2}
                      onClick={() => {
                        soundEngine.playClick();
                        onStartGame();
                      }}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>{t.room.startParty}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#14171F] border border-white/8 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t.room.waitingForHost}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {room.mode === 'draw' ? t.common.drawAndGuess : t.common.triviaBlitz} · {room.packTitle} · {room.roundsTotal} {room.roundsTotal === 1 ? t.room.roundSingular : t.room.roundPlural}
                    </div>
                  </div>
                </div>
              )}

              {!room.adFree && (
                <div className="pt-3 border-t border-white/6 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <div>
                    <span className="font-medium text-slate-300">{room.sponsorSlot.brand}:</span>{' '}
                    {room.sponsorSlot.headline}
                  </div>
                  <button
                    type="button"
                    onClick={onOpenStore}
                    className="text-amber-300 hover:text-amber-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.room.goAdFree}
                  </button>
                </div>
              )}
            </div>
          )}

          {room.phase === 'WORD_CHOICE' && (
            <div className="rounded-2xl bg-[#1A1E28] border border-white/8 p-6 sm:p-8 text-center space-y-5">
              {isDrawer && room.wordOptions ? (
                <>
                  <div>
                    <div className="text-xs text-[#FF5A36] font-semibold">
                      {t.room.yourTurnToDraw} · {room.timeLeft}
                      {t.room.toPickSuffix}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">
                      {t.room.chooseSecretWord}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    {room.wordOptions.map((word, idx) => (
                      <button
                        key={word}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onSelectWord(word);
                        }}
                        className="min-h-[72px] px-4 py-4 rounded-xl bg-[#14171F] hover:bg-[#FF5A36] border border-white/10 hover:border-[#FF5A36] text-white font-display text-lg font-bold transition-colors cursor-pointer flex flex-col items-center justify-center gap-1"
                      >
                        <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums">
                          {idx + 1}
                        </span>
                        <span>{word}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-10 space-y-2">
                  <div className="font-display text-2xl font-bold text-white">
                    {drawerPlayer?.name || 'Drawer'} {t.room.isChoosingWord}
                  </div>
                  <p className="text-sm text-slate-400">
                    {t.room.getReadyChat}
                  </p>
                </div>
              )}
            </div>
          )}

          {room.phase === 'DRAWING' && (
            <DrawingCanvas
              strokes={room.strokes}
              livePreviewStroke={livePreviewStroke}
              canDraw={isDrawer}
              language={language}
              onCommitStroke={onCommitStroke}
              onPreviewStroke={onPreviewStroke}
              onUndo={onUndoStroke}
              onClear={onClearCanvas}
            />
          )}

          {room.phase === 'TRIVIA' && room.triviaQuestion && (
            <div className="rounded-2xl bg-[#1A1E28] border border-white/8 p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>{room.triviaQuestion.category}</span>
                <span className="tabular-nums">
                  {activePlayers.filter((p) => p.hasAnsweredTrivia).length}/{activePlayers.length} {t.room.lockedInCount}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug">
                {room.triviaQuestion.prompt}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.triviaQuestion.options.map((opt, idx) => {
                  const chosen = selectedTriviaOpt === idx;
                  const locked = isSpectator || Boolean(me?.hasAnsweredTrivia);
                  const letters = ['A', 'B', 'C', 'D'];
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedTriviaOpt(idx);
                        onAnswerTrivia(idx);
                      }}
                      className={`min-h-[56px] px-4 py-3.5 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        chosen
                          ? 'bg-[#FF5A36] border-[#FF5A36] text-white'
                          : locked
                          ? 'bg-[#14171F]/60 border-white/6 text-slate-400'
                          : 'bg-[#14171F] hover:bg-white/8 border-white/10 text-white'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold w-6 h-6 rounded-md bg-black/25 flex items-center justify-center shrink-0">
                        {letters[idx]}
                      </span>
                      <span className="text-sm font-medium flex-1">{opt}</span>
                      <span className="hidden sm:inline font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {room.phase === 'ROUND_SUMMARY' && (
            <div className="rounded-2xl bg-[#1A1E28] border border-white/8 p-6 sm:p-8 space-y-5">
              <div className="text-center space-y-1.5">
                <div className="text-xs font-semibold text-slate-400">
                  {t.room.turnCompleteNext} {room.timeLeft}s
                </div>
                {room.mode === 'draw' ? (
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {t.room.theWordWas}{' '}
                    <span className="text-[#FF5A36]">{room.revealedWord}</span>
                  </h2>
                ) : (
                  <>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      {t.room.answerLabel}{' '}
                      <span className="text-emerald-400">
                        {room.triviaQuestion?.options[room.triviaCorrectIndex ?? 0]}
                      </span>
                    </h2>
                    {room.triviaFactoid && (
                      <p className="text-sm text-slate-300 max-w-xl mx-auto">
                        {room.triviaFactoid}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
                {sortedPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="px-3.5 py-2.5 rounded-xl bg-[#14171F] border border-white/8 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-white truncate">{p.name}</span>
                      {p.hasDailyBadge && (
                        <span title={t.daily.badgeTooltip} className="inline-flex shrink-0">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                      {p.streak >= 2 && (
                        <span className="inline-flex items-center gap-0.5 text-amber-300 font-mono text-[11px] tabular-nums shrink-0">
                          <Flame className="w-3 h-3 text-amber-400" />
                          {p.streak}x
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      {p.roundDelta > 0 && (
                        <span className="text-emerald-400">+{p.roundDelta}</span>
                      )}
                      <span className="text-slate-300 font-bold">
                        {p.score} {t.common.pts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {!room.adFree && (
                <div className="max-w-xl mx-auto p-3.5 rounded-xl bg-[#14171F] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{room.sponsorSlot.brand}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{room.sponsorSlot.headline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenStore}
                    className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-medium text-white whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.room.removeAds}
                  </button>
                </div>
              )}

              {isHost && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onNextTurn();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#e84b29] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {t.room.continueNow}
                  </button>
                </div>
              )}
            </div>
          )}

          {room.phase === 'GAME_OVER' && (
            <div className="rounded-2xl bg-[#1A1E28] border border-white/8 p-6 sm:p-8 text-center space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Trophy className="w-4 h-4" />
                  <span>{t.room.finalPodium}</span>
                </div>
                <h2 className="font-display text-3xl font-extrabold text-white">
                  {sortedPlayers[0]?.name || 'Winner'} {t.room.takesTheCrown}
                </h2>
              </div>

              <div className="max-w-lg mx-auto space-y-2">
                {sortedPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`px-4 py-3 rounded-xl border flex items-center justify-between ${
                      idx === 0
                        ? 'bg-amber-500/12 border-amber-400/35'
                        : 'bg-[#14171F] border-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-400 w-5 tabular-nums">
                        #{idx + 1}
                      </span>
                      <ProceduralAvatar
                        avatar={p.avatar}
                        color={p.avatarColor}
                        name={p.name}
                        className="w-8 h-8"
                      />
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                      {p.hasDailyBadge && (
                        <span title={t.daily.badgeTooltip} className="inline-flex shrink-0">
                          <Award className="w-4 h-4 text-amber-400" />
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-white tabular-nums">
                      {p.score} {t.common.pts}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onRestartGame();
                    }}
                    className="px-6 py-3 rounded-xl bg-[#FF5A36] hover:bg-[#e84b29] text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t.room.playAgain}</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">
                    {t.room.waitingRematch}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenLeaderboard();
                  }}
                  className="px-5 py-3 rounded-xl bg-[#14171F] hover:bg-white/10 border border-white/10 text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{t.common.topPlayers}</span>
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-2xl bg-[#1A1E28] border border-white/8 p-3.5 flex flex-col justify-between gap-3 order-3 h-[340px] lg:h-[calc(100vh-92px)]">
          <div className="text-xs font-semibold text-slate-200 pb-2 border-b border-white/6">
            {t.room.guessesPartyChat}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {room.chat.map((entry: ChatEntry) => {
              if (entry.kind === 'correct') {
                return (
                  <div
                    key={entry.id}
                    className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-200 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{entry.text}</span>
                  </div>
                );
              }
              if (entry.kind === 'close') {
                return (
                  <div
                    key={entry.id}
                    className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-xs font-medium text-amber-200"
                  >
                    {entry.text}
                  </div>
                );
              }
              if (entry.kind === 'system') {
                return (
                  <div key={entry.id} className="text-[11px] text-slate-400 px-1 py-0.5">
                    {entry.text}
                  </div>
                );
              }
              if (entry.kind === 'reaction') {
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-[#14171F]/70 border border-white/5 text-xs"
                  >
                    <span
                      className="font-semibold truncate"
                      style={{ color: entry.playerColor || '#FF5A36' }}
                    >
                      {entry.playerName}
                    </span>
                    <span className="text-base leading-none shrink-0" aria-label={`Reaction ${entry.text}`}>
                      {entry.text}
                    </span>
                  </div>
                );
              }
              return (
                <div key={entry.id} className="text-xs text-slate-200 px-1.5 py-1 leading-relaxed">
                  <span
                    className="font-semibold mr-1.5"
                    style={{ color: entry.playerColor || '#FF5A36' }}
                  >
                    {entry.playerName}:
                  </span>
                  <span>{entry.text}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="pt-2 border-t border-white/6 space-y-2">
            <div
              className="grid grid-cols-6 gap-1"
              role="group"
              aria-label="Quick emoji reactions"
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onSendReaction(emoji);
                  }}
                  aria-label={`Send ${emoji} reaction`}
                  className="h-9 rounded-lg bg-[#14171F] hover:bg-white/10 active:scale-95 border border-white/8 text-base flex items-center justify-center transition-transform duration-150 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleGuessSubmit} className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                type="text"
                maxLength={80}
                value={guessText}
                disabled={isSpectator && (room.phase === 'DRAWING' || room.phase === 'TRIVIA')}
                onChange={(e) => setGuessText(e.target.value)}
                placeholder={
                  isSpectator && (room.phase === 'DRAWING' || room.phase === 'TRIVIA')
                    ? t.room.spectatingPlaceholder
                    : room.mode === 'draw' && room.phase === 'DRAWING' && !isDrawer && !me?.hasGuessed
                    ? t.room.guessPlaceholder
                    : t.room.chatPlaceholder
                }
                className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-[#14171F] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSpectator && (room.phase === 'DRAWING' || room.phase === 'TRIVIA')}
                aria-label="Send guess or message"
                title="Ctrl+Enter"
                className="h-10 w-10 rounded-xl bg-[#FF5A36] hover:bg-[#e84b29] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 px-0.5">
              <span className="truncate">{t.shortcuts.chatHint}</span>
            </div>
          </div>
        </aside>
      </div>

      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.shortcuts.title}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#1A1E28] border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#FF5A36]" />
                <h2 className="font-display text-lg font-bold text-white">
                  {t.shortcuts.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShortcutsOpen(false);
                }}
                aria-label={t.common.close}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2.5 text-xs">
              {[
                { keys: 'Ctrl + Enter', label: t.shortcuts.sendChat },
                { keys: '/', label: t.shortcuts.focusChat },
                { keys: '1 – 4', label: t.shortcuts.triviaOption },
                { keys: '1 – 3', label: t.shortcuts.pickWord },
                { keys: 'U / Ctrl+Z', label: t.shortcuts.undoStroke },
                { keys: 'B · H · G · E', label: t.shortcuts.brushTools },
                { keys: 'L', label: t.shortcuts.copyLink },
                { keys: 'M', label: t.shortcuts.toggleMute },
                { keys: '?', label: t.shortcuts.toggleGuide },
              ].map((item) => (
                <div
                  key={item.keys}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#14171F] border border-white/6"
                >
                  <span className="text-slate-200">{item.label}</span>
                  <kbd className="font-mono text-[11px] font-semibold text-amber-300 px-2 py-0.5 rounded-md bg-[#1A1E28] border border-white/10 whitespace-nowrap shrink-0 tabular-nums">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
