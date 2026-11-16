import React, { useState } from 'react';
import { Check, Lock, Sparkles, X } from 'lucide-react';
import { getLocalizedWordPacks, type SupportedLanguage, type WordPack } from '../../shared/gameData';
import { getUIText } from '../i18n/translations';
import { soundEngine } from '../utils/sound';

interface PackStoreModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  onClose: () => void;
  unlockedPackIds: string[];
  adFree: boolean;
  selectedPackId: string;
  customWords: string[];
  onUnlockPack: (packId: string) => void;
  onUnlockProPass: () => void;
  onSelectPack: (packId: string) => void;
  onSaveCustomWords: (words: string[]) => void;
}

export const PackStoreModal: React.FC<PackStoreModalProps> = ({
  isOpen,
  language,
  onClose,
  unlockedPackIds,
  adFree,
  selectedPackId,
  customWords,
  onUnlockPack,
  onUnlockProPass,
  onSelectPack,
  onSaveCustomWords,
}) => {
  const [customDraft, setCustomDraft] = useState(() => customWords.join('\n'));
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = getUIText(language);
  const localizedPacks = getLocalizedWordPacks(language);

  const isUnlocked = (pack: WordPack) =>
    pack.tier === 'free' || unlockedPackIds.includes(pack.id);

  const handleUnlockSingle = (pack: WordPack) => {
    soundEngine.playCorrect();
    onUnlockPack(pack.id);
    setCheckoutBanner(t.store.unlockedBanner.replace('{title}', pack.title));
  };

  const handleUnlockAll = () => {
    soundEngine.playVictory();
    onUnlockProPass();
    setCheckoutBanner(t.store.proPassBanner);
  };

  const handleSaveCustom = () => {
    const parsed = customDraft
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2)
      .slice(0, 60);
    soundEngine.playClick();
    onSaveCustomWords(parsed);
    onSelectPack('custom');
    setCheckoutBanner(t.store.customSavedBanner.replace('{count}', String(parsed.length)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.store.heading}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1A1E28] border border-white/10 shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/8">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              {t.store.heading}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {t.store.subheading}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label={t.common.close}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {checkoutBanner && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-sm text-emerald-200 flex items-center justify-between gap-3">
            <span>{checkoutBanner}</span>
            <button
              type="button"
              onClick={() => setCheckoutBanner(null)}
              className="text-xs text-emerald-300 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.common.dismiss}
            </button>
          </div>
        )}

        <div className="mt-5 p-4 rounded-xl bg-[#222735] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.store.proPassTag}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white mt-0.5">
              {t.store.proPassTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t.store.proPassDesc}
            </p>
          </div>
          {adFree && unlockedPackIds.includes('custom') ? (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 whitespace-nowrap shrink-0">
              <Check className="w-4 h-4" />
              <span>{t.store.proPassActive}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUnlockAll}
              className="px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#e84b29] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {t.store.activateProPass}
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localizedPacks.map((pack) => {
            const unlocked = isUnlocked(pack);
            const active = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                className={`flex flex-col rounded-xl overflow-hidden bg-[#222735] border transition-colors ${
                  active ? 'border-[#FF5A36]' : 'border-white/8'
                }`}
              >
                <div className="h-32 w-full relative overflow-hidden bg-[#14171F]">
                  {pack.coverImage ? (
                    <img
                      src={pack.coverImage}
                      alt={pack.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-end p-4"
                      style={{
                        background: `linear-gradient(135deg, ${pack.accentColor}30 0%, #14171F 100%)`,
                      }}
                    >
                      <span className="font-display text-xl font-bold text-white/90">
                        {pack.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#222735] via-transparent to-transparent" />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        {pack.tier === 'free'
                          ? t.store.freePack
                          : pack.tier === 'custom'
                          ? t.store.creatorBuilder
                          : t.store.premiumPack}
                      </span>
                      <span className="tabular-nums">
                        {pack.words.length} {t.store.wordsCount} · {pack.trivia.length} {t.store.triviaCount}
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold text-white mt-1">
                      {pack.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {pack.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2 truncate">
                      {t.store.sampleLabel} {pack.words.slice(0, 3).join(', ')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/6 flex items-center justify-between gap-2">
                    {unlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          onSelectPack(pack.id);
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#FF5A36] text-white'
                            : 'bg-white/8 hover:bg-white/14 text-white'
                        }`}
                      >
                        {active ? t.store.selectedForRoom : t.store.useThisPack}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUnlockSingle(pack)}
                        className="w-full py-2 px-3 rounded-lg bg-white/8 hover:bg-white/14 text-white text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {t.store.unlockLabel} · ${pack.priceUsd.toFixed(2)}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[#14171F] border border-white/8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-base font-bold text-white">
                {t.store.customTitle}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.store.customDesc}
              </p>
            </div>
            {!unlockedPackIds.includes('custom') && (
              <span className="text-xs text-amber-400 whitespace-nowrap shrink-0">
                {t.store.requiresCustomPack}
              </span>
            )}
          </div>
          <textarea
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            disabled={!unlockedPackIds.includes('custom')}
            rows={3}
            placeholder="Room 304 Raid, Missing Charger, Hostel Cat, Midnight Maggi..."
            className="mt-3 w-full rounded-xl bg-[#1D212B] border border-white/10 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36] disabled:opacity-50"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={!unlockedPackIds.includes('custom')}
              onClick={handleSaveCustom}
              className="px-4 py-2 rounded-lg bg-[#FF5A36] hover:bg-[#e84b29] disabled:opacity-40 text-white text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {t.store.saveCustomWords}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
