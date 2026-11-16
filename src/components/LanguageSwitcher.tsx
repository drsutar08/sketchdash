import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../shared/gameData';
import { soundEngine } from '../utils/sound';

interface LanguageSwitcherProps {
  language: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
  ariaLabel?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  onChange,
  ariaLabel = 'Select language',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const current =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          soundEngine.playClick();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1D212B]/90 hover:bg-[#252A37] border border-white/10 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF5A36]"
      >
        <Globe className="w-4 h-4 text-[#FF5A36] shrink-0" />
        <span>{current.nativeLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1A1E28] border border-white/10 shadow-2xl p-1.5 z-50"
        >
          {SUPPORTED_LANGUAGES.map((opt) => {
            const active = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  soundEngine.playClick();
                  onChange(opt.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#FF5A36]/15 text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] font-bold text-slate-400 w-5 shrink-0">
                    {opt.shortCode}
                  </span>
                  <span className="truncate">{opt.nativeLabel}</span>
                </div>
                {active && <Check className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
