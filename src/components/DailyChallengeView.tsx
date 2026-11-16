import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type AvatarConfig,
  type DailyChallengeState,
  type DrawStroke,
  type SupportedLanguage,
} from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';
import { DrawingCanvas } from './DrawingCanvas';
import { ProceduralAvatar } from './ProceduralAvatar';

interface DailyChallengeViewProps {
  challenge: DailyChallengeState;
  playerName: string;
  avatar: AvatarConfig;
  language: SupportedLanguage;
  muted: boolean;
  onToggleMute: () => void;
  onCompleteSuccess: (awardedBonus: number, updatedState: DailyChallengeState) => void;
  onExit: () => void;
}

interface CompletedSummary {
  awardedBonus: number;
  elapsedSeconds: number;
  state: DailyChallengeState;
}

export const DailyChallengeView: React.FC<DailyChallengeViewProps> = ({
  challenge,
  playerName,
  avatar,
  language,
  muted,
  onToggleMute,
  onCompleteSuccess,
  onExit,
}) => {
  const t = getUIText(language);
  const words = challenge.words;
  const totalWords = words.length;

  const [wordIndex, setWordIndex] = useState(0);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [strokeWarning, setStrokeWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CompletedSummary | null>(null);

  const currentWord = words[wordIndex] || words[0] || 'Rocket';
  const isFinalWord = wordIndex >= totalWords - 1;

  useEffect(() => {
    if (summary) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [summary]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const handleCommitStroke = (stroke: DrawStroke) => {
    setStrokeWarning(false);
    setStrokes((prev) => [...prev, stroke]);
  };

  const handleAdvanceOrSubmit = async () => {
    if (submitting) return;
    if (strokes.length === 0) {
      soundEngine.playTick(true);
      setStrokeWarning(true);
      return;
    }

    if (!isFinalWord) {
      soundEngine.playCorrect();
      setStrokeWarning(false);
      setStrokes([]);
      setWordIndex((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const finalSeconds = Math.max(5, elapsedSeconds);

    try {
      const res = await fetch('/api/daily-challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim() || 'Player',
          avatarColor: avatar.color,
          avatar,
          elapsedSeconds: finalSeconds,
          wordsCompleted: totalWords,
          language,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit daily challenge');
      }
      const data = (await res.json()) as {
        awardedBonus: number;
        state: DailyChallengeState;
      };
      soundEngine.playVictory();
      setSummary({
        awardedBonus: Number(data.awardedBonus || 0),
        elapsedSeconds: finalSeconds,
        state: data.state,
      });
      onCompleteSuccess(Number(data.awardedBonus || 0), data.state);
    } catch {
      setSubmitError(t.daily.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplay = () => {
    soundEngine.playClick();
    setSummary(null);
    setWordIndex(0);
    setStrokes([]);
    setElapsedSeconds(0);
    setStrokeWarning(false);
    setSubmitError(null);
  };

  return (
    <div className="min-h-screen bg-[#14171F] flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D212B] hover:bg-[#252A37] text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.common.back}</span>
          </button>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.daily.heading}</span>
            </span>
            {!summary && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-slate-200 font-medium">
                  {t.daily.wordProgress
                    .replace('{current}', String(wordIndex + 1))
                    .replace('{total}', String(totalWords))}
                </span>
              </>
            )}
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="hidden sm:inline font-mono tabular-nums">{challenge.dateKey}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!summary && (
            <>
              <div className="px-3 py-1.5 rounded-lg bg-[#1D212B] border border-white/8 text-sm font-bold text-white">
                {t.daily.drawPrefix} <span className="text-[#FF5A36]">{currentWord}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg bg-[#1D212B] border border-white/8 text-white">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{elapsedSeconds}s</span>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? t.common.unmuteSound : t.common.muteSound}
            className="p-2 rounded-lg bg-[#1D212B] text-slate-300 hover:text-white cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {summary ? (
        <div className="max-w-xl w-full mx-auto my-auto py-8">
          <div className="rounded-2xl bg-[#1A1E28] border border-amber-400/30 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {t.daily.summaryTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  {t.daily.summaryBadgeActive}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-4 rounded-xl bg-[#14171F] border border-white/8">
                <div className="text-xs text-slate-400">{t.daily.bonusAwardedLabel}</div>
                <div className="mt-1 font-mono text-lg font-bold text-emerald-400 tabular-nums">
                  {summary.awardedBonus > 0
                    ? `+${summary.awardedBonus} ${t.common.pts}`
                    : t.daily.replayBonusNote}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#14171F] border border-white/8">
                <div className="text-xs text-slate-400">{t.daily.bestTimeLabel}</div>
                <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                  {summary.elapsedSeconds}s
                </div>
              </div>
            </div>

            {summary.state.topFinishers.length > 0 && (
              <div className="text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{t.daily.topFinishers}</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {summary.state.totalFinishers}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {summary.state.topFinishers.slice(0, 5).map((finisher, idx) => (
                    <div
                      key={finisher.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#14171F] border border-white/6 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-slate-400 w-5 tabular-nums">
                          #{idx + 1}
                        </span>
                        <ProceduralAvatar
                          avatar={finisher.avatar}
                          color={finisher.avatarColor}
                          name={finisher.name}
                          className="w-6 h-6"
                        />
                        <span className="font-semibold text-white truncate">{finisher.name}</span>
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </div>
                      <span className="font-mono font-bold text-amber-300 tabular-nums shrink-0">
                        {finisher.elapsedSeconds}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleReplay}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#14171F] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.daily.replaySprint}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onExit();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#14171F] text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.daily.backToLobby}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl w-full mx-auto my-auto py-4 space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {words.map((word, idx) => {
              const done = idx < wordIndex;
              const current = idx === wordIndex;
              return (
                <div
                  key={`${word}_${idx}`}
                  className={`px-2.5 py-2 rounded-xl border text-xs flex items-center gap-1.5 truncate transition-colors ${
                    current
                      ? 'bg-[#FF5A36]/15 border-[#FF5A36]/50 text-white font-semibold'
                      : done
                      ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300'
                      : 'bg-[#1A1E28] border-white/6 text-slate-500'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="font-mono text-[11px] tabular-nums shrink-0">
                      {idx + 1}.
                    </span>
                  )}
                  <span className="truncate">{current || done ? word : '•••••'}</span>
                </div>
              );
            })}
          </div>

          <DrawingCanvas
            strokes={strokes}
            livePreviewStroke={null}
            canDraw={true}
            language={language}
            onCommitStroke={handleCommitStroke}
            onUndo={() => setStrokes((prev) => prev.slice(0, -1))}
            onClear={() => setStrokes([])}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs">
              {submitError ? (
                <span className="text-rose-400">{submitError}</span>
              ) : strokeWarning ? (
                <span className="text-amber-300">{t.daily.strokeHint}</span>
              ) : (
                <span className="text-slate-400">{t.daily.rewardsMeta}</span>
              )}
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleAdvanceOrSubmit}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60 ${
                isFinalWord
                  ? 'bg-amber-400 hover:bg-amber-300 text-[#14171F]'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isFinalWord ? (
                <>
                  <Award className="w-4 h-4" />
                  <span>{submitting ? t.daily.submitting : t.daily.finishChallenge}</span>
                </>
              ) : (
                <>
                  <span>{t.daily.nextWord}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
