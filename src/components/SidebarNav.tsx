import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  BookOpen,
  Camera,
  FlaskConical,
  Home,
  LogIn,
  MessageSquareText,
  Settings,
  TrendingUp,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { AppView, LanguageCode, UserProfile } from '../types/physics';
import type { RewardProgressState } from '../types/companion';
import { BADGE_CATALOG } from '../services/rewardsEngine';

export type SidebarItemId =
  | 'home'
  | 'learn'
  | 'experiments'
  | 'ai_tutor'
  | 'scan_textbook'
  | 'my_progress'
  | 'achievements';

interface SidebarNavProps {
  currentView: AppView;
  activeSidebarOverride?: SidebarItemId | null;
  language: LanguageCode;
  userProfile: UserProfile | null;
  rewardState: RewardProgressState;
  reducedMotion?: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectItem: (item: SidebarItemId) => void;
  onNavigateView: (view: AppView) => void;
  onOpenAuth: () => void;
}

const SIDEBAR_LABELS: Record<
  LanguageCode,
  {
    home: string;
    learn: string;
    experiments: string;
    aiTutor: string;
    scanTextbook: string;
    myProgress: string;
    achievements: string;
    settings: string;
    portal: string;
    signIn: string;
    studentRole: string;
    teacherRole: string;
    guestRole: string;
    menuTitle: string;
  }
> = {
  en: {
    home: 'Home',
    learn: 'Learn',
    experiments: 'Experiments',
    aiTutor: 'AI Tutor',
    scanTextbook: 'Scan Textbook',
    myProgress: 'My Progress',
    achievements: 'Achievements',
    settings: 'Settings',
    portal: 'My Portal',
    signIn: 'Sign In',
    studentRole: 'Student',
    teacherRole: 'Teacher',
    guestRole: 'Guest Explorer',
    menuTitle: 'Navigation',
  },
  kn: {
    home: 'ಮುಖಪುಟ',
    learn: 'ಕಲಿಯಿರಿ',
    experiments: 'ಪ್ರಯೋಗಗಳು',
    aiTutor: 'AI ಟ್ಯೂಟರ್',
    scanTextbook: 'ಪುಸ್ತಕ ಸ್ಕ್ಯಾನ್',
    myProgress: 'ನನ್ನ ಪ್ರಗತಿ',
    achievements: 'ಸಾಧನೆಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    portal: 'ನನ್ನ ಪೋರ್ಟಲ್',
    signIn: 'ಸೈನ್ ಇನ್',
    studentRole: 'ವಿದ್ಯಾರ್ಥಿ',
    teacherRole: 'ಶಿಕ್ಷಕರು',
    guestRole: 'ಅತಿಥಿ',
    menuTitle: 'ನ್ಯಾವಿಗೇಷನ್',
  },
  hi: {
    home: 'होम',
    learn: 'सीखें',
    experiments: 'प्रयोग',
    aiTutor: 'AI ट्यूटर',
    scanTextbook: 'पाठ्यपुस्तक स्कैन',
    myProgress: 'मेरी प्रगति',
    achievements: 'उपलब्धियाँ',
    settings: 'सेटिंग्स',
    portal: 'मेरा पोर्टल',
    signIn: 'साइन इन',
    studentRole: 'विद्यार्थी',
    teacherRole: 'शिक्षक',
    guestRole: 'अतिथि',
    menuTitle: 'नेविगेशन',
  },
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentView,
  activeSidebarOverride = null,
  language,
  userProfile,
  rewardState,
  reducedMotion = false,
  mobileOpen,
  onCloseMobile,
  onSelectItem,
  onNavigateView,
  onOpenAuth,
}) => {
  const labels = SIDEBAR_LABELS[language];

  const resolvedActive: SidebarItemId | 'settings' | 'auth' = (() => {
    if (activeSidebarOverride) return activeSidebarOverride;
    if (currentView === 'home') return 'home';
    if (currentView === 'concepts') return 'learn';
    if (currentView === 'explore') return 'experiments';
    if (currentView === 'lab') return 'experiments';
    if (
      currentView === 'learning' ||
      currentView === 'student_portal' ||
      currentView === 'teacher_portal'
    ) {
      return 'my_progress';
    }
    if (currentView === 'settings') return 'settings';
    if (currentView === 'auth') return 'auth';
    return 'home';
  })();

  const items: Array<{
    id: SidebarItemId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    meta?: string;
  }> = [
    { id: 'home', label: labels.home, icon: Home },
    { id: 'learn', label: labels.learn, icon: BookOpen },
    { id: 'experiments', label: labels.experiments, icon: FlaskConical },
    { id: 'ai_tutor', label: labels.aiTutor, icon: MessageSquareText },
    { id: 'scan_textbook', label: labels.scanTextbook, icon: Camera },
    { id: 'my_progress', label: labels.myProgress, icon: TrendingUp },
    {
      id: 'achievements',
      label: labels.achievements,
      icon: Award,
      meta: `${rewardState.unlockedBadgeIds.length}/${BADGE_CATALOG.length}`,
    },
  ];

  const renderSidebarBody = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full bg-[#6F4E37] text-white select-none">
      {isMobileDrawer && (
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-['Outfit'] text-base font-bold tracking-tight text-white">
              PHYSIX AI
            </span>
            <span className="text-xs text-white/75">· {labels.menuTitle}</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="p-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Primary Sidebar Navigation */}
      <nav
        aria-label="Primary sidebar navigation"
        className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = resolvedActive === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`sidebar-nav-${item.id}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                onSelectItem(item.id);
                if (isMobileDrawer) onCloseMobile();
              }}
              className={`group relative w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer min-h-[44px] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#E6E0F0] focus-visible:outline-offset-2 ${
                isActive
                  ? 'text-[#302820] font-semibold'
                  : 'text-white/90 hover:bg-white/12 hover:text-white'
              }`}
            >
              {isActive &&
                (reducedMotion || isMobileDrawer ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-xl bg-[#F7F5F2] shadow-xs"
                  />
                ) : (
                  <motion.span
                    layoutId="physix-sidebar-active-bg"
                    aria-hidden="true"
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 rounded-xl bg-[#F7F5F2] shadow-xs"
                  />
                ))}
              <span className="relative z-10 flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                    isActive
                      ? 'text-[#6F4E37]'
                      : 'text-[#E6E0F0] group-hover:translate-x-0.5'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span
                  className={`relative z-10 font-mono-tabular text-[11px] font-semibold shrink-0 ${
                    isActive ? 'text-[#6F4E37]' : 'text-white/75'
                  }`}
                >
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Section: Settings & Account */}
      <div className="px-3 py-4 border-t border-white/15 space-y-1.5 shrink-0">
        <button
          type="button"
          data-testid="sidebar-nav-settings"
          aria-current={resolvedActive === 'settings' ? 'page' : undefined}
          onClick={() => {
            onNavigateView('settings');
            if (isMobileDrawer) onCloseMobile();
          }}
          className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer min-h-[44px] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#E6E0F0] ${
            resolvedActive === 'settings'
              ? 'bg-[#F7F5F2] text-[#302820] font-semibold shadow-xs'
              : 'text-white/85 hover:bg-white/12 hover:text-white'
          }`}
        >
          <Settings
            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
              resolvedActive === 'settings'
                ? 'text-[#6F4E37]'
                : 'text-[#E6E0F0] group-hover:rotate-12'
            }`}
          />
          <span className="truncate">{labels.settings}</span>
        </button>

        {userProfile ? (
          <button
            type="button"
            onClick={() => {
              onNavigateView(
                userProfile.role === 'teacher' ? 'teacher_portal' : 'student_portal'
              );
              if (isMobileDrawer) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 text-left transition-colors cursor-pointer min-h-[44px]"
          >
            <div className="w-7 h-7 rounded-lg bg-[#E6E0F0] text-[#302820] flex items-center justify-center text-xs font-bold shrink-0">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userProfile.name}
              </p>
              <p className="text-[11px] text-white/75 truncate">
                {userProfile.role === 'teacher'
                  ? labels.teacherRole
                  : `${labels.studentRole} · Class ${userProfile.selectedClass ?? 6}`}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onOpenAuth();
              if (isMobileDrawer) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer min-h-[44px] ${
              resolvedActive === 'auth'
                ? 'bg-[#F7F5F2] text-[#302820] font-semibold'
                : 'bg-white/10 text-white hover:bg-white/18'
            }`}
          >
            {resolvedActive === 'auth' ? (
              <UserIcon className="w-4 h-4 shrink-0 text-[#6F4E37]" />
            ) : (
              <LogIn className="w-4 h-4 shrink-0 text-[#E6E0F0]" />
            )}
            <span className="truncate">{labels.signIn}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Mocha Brown Left Sidebar */}
      <aside className="hidden lg:block lg:w-60 lg:shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] border-r border-[#5C402C] z-30">
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation sidebar"
        >
          <div
            className="fixed inset-0 bg-[#302820]/45"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-xl z-10">
            {renderSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
};
