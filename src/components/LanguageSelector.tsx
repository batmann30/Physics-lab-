import React from 'react';
import type { LanguageCode } from '../types/physics';

interface LanguageSelectorProps {
  language: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  compact?: boolean;
}

const OPTIONS: Array<{ code: LanguageCode; short: string; label: string }> = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'kn', short: 'ಕನ್ನಡ', label: 'ಕನ್ನಡ' },
  { code: 'hi', short: 'हिन्दी', label: 'हिन्दी' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onChange,
  compact = false,
}) => {
  return (
    <div
      role="group"
      aria-label="Select learning language"
      className="inline-flex items-center rounded-lg bg-[#E5E4E2]/70 p-1 border border-[#D8D1CA]"
    >
      {OPTIONS.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => onChange(opt.code)}
            aria-pressed={isActive}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2 ${
              isActive
                ? 'bg-[#6F4E37] text-white shadow-xs'
                : 'text-[#302820] hover:bg-[#FFFFFF]/70'
            }`}
          >
            {compact ? opt.short : opt.label}
          </button>
        );
      })}
    </div>
  );
};
