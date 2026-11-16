import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { getLocalizedWordPack, type DrawStroke, type SupportedLanguage } from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';
import { DrawingCanvas } from './DrawingCanvas';

interface SoloWarmupViewProps {
  packId: string;
  language: SupportedLanguage;
  customWords: string[];
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}

export const SoloWarmupView: React.FC<SoloWarmupViewProps> = ({
  packId,
  language,
  customWords,
  muted,
  onToggleMute,
  onExit,
}) => {
  const t = getUIText(language);
  const pack = getLocalizedWordPack(packId, language);
  const words = useMemo(() => {
    const base = packId === 'custom' && customWords.length > 0 ? customWords : pack.words;
    return [...base].sort(() => Math.random() - 0.5);
  }, [packId, pack.words, customWords]);

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [completed, setCompleted] = useState(0);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);

  const currentWord = words[index % words.length] || pack.words[0] || 'Skateboard';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          soundEngine.playRoundEnd();
          setStrokes([]);
          setIndex((i) => i + 1);
          return 45;
        }
        if (prev <= 6) soundEngine.playTick(true);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const handleNextWord = (countDone: boolean) => {
    if (countDone) {
      soundEngine.playCorrect();
      setCompleted((c) => c + 1);
    } else {
      soundEngine.playClick();
    }
    setStrokes([]);
    setIndex((i) => i + 1);
    setTimeLeft(45);
  };

  return (
    <div className="min-h-screen bg-[#14171F] flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4 pb-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D212B] hover:bg-[#252A37] text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.common.back}</span>
          </button>
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span>{t.solo.title}</span>
            <span aria-hidden="true">·</span>
            <span>{pack.title}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-emerald-400 font-medium">
              {completed} {t.solo.sketchedCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#1D212B] border border-white/8 text-sm font-bold text-white">
            {t.solo.drawPrefix} <span className="text-[#FF5A36]">{currentWord}</span>
          </div>
          <div
            className={`font-mono text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg bg-[#1D212B] border border-white/8 ${
              timeLeft <= 8 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {timeLeft}s
          </div>
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

      <div className="max-w-4xl w-full mx-auto my-auto py-4">
        <DrawingCanvas
          strokes={strokes}
          livePreviewStroke={null}
          canDraw={true}
          language={language}
          onCommitStroke={(s) => setStrokes((prev) => [...prev, s])}
          onUndo={() => setStrokes((prev) => prev.slice(0, -1))}
          onClear={() => setStrokes([])}
        />

        <div className="mt-3 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleNextWord(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D212B] hover:bg-[#252A37] text-xs font-medium text-slate-300 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.solo.skipPrompt}</span>
          </button>
          <button
            type="button"
            onClick={() => handleNextWord(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.solo.doneNext}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
