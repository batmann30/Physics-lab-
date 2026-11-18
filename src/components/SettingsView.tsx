import React from 'react';
import { CheckCircle2, Info, LogIn, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { GradeClassLevel, SimulationMode, UserPreferences, UserProfile } from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';
import { CLASS_LEVELS } from '../data/ncertCurriculum';
import { LanguageSelector } from './LanguageSelector';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (patch: Partial<UserPreferences>) => void;
  t: TranslationBundle;
  geminiConfigured: boolean | null;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPortal: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  t,
  geminiConfigured,
  userProfile,
  onOpenAuth,
  onOpenPortal,
  onLogout,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="border-b border-[#D8D1CA] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#302820] mb-1">
          {t.settings.title}
        </h1>
        <p className="text-sm text-[#756B63]">{t.settings.subtitle}</p>
      </div>

      {/* Account & Portal Session */}
      <section className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8D1CA] pb-3">
          <div className="flex items-center gap-2 text-[#302820]">
            <UserIcon className="w-5 h-5 text-[#6F4E37]" />
            <h2 className="text-base font-semibold">Student &amp; Teacher Account</h2>
          </div>
          <span className="text-xs font-medium text-[#6F4E37]">
            Browser-Local Demo Auth (IndexedDB)
          </span>
        </div>

        {userProfile ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#302820]">
                {userProfile.name} ·{' '}
                <span className="capitalize">
                  {userProfile.role}
                </span>
                {userProfile.role === 'student' && userProfile.selectedClass
                  ? ` · Class ${userProfile.selectedClass}`
                  : ''}
              </p>
              <p className="text-xs text-[#756B63]">
                <span className="font-mono text-[#302820]">@{userProfile.username}</span>
                <span aria-hidden="true"> · </span>
                <span>Stored locally on this browser only (no external sync)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onOpenPortal}
                className="px-4 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer"
              >
                Open {userProfile.role === 'teacher' ? 'Teacher' : 'Student'} Portal
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D8D1CA] text-xs font-medium text-[#302820] hover:bg-[#F7F5F2] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-[#756B63]">
              Sign in or create local Student (Classes 6–10) and Teacher accounts stored in this
              browser&apos;s IndexedDB. Accounts stay saved across refreshes on this device.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] cursor-pointer shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </button>
          </div>
        )}
      </section>

      {/* Language Selection */}
      <section className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#302820]">
              {t.settings.languageSection}
            </h2>
            <p className="text-sm text-[#756B63]">{t.settings.languageHelp}</p>
          </div>
          <LanguageSelector
            language={preferences.language}
            onChange={(language) => onUpdatePreferences({ language })}
          />
        </div>
      </section>

      {/* Simulation & Class Defaults */}
      <section className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 sm:p-7 space-y-5">
        <h2 className="text-base font-semibold text-[#302820] pb-3 border-b border-[#D8D1CA]">
          {t.settings.simulationSection}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#302820]">
            {t.classLibrary.defaultClassSettingLabel}
          </span>
          {userProfile?.role === 'student' ? (
            <div className="px-3.5 py-2 rounded-lg bg-[#F7F5F2] border border-[#D8D1CA] text-xs font-semibold text-[#6F4E37]">
              Class {userProfile.selectedClass ?? 6} · Locked to your student account
            </div>
          ) : (
            <div className="inline-flex flex-wrap items-center rounded-lg bg-[#E5E4E2]/70 p-1 border border-[#D8D1CA] self-start">
              {CLASS_LEVELS.map((cls: GradeClassLevel) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => onUpdatePreferences({ selectedClass: cls })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                    preferences.selectedClass === cls
                      ? 'bg-[#6F4E37] text-white'
                      : 'text-[#302820] hover:bg-white/70'
                  }`}
                >
                  {t.classLibrary.classPrefix} {cls}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#302820]">
            {t.settings.defaultModeLabel}
          </span>
          <div className="inline-flex items-center rounded-lg bg-[#E5E4E2]/70 p-1 border border-[#D8D1CA] self-start">
            {(['2d', '3d'] as SimulationMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onUpdatePreferences({ defaultSimulationMode: m })}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                  preferences.defaultSimulationMode === m
                    ? 'bg-[#6F4E37] text-white'
                    : 'text-[#302820] hover:bg-white/70'
                }`}
              >
                {m === '2d' ? t.lab.mode2d : t.lab.mode3d}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 text-sm text-[#302820] cursor-pointer pt-2">
          <span>{t.settings.defaultVectorGridLabel}</span>
          <input
            type="checkbox"
            checked={preferences.showVectorGridByDefault}
            onChange={(e) =>
              onUpdatePreferences({ showVectorGridByDefault: e.target.checked })
            }
            className="w-4 h-4 accent-[#6F4E37] cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between gap-4 text-sm text-[#302820] cursor-pointer pt-2">
          <span>{t.settings.reducedMotionLabel}</span>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => onUpdatePreferences({ reducedMotion: e.target.checked })}
            className="w-4 h-4 accent-[#6F4E37] cursor-pointer"
          />
        </label>
      </section>

      {/* Server AI Connection Status (No API Key Inputs) */}
      <section className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 sm:p-7 space-y-3">
        <div className="flex items-center gap-2 text-[#302820]">
          <ShieldCheck className="w-5 h-5 text-[#6F4E37]" />
          <h2 className="text-base font-semibold">{t.settings.aiConnectionSection}</h2>
        </div>

        <div className="p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] flex items-start gap-3 text-sm">
          {geminiConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-[#6F4E37] shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-[#756B63] shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="text-[#302820] font-medium">
              {geminiConfigured
                ? t.settings.aiConnectedText
                : t.settings.aiNotConfiguredText}
            </p>
            <p className="text-xs text-[#756B63]">{t.settings.aiSecurityNote}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

