import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bell,
  CheckCircle2,
  FlaskConical,
  Lock,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  AppView,
  GradeClassLevel,
  LanguageCode,
  TeacherNotification,
  UserProfile,
} from '../types/physics';
import type { BadgeDefinition, GuidedClassroomActivity } from '../types/companion';
import type { TranslationBundle } from '../i18n/translations';
import { CLASS_LEVELS } from '../data/ncertCurriculum';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  selectedClass: GradeClassLevel;
  lockedClass?: GradeClassLevel;
  onSelectClass: (cls: GradeClassLevel) => void;
  userProfile: UserProfile | null;
  authReady: boolean;
  teacherNotifications?: TeacherNotification[];
  studentGuidedActivities?: GuidedClassroomActivity[];
  latestBadgeToast?: BadgeDefinition | null;
  onDismissBadgeToast?: () => void;
  onOpenGuidedActivity?: (activity: GuidedClassroomActivity) => void;
  onToggleMobileSidebar: () => void;
  mobileSidebarOpen: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  t: TranslationBundle;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  language,
  onLanguageChange,
  selectedClass,
  lockedClass,
  onSelectClass,
  userProfile,
  authReady,
  teacherNotifications = [],
  studentGuidedActivities = [],
  latestBadgeToast = null,
  onDismissBadgeToast,
  onOpenGuidedActivity,
  onToggleMobileSidebar,
  mobileSidebarOpen,
  onOpenAuth,
  onLogout,
  t,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [notifOpen]);

  const portalView: AppView =
    userProfile?.role === 'teacher' ? 'teacher_portal' : 'student_portal';

  const unreadTeacherNotifs = teacherNotifications.filter((n) => !n.isRead);
  const realNotifCount =
    userProfile?.role === 'teacher'
      ? unreadTeacherNotifs.length
      : studentGuidedActivities.length + (latestBadgeToast ? 1 : 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#D8D1CA]">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-5">
        {/* Left Zone: Mobile Sidebar Menu + Brand Logo & Tagline */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label={t.nav.menu}
            aria-expanded={mobileSidebarOpen}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#D8D1CA] bg-[#F7F5F2] text-[#302820] hover:bg-[#E6E0F0]/50 cursor-pointer shrink-0"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-4 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6F4E37] flex items-center justify-center shrink-0 shadow-xs">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect x="2" y="9" width="10" height="6" rx="1.5" fill="#FFFFFF" />
                <rect
                  x="12"
                  y="9"
                  width="10"
                  height="6"
                  rx="1.5"
                  fill="#E6E0F0"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                />
                <path
                  d="M5 9C5 4.8 19 4.8 19 9"
                  stroke="#E6E0F0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 15C5 19.2 19 19.2 19 15"
                  stroke="#FFFFFF"
                  strokeOpacity="0.75"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="font-['Outfit'] text-base sm:text-lg font-bold tracking-tight text-[#302820] block leading-tight">
                {t.brand.name}
              </span>
              <span className="hidden md:block text-[11px] text-[#756B63] truncate max-w-[260px]">
                {t.brand.tagline}
              </span>
            </div>
          </button>
        </div>

        {/* Right Zone: Class Selector, Language, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Class Selector */}
          {lockedClass ? (
            <div
              title={`Registered in Class ${lockedClass}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8D1CA] bg-[#F7F5F2] text-xs font-semibold text-[#6F4E37] min-h-[38px]"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {t.classLibrary.classPrefix} {lockedClass}
              </span>
            </div>
          ) : (
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#D8D1CA] bg-[#F7F5F2] text-xs font-semibold text-[#302820] min-h-[38px] hover:border-[#6F4E37]/60 transition-colors">
              <span className="sr-only">Select NCERT Class</span>
              <select
                aria-label="Select NCERT Class"
                data-testid="header-class-selector"
                value={selectedClass}
                onChange={(e) =>
                  onSelectClass(Number(e.target.value) as GradeClassLevel)
                }
                className="bg-transparent text-xs font-semibold text-[#302820] focus:outline-none cursor-pointer pr-1"
              >
                {CLASS_LEVELS.map((cls) => (
                  <option key={cls} value={cls}>
                    {t.classLibrary.classPrefix} {cls}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Language Selector */}
          <div className="hidden sm:block">
            <LanguageSelector language={language} onChange={onLanguageChange} compact />
          </div>

          {/* Notifications Popover */}
          <div className="relative" ref={notifContainerRef}>
            <button
              type="button"
              data-testid="header-notifications-btn"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-expanded={notifOpen}
              aria-label={`Notifications (${realNotifCount})`}
              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-colors cursor-pointer ${
                notifOpen
                  ? 'bg-[#E6E0F0] border-[#6F4E37] text-[#302820]'
                  : 'bg-[#F7F5F2] border-[#D8D1CA] text-[#302820] hover:border-[#6F4E37]/60'
              }`}
            >
              <Bell className="w-4 h-4 text-[#6F4E37]" />
              {realNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#6F4E37] text-white text-[10px] font-bold font-mono-tabular flex items-center justify-center">
                  {realNotifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                role="region"
                aria-label="Notifications"
                className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white border border-[#D8D1CA] shadow-lg p-4 space-y-3 z-50"
              >
                <div className="flex items-center justify-between border-b border-[#D8D1CA] pb-2.5">
                  <span className="text-sm font-bold text-[#302820]">Notifications</span>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Close notifications"
                    className="p-1 rounded-lg text-[#756B63] hover:text-[#302820] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {realNotifCount === 0 ? (
                  <p className="text-xs text-[#756B63] leading-relaxed py-2">
                    You&apos;re all caught up. Classroom updates, guided labs, and badge milestones
                    appear here.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {latestBadgeToast && (
                      <div className="p-3 rounded-xl bg-[#E6E0F0]/55 border border-[#D8D1CA] flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Award className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#302820]">
                              Badge Unlocked: {latestBadgeToast.title[language]}
                            </p>
                            <p className="text-[#756B63] mt-0.5">
                              {latestBadgeToast.description[language]}
                            </p>
                          </div>
                        </div>
                        {onDismissBadgeToast && (
                          <button
                            type="button"
                            onClick={onDismissBadgeToast}
                            className="text-[11px] font-semibold text-[#6F4E37] hover:underline cursor-pointer shrink-0"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    )}

                    {userProfile?.role === 'teacher' &&
                      unreadTeacherNotifs.slice(0, 5).map((n) => (
                        <button
                          key={n.notificationId}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            onNavigate('teacher_portal');
                          }}
                          className="w-full text-left p-3 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] hover:border-[#6F4E37] flex items-start gap-2 text-xs cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#302820]">{n.title}</p>
                            <p className="text-[#756B63]">{n.message}</p>
                          </div>
                        </button>
                      ))}

                    {userProfile?.role === 'student' &&
                      studentGuidedActivities.slice(0, 5).map((act) => (
                        <button
                          key={act.activityId}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            if (onOpenGuidedActivity) {
                              onOpenGuidedActivity(act);
                            } else {
                              onNavigate('student_portal');
                            }
                          }}
                          className="w-full text-left p-3 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] hover:border-[#6F4E37] flex items-start gap-2 text-xs cursor-pointer"
                        >
                          <FlaskConical className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#302820]">
                              Guided Lab: {act.experimentTitle}
                            </p>
                            <p className="text-[#756B63]">
                              {act.className} · {act.teacherName}
                            </p>
                          </div>
                        </button>
                      ))}

                    {teacherNotifications.length > 0 &&
                      unreadTeacherNotifs.length === 0 &&
                      userProfile?.role === 'teacher' && (
                        <div className="flex items-center gap-2 text-xs text-[#756B63] py-1">
                          <CheckCircle2 className="w-4 h-4 text-[#6F4E37]" />
                          <span>All teacher notifications read.</span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile / Sign In Action */}
          {authReady && (
            <>
              {userProfile ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(portalView)}
                    className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#E6E0F0]/75 border border-[#D8D1CA] text-xs font-semibold text-[#302820] hover:bg-[#E6E0F0] transition-colors cursor-pointer whitespace-nowrap max-w-[165px] min-h-[38px]"
                  >
                    <span className="w-6 h-6 rounded-lg bg-[#6F4E37] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline truncate">{userProfile.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    aria-label="Sign Out"
                    title="Sign Out"
                    className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#D8D1CA] bg-[#F7F5F2] text-[#756B63] hover:text-[#302820] hover:bg-[#E5E4E2]/60 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="navbar-signin-btn"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer whitespace-nowrap min-h-[38px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
