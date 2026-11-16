import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Clock,
  Eye,
  Package,
  PenTool,
  Play,
  Shuffle,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_MOUTHS,
  AVATAR_SHAPES,
  MAX_ROOM_PLAYERS,
  getLocalizedWordPack,
  type AvatarConfig,
  type DailyChallengeState,
  type GameMode,
  type SupportedLanguage,
} from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ProceduralAvatar } from './ProceduralAvatar';

type AvatarTab = 'color' | 'shape' | 'eyes' | 'mouth' | 'gear';

interface TitleScreenProps {
  initialRoomCode: string;
  initialName: string;
  initialAvatar: AvatarConfig;
  selectedPackId: string;
  language: SupportedLanguage;
  muted: boolean;
  errorMsg: string | null;
  fullRoomOffer: {
    code: string;
    activeCount: number;
    spectatorCount: number;
  } | null;
  connecting: boolean;
  dailyChallenge: DailyChallengeState | null;
  dailyLoading: boolean;
  onNameChange?: (name: string) => void;
  onChangeLanguage: (language: SupportedLanguage) => void;
  onToggleMute: () => void;
  onCreateRoom: (payload: {
    name: string;
    avatar: AvatarConfig;
    mode: GameMode;
    isPublic: boolean;
  }) => void;
  onJoinRoom: (payload: {
    name: string;
    avatar: AvatarConfig;
    code: string;
    spectate?: boolean;
  }) => void;
  onOpenStore: () => void;
  onOpenLeaderboard: () => void;
  onStartSoloWarmup: () => void;
  onStartDailyChallenge: (payload: { name: string; avatar: AvatarConfig }) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  initialRoomCode,
  initialName,
  initialAvatar,
  selectedPackId,
  language,
  muted,
  errorMsg,
  fullRoomOffer,
  connecting,
  dailyChallenge,
  dailyLoading,
  onNameChange,
  onChangeLanguage,
  onToggleMute,
  onCreateRoom,
  onJoinRoom,
  onOpenStore,
  onOpenLeaderboard,
  onStartSoloWarmup,
  onStartDailyChallenge,
}) => {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarConfig>(initialAvatar);
  const [avatarTab, setAvatarTab] = useState<AvatarTab>('shape');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [mode, setMode] = useState<GameMode>('draw');
  const [isPublic, setIsPublic] = useState(true);
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);

  const t = getUIText(language);
  const activePack = getLocalizedWordPack(selectedPackId, language);
  const hasInviteCode = initialRoomCode.length === 4;
  const isJoiningByCode = roomCode.trim().length >= 4;

  useEffect(() => {
    if (initialRoomCode) setRoomCode(initialRoomCode);
  }, [initialRoomCode]);

  const handleRandomizeAvatar = () => {
    soundEngine.playClick();
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setAvatar({
      color: pick(AVATAR_COLORS),
      shape: pick(AVATAR_SHAPES),
      eyes: pick(AVATAR_EYES),
      mouth: pick(AVATAR_MOUTHS),
      accessory: pick(AVATAR_ACCESSORIES),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connecting) return;
    soundEngine.playClick();
    const cleanedCode = roomCode.trim().toUpperCase();
    if (cleanedCode.length >= 4) {
      onJoinRoom({
        name: name.trim() || 'Player',
        avatar,
        code: cleanedCode,
        spectate: joinAsSpectator,
      });
    } else {
      onCreateRoom({ name: name.trim() || 'Host', avatar, mode, isPublic });
    }
  };

  const upperCode = roomCode.trim().toUpperCase();

  return (
    <div className="relative h-full min-h-screen w-full overflow-y-auto bg-[#14171F] flex flex-col justify-between">
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/src/assets/images/title_studio_backdrop_1794764686270.jpg"
          alt="Studio sketching desk with markers and sketchbook"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-right opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#14171F] via-[#14171F]/90 to-[#14171F]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14171F] via-transparent to-[#14171F]/40" />
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-end px-6 pt-5 gap-2.5">
        <LanguageSwitcher
          language={language}
          onChange={onChangeLanguage}
          ariaLabel={t.common.languageLabel}
        />
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenLeaderboard();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1D212B]/90 hover:bg-[#252A37] border border-white/10 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{t.common.topPlayers}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenStore();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1D212B]/90 hover:bg-[#252A37] border border-white/10 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <Package className="w-4 h-4 text-[#FF5A36]" />
          <span>{t.common.wordPacks}</span>
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? t.common.unmuteSound : t.common.muteSound}
          className="p-2.5 rounded-xl bg-[#1D212B]/90 hover:bg-[#252A37] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <main className="relative z-10 flex-1 flex items-center px-6 sm:px-12 lg:px-16 py-6">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,512px)_minmax(0,390px)] items-center justify-between gap-8 lg:gap-10">
        <div className="w-full max-w-lg">
          <div className="mb-5">
            <svg
              viewBox="0 0 360 74"
              className="w-72 sm:w-84 h-auto"
              role="img"
              aria-label="SketchDash"
            >
              <g transform="translate(0, 6)">
                <rect x="2" y="8" width="50" height="50" rx="12" fill="#FF5A36" />
                <path
                  d="M15 43 L22 25 L36 17 L41 22 L33 36 Z"
                  fill="#FCFBF7"
                />
                <path d="M13 46 L21 43 L16 38 Z" fill="#14171F" />
                <circle cx="38" cy="20" r="2.5" fill="#FF5A36" />
              </g>
              <text
                x="68"
                y="49"
                fill="#FCFBF7"
                fontFamily="Bricolage Grotesque, sans-serif"
                fontWeight="800"
                fontSize="44"
                letterSpacing="-1.2"
              >
                SketchDash
              </text>
            </svg>
            <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-md leading-relaxed">
              {t.title.tagline}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{t.title.zeroDownloads}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t.title.activePack} {activePack.title}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t.title.upToPlayers}</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-[#1A1E28]/95 border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
          >
            {errorMsg && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/12 border border-rose-500/30 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}

            {fullRoomOffer && (
              <div className="p-3.5 rounded-xl bg-amber-500/12 border border-amber-400/35 space-y-2.5">
                <div className="text-xs text-amber-100 leading-relaxed">
                  {t.title.roomFullPrefix}{' '}
                  <span className="font-mono font-bold">{fullRoomOffer.code}</span>{' '}
                  <span className="tabular-nums">
                    ({fullRoomOffer.activeCount}/{MAX_ROOM_PLAYERS})
                  </span>{' '}
                  {t.title.roomFullSuffix}
                </div>
                <button
                  type="button"
                  disabled={connecting}
                  onClick={() => {
                    soundEngine.playClick();
                    onJoinRoom({
                      name: name.trim() || 'Spectator',
                      avatar,
                      code: fullRoomOffer.code,
                      spectate: true,
                    });
                  }}
                  className="w-full py-2 px-3.5 rounded-lg bg-[#FF5A36] hover:bg-[#e84b29] text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.title.joinAsSpectator.replace('{code}', fullRoomOffer.code)}</span>
                </button>
              </div>
            )}

            <div>
              <label htmlFor="player-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.title.yourNickname}
              </label>
              <input
                id="player-name"
                type="text"
                maxLength={18}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  onNameChange?.(e.target.value);
                }}
                placeholder={t.title.nicknamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14171F] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36]"
              />
            </div>

            <div className="rounded-xl bg-[#14171F]/80 border border-white/8 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-300">
                  {t.title.avatarHeading}
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A1E28] hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3 h-3 text-[#FF5A36]" />
                  <span>{t.title.randomizeAvatar}</span>
                </button>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-[#1A1E28] border border-white/10 flex items-center justify-center shrink-0">
                  <ProceduralAvatar
                    avatar={avatar}
                    name={name || 'Player'}
                    className="w-14 h-14"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1A1E28] overflow-x-auto">
                    {(
                      [
                        { id: 'color', label: t.title.tabColor },
                        { id: 'shape', label: t.title.tabShape },
                        { id: 'eyes', label: t.title.tabEyes },
                        { id: 'mouth', label: t.title.tabMouth },
                        { id: 'gear', label: t.title.tabGear },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setAvatarTab(tab.id);
                        }}
                        className={`flex-1 px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          avatarTab === tab.id
                            ? 'bg-[#FF5A36] text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {avatarTab === 'color' && (
                    <div className="flex items-center justify-between gap-1.5 flex-wrap py-1">
                      {AVATAR_COLORS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setAvatar((prev) => ({ ...prev, color: hex }));
                          }}
                          aria-label={`Avatar color ${hex}`}
                          className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                            avatar.color === hex
                              ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#14171F]'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  )}

                  {avatarTab === 'shape' && (
                    <div className="grid grid-cols-6 gap-1.5">
                      {AVATAR_SHAPES.map((shape) => {
                        const active = avatar.shape === shape;
                        return (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setAvatar((prev) => ({ ...prev, shape }));
                            }}
                            aria-label={`Shape ${shape}`}
                            title={shape}
                            className={`h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              active
                                ? 'bg-white/12 border-[#FF5A36]'
                                : 'bg-[#1A1E28] border-white/8 hover:border-white/20'
                            }`}
                          >
                            <ProceduralAvatar
                              avatar={{ ...avatar, shape, accessory: 'none' }}
                              className="w-7 h-7"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {avatarTab === 'eyes' && (
                    <div className="grid grid-cols-5 gap-1.5">
                      {AVATAR_EYES.map((eyes) => {
                        const active = avatar.eyes === eyes;
                        return (
                          <button
                            key={eyes}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setAvatar((prev) => ({ ...prev, eyes }));
                            }}
                            aria-label={`Eyes ${eyes}`}
                            title={eyes}
                            className={`h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              active
                                ? 'bg-white/12 border-[#FF5A36]'
                                : 'bg-[#1A1E28] border-white/8 hover:border-white/20'
                            }`}
                          >
                            <ProceduralAvatar
                              avatar={{ ...avatar, eyes, accessory: 'none' }}
                              className="w-7 h-7"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {avatarTab === 'mouth' && (
                    <div className="grid grid-cols-5 gap-1.5">
                      {AVATAR_MOUTHS.map((mouth) => {
                        const active = avatar.mouth === mouth;
                        return (
                          <button
                            key={mouth}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setAvatar((prev) => ({ ...prev, mouth }));
                            }}
                            aria-label={`Mouth ${mouth}`}
                            title={mouth}
                            className={`h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              active
                                ? 'bg-white/12 border-[#FF5A36]'
                                : 'bg-[#1A1E28] border-white/8 hover:border-white/20'
                            }`}
                          >
                            <ProceduralAvatar
                              avatar={{ ...avatar, mouth, accessory: 'none' }}
                              className="w-7 h-7"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {avatarTab === 'gear' && (
                    <div className="grid grid-cols-6 gap-1.5">
                      {AVATAR_ACCESSORIES.map((accessory) => {
                        const active = avatar.accessory === accessory;
                        return (
                          <button
                            key={accessory}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setAvatar((prev) => ({ ...prev, accessory }));
                            }}
                            aria-label={`Accessory ${accessory}`}
                            title={accessory}
                            className={`h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              active
                                ? 'bg-white/12 border-[#FF5A36]'
                                : 'bg-[#1A1E28] border-white/8 hover:border-white/20'
                            }`}
                          >
                            <ProceduralAvatar
                              avatar={{ ...avatar, accessory }}
                              className="w-7 h-7"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!hasInviteCode && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-300">{t.title.partyMode}</span>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14171F]">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setMode('draw');
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        mode === 'draw' ? 'bg-[#FF5A36] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.common.drawAndGuess}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setMode('trivia');
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        mode === 'trivia' ? 'bg-[#FF5A36] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.common.triviaBlitz}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-300">{t.title.roomVisibility}</span>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14171F]">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsPublic(true);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        isPublic ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.title.publicRanked}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setIsPublic(false);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        !isPublic ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.common.privateLabel}
                    </button>
                  </div>
                </div>
              </>
            )}

            {isJoiningByCode && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-300">{t.title.joinRole}</span>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14171F]">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setJoinAsSpectator(false);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      !joinAsSpectator ? 'bg-[#FF5A36] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.title.playerRole}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setJoinAsSpectator(true);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      joinAsSpectator ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.title.spectatorRole}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <div className="sm:w-36 shrink-0">
                <input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder={t.title.roomCodePlaceholder}
                  aria-label={t.title.roomCodePlaceholder}
                  className="w-full h-11 px-3 rounded-xl bg-[#14171F] border border-white/10 font-mono text-sm font-semibold tracking-widest text-center text-white placeholder:text-slate-500 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="flex-1 h-11 px-5 rounded-xl bg-[#FF5A36] hover:bg-[#e84b29] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
              >
                <span>
                  {connecting
                    ? t.title.connecting
                    : isJoiningByCode
                    ? joinAsSpectator
                      ? t.title.spectateRoom.replace('{code}', upperCode)
                      : t.title.joinRoom.replace('{code}', upperCode)
                    : t.title.createPartyRoom}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2 border-t border-white/8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onStartSoloWarmup();
                }}
                className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>{t.title.soloWarmup}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenStore();
                }}
                className="text-xs font-medium text-amber-300 hover:text-amber-200 whitespace-nowrap transition-colors cursor-pointer"
              >
                {t.title.browsePacks}
              </button>
            </div>
          </form>
        </div>

        <section
          aria-label={t.daily.heading}
          className="w-full max-w-lg lg:max-w-[390px] rounded-2xl bg-[#1A1E28]/95 border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/8">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="font-display text-xl font-bold text-white tracking-tight">
                  {t.daily.heading}
                </h2>
              </div>
              <div className="mt-1 text-xs text-slate-400 flex flex-wrap items-center gap-1.5">
                <span className="text-slate-200 font-medium">{t.daily.sprintLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-medium">{t.daily.rewardsMeta}</span>
              </div>
            </div>
            {dailyChallenge && (
              <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums whitespace-nowrap shrink-0 pt-1">
                {dailyChallenge.dateKey}
              </span>
            )}
          </div>

          {dailyLoading && !dailyChallenge ? (
            <div className="space-y-2.5 py-2">
              <div className="h-10 rounded-xl bg-[#14171F] border border-white/6 animate-pulse" />
              <div className="h-24 rounded-xl bg-[#14171F] border border-white/6 animate-pulse" />
              <div className="h-11 rounded-xl bg-[#14171F] border border-white/6 animate-pulse" />
            </div>
          ) : dailyChallenge ? (
            <>
              {dailyChallenge.completedByPlayer ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t.daily.badgeUnlocked}</span>
                  </span>
                  {dailyChallenge.playerResult && (
                    <span className="font-mono font-bold text-white tabular-nums shrink-0">
                      {dailyChallenge.playerResult.elapsedSeconds}s
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-300 flex items-center justify-between gap-2">
                  <span>{t.daily.featuredPack}</span>
                  <span className="font-semibold text-white truncate">
                    {dailyChallenge.packSourceTitle}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400">
                  {t.daily.wordsPreview}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {dailyChallenge.words.map((word, idx) => (
                    <div
                      key={`${word}_${idx}`}
                      className={`px-2.5 py-1.5 rounded-lg bg-[#14171F] border border-white/6 text-xs text-slate-200 flex items-center gap-1.5 truncate ${
                        idx === dailyChallenge.words.length - 1 ? 'col-span-2' : ''
                      }`}
                    >
                      <span className="font-mono text-[11px] text-amber-400 font-bold tabular-nums shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="truncate font-medium">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.daily.topFinishers}</span>
                  </span>
                  <span className="font-mono tabular-nums">{dailyChallenge.totalFinishers}</span>
                </div>

                {dailyChallenge.topFinishers.length > 0 ? (
                  <div className="space-y-1.5">
                    {dailyChallenge.topFinishers.slice(0, 4).map((finisher, idx) => (
                      <div
                        key={finisher.id}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#14171F] border border-white/6 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-slate-500 w-4 tabular-nums">
                            #{idx + 1}
                          </span>
                          <ProceduralAvatar
                            avatar={finisher.avatar}
                            color={finisher.avatarColor}
                            name={finisher.name}
                            className="w-6 h-6"
                          />
                          <span className="font-semibold text-slate-100 truncate">
                            {finisher.name}
                          </span>
                          <Award className="w-3 h-3 text-amber-400 shrink-0" />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-amber-300 tabular-nums shrink-0">
                          {finisher.elapsedSeconds}s
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed px-3 py-2.5 rounded-xl bg-[#14171F] border border-white/6">
                    {t.daily.emptyFinishers}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onStartDailyChallenge({
                    name: name.trim() || 'Player',
                    avatar,
                  });
                }}
                className="w-full h-11 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#14171F] text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {dailyChallenge.completedByPlayer
                    ? t.daily.replaySprint
                    : t.daily.startSprint}
                </span>
              </button>
            </>
          ) : null}
        </section>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-4 flex items-center justify-between text-xs text-slate-500">
        <span>{t.title.footerHint}</span>
      </footer>
    </div>
  );
};
