import React, { useState } from 'react';
import { LogIn, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import type { AppView, LanguageCode, UserProfile } from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  userProfile: UserProfile | null;
  authReady: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  t: TranslationBundle;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  userProfile,
  authReady,
  onOpenAuth,
  onLogout,
  t,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ id: AppView; label: string }> =
    userProfile?.role === 'teacher'
      ? [
          { id: 'teacher_portal', label: 'Teacher Portal' },
          { id: 'explore', label: t.nav.explorePhysics },
          { id: 'home', label: t.nav.home },
          { id: 'settings', label: t.nav.settings },
        ]
      : userProfile?.role === 'student'
        ? [
            { id: 'student_portal', label: 'Student Portal' },
            { id: 'explore', label: t.nav.explorePhysics },
            { id: 'learning', label: t.nav.myLearning },
            { id: 'home', label: t.nav.home },
            { id: 'settings', label: t.nav.settings },
          ]
        : [
            { id: 'home', label: t.nav.home },
            { id: 'learning', label: t.nav.myLearning },
            { id: 'explore', label: t.nav.explorePhysics },
            { id: 'settings', label: t.nav.settings },
          ];

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const portalView: AppView =
    userProfile?.role === 'teacher' ? 'teacher_portal' : 'student_portal';

  return (
    <header className="sticky top-0 z-40 bg-[#F7F5F2]/95 border-b border-[#D8D1CA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect(userProfile ? portalView : 'home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-4 rounded-md"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="2" y="9" width="10" height="6" rx="1.5" fill="#6F4E37" />
            <rect
              x="12"
              y="9"
              width="10"
              height="6"
              rx="1.5"
              fill="#E5E4E2"
              stroke="#6F4E37"
              strokeWidth="1.5"
            />
            <path
              d="M5 9C5 4.5 19 4.5 19 9"
              stroke="#6F4E37"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M5 15C5 19.5 19 19.5 19 15"
              stroke="#756B63"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-['Outfit'] text-lg font-bold tracking-tight text-[#302820]">
            {t.brand.name}
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'explore' && (currentView === 'lab' || currentView === 'concepts'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-4 ${
                  isActive
                    ? userProfile?.role === 'teacher' && item.id === 'teacher_portal'
                      ? 'text-[#2B5B6C]'
                      : 'text-[#6F4E37]'
                    : 'text-[#756B63] hover:text-[#302820]'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-0 bottom-0 h-0.5 rounded-full transition-opacity duration-150 ${
                    isActive
                      ? `${
                          userProfile?.role === 'teacher' && item.id === 'teacher_portal'
                            ? 'bg-[#2B5B6C]'
                            : 'bg-[#6F4E37]'
                        } opacity-100`
                      : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Selector + Portal Sign In / Account Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:block">
            <LanguageSelector language={language} onChange={onLanguageChange} compact />
          </div>

          {authReady && (
            <>
              {userProfile ? (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelect(portalView)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap max-w-[160px] ${
                      userProfile.role === 'teacher'
                        ? 'bg-[#E8F1F4] border-[#2B5B6C]/30 text-[#1E4350] hover:bg-[#D7E7ED]'
                        : 'bg-[#E6E0F0] border-[#6F4E37]/25 text-[#302820] hover:bg-[#DCD3EA]'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{userProfile.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    aria-label="Sign Out"
                    title="Sign Out"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#D8D1CA] bg-white text-[#756B63] hover:text-[#302820] hover:bg-[#F7F5F2] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="navbar-signin-btn"
                  onClick={() => {
                    onOpenAuth();
                    setMobileOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer whitespace-nowrap min-h-[38px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={t.nav.menu}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#D8D1CA] bg-white text-[#302820] hover:bg-[#E5E4E2]/50 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#D8D1CA] bg-[#FFFFFF] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#E6E0F0]/60 text-[#6F4E37]'
                      : 'text-[#302820] hover:bg-[#F7F5F2]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[#D8D1CA] flex items-center justify-between gap-3">
            <LanguageSelector language={language} onChange={onLanguageChange} compact />
            {userProfile ? (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8D1CA] text-xs font-semibold text-[#302820]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onOpenAuth();
                  setMobileOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
