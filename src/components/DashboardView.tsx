import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Compass, GraduationCap, Layers, Users } from 'lucide-react';
import type {
  ExperimentCatalogItem,
  GradeClassLevel,
  LanguageCode,
  NcertChapterMeta,
  SimulationMode,
  StudentProgressMap,
  TextbookAnalysisResult,
  UserProfile,
  UserRole,
} from '../types/physics';
import type {
  BadgeDefinition,
  CompanionMessageState,
  RewardProgressState,
} from '../types/companion';
import type { TranslationBundle } from '../i18n/translations';
import { isExperimentLaunchable } from '../data/simulationRegistry';
import { requestCompanionReaction } from '../services/explainabilityApi';
import { loadRewardState } from '../services/rewardsEngine';
import { buildLocalCompanionMessage } from '../utils/companionFallback';
import heroMagnetismImg from '../assets/images/hero_magnetism_lab_1794907496509.jpg';
import { TextbookUploadCard } from './TextbookUploadCard';
import { ClassroomSelector } from './ClassroomSelector';
import { ConceptExperimentChooserModal } from './ConceptExperimentChooserModal';
import { ExperimentActivityModal } from './ExperimentActivityModal';
import { CompanionDock } from './CompanionDock';

interface DashboardViewProps {
  language: LanguageCode;
  t: TranslationBundle;
  geminiConfigured: boolean | null;
  selectedClass: GradeClassLevel;
  lockedClass?: GradeClassLevel;
  studentProgress: StudentProgressMap;
  userProfile: UserProfile | null;
  rewardState?: RewardProgressState;
  latestBadgeToast?: BadgeDefinition | null;
  reducedMotion?: boolean;
  onDismissBadgeToast?: () => void;
  onAskNovaFromDashboard?: (prefillQuestion?: string) => void;
  onOpenPortalAuth: (role: UserRole, mode?: 'login' | 'register') => void;
  onOpenActivePortal: () => void;
  onSelectClass: (classLevel: GradeClassLevel) => void;
  onAnalysisComplete: (
    result: TextbookAnalysisResult,
    fileName: string,
    previewUrl: string,
    rawImage?: { base64: string; mimeType: string }
  ) => void;
  onOpenLab: () => void;
  onLaunchExperiment: (experiment: ExperimentCatalogItem, mode?: SimulationMode) => void;
  onSaveProgress: (
    experimentId: string,
    patch: {
      quizScore?: number;
      quizTotal?: number;
      observation?: string;
      markCompleted?: boolean;
    }
  ) => void;
  onOpenSampleConcepts: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  language,
  t,
  geminiConfigured,
  selectedClass,
  lockedClass,
  studentProgress,
  userProfile,
  rewardState,
  latestBadgeToast = null,
  reducedMotion = false,
  onDismissBadgeToast,
  onAskNovaFromDashboard,
  onOpenPortalAuth,
  onOpenActivePortal,
  onSelectClass,
  onAnalysisComplete,
  onOpenLab,
  onLaunchExperiment,
  onSaveProgress,
  onOpenSampleConcepts,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [heroImageError, setHeroImageError] = useState(false);
  const [modalExperiment, setModalExperiment] = useState<ExperimentCatalogItem | null>(null);
  const [chooserChapter, setChooserChapter] = useState<{
    chapter: NcertChapterMeta;
    experiments: ExperimentCatalogItem[];
  } | null>(null);

  const effectiveRewardState = rewardState ?? loadRewardState(userProfile?.uid ?? 'guest');
  const [companionMessage, setCompanionMessage] = useState<CompanionMessageState>(() =>
    buildLocalCompanionMessage({
      eventType: userProfile ? 'returning_user' : 'dashboard_welcome',
      language,
      studentName: userProfile?.name,
      studentClass: selectedClass,
    })
  );

  useEffect(() => {
    const eventType = userProfile ? 'returning_user' : 'dashboard_welcome';
    setCompanionMessage(
      buildLocalCompanionMessage({
        eventType,
        language,
        studentName: userProfile?.name,
        studentClass: selectedClass,
      })
    );

    if (geminiConfigured === false) return;

    const ac = new AbortController();
    void requestCompanionReaction(
      {
        eventType,
        language,
        studentName: userProfile?.name,
        studentClass: selectedClass,
      },
      ac.signal
    ).then((res) => {
      if (!res || ac.signal.aborted) return;
      setCompanionMessage({
        id: `cmp_${Date.now()}`,
        eventType,
        text: res.speechText,
        emotion: res.emotion,
        pointTarget: 'none',
        quickPrompt: res.quickPromptSuggestion,
        createdAt: Date.now(),
      });
    });

    return () => ac.abort();
  }, [language, selectedClass, userProfile?.uid, userProfile?.name, geminiConfigured]);

  const handleBringToLife = () => {
    const uploadSection = document.getElementById('textbook-upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 250);
  };

  const handleChapterAction = (
    cls: GradeClassLevel,
    ch: NcertChapterMeta,
    chExps: ExperimentCatalogItem[]
  ) => {
    if (chExps.length === 1) {
      const target = chExps[0];
      if (isExperimentLaunchable(target)) {
        onLaunchExperiment(target, '2d');
      } else {
        setModalExperiment(target);
      }
      return;
    }

    if (chExps.length > 1) {
      setChooserChapter({ chapter: ch, experiments: chExps });
      return;
    }

    onSelectClass(cls);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center py-2">
          <p className="text-sm font-medium text-[#6F4E37] mb-3 tracking-wide">
            {t.hero.kicker}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#302820] tracking-tight leading-[1.12] mb-5 max-w-2xl"
            style={{ textWrap: 'balance' }}
          >
            {t.hero.headline}
          </h1>
          <p className="text-base sm:text-lg text-[#756B63] leading-relaxed max-w-xl mb-8">
            {t.hero.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleBringToLife}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6F4E37] text-white text-sm sm:text-base font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[46px]"
            >
              <span>{t.hero.primaryCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenLab}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E6E0F0] text-[#302820] text-sm sm:text-base font-semibold hover:bg-[#DCD3EA] transition-colors cursor-pointer min-h-[46px]"
            >
              <Compass className="w-4 h-4 text-[#6F4E37]" />
              <span>{t.hero.secondaryCta}</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Studio Still Life */}
        <div className="lg:col-span-5">
          <div className="h-full rounded-2xl border border-[#D8D1CA] bg-[#E5E4E2]/60 overflow-hidden shadow-xs flex flex-col">
            <div className="relative flex-1 min-h-[260px] bg-[#E5E4E2]">
              {!heroImageError ? (
                <img
                  src={heroMagnetismImg}
                  alt="Brass precision magnetic compass and bar magnet with iron filings dipole field pattern"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-[#F7F5F2] to-[#E5E4E2]">
                  <svg viewBox="0 0 280 180" className="w-64 h-40" aria-hidden="true">
                    <ellipse cx="140" cy="90" rx="115" ry="68" fill="none" stroke="#6F4E37" strokeWidth="1.2" strokeDasharray="4 4" />
                    <ellipse cx="140" cy="90" rx="85" ry="44" fill="none" stroke="#6F4E37" strokeWidth="1.4" />
                    <rect x="85" y="76" width="55" height="28" rx="3" fill="#B83A2D" />
                    <rect x="140" y="76" width="55" height="28" rx="3" fill="#3E4C59" />
                    <text x="112" y="95" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">N</text>
                    <text x="167" y="95" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">S</text>
                  </svg>
                </div>
              )}
            </div>
            <div className="px-5 py-3.5 bg-white border-t border-[#D8D1CA]">
              <p className="text-xs text-[#756B63] font-medium">
                {t.hero.caption}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Science Companion Nova & Rank Progress */}
      <CompanionDock
        variant="dashboard"
        language={language}
        t={t}
        message={companionMessage}
        rewardState={effectiveRewardState}
        latestBadgeToast={latestBadgeToast}
        reducedMotion={reducedMotion}
        onOpenFullTutor={(prefill) =>
          onAskNovaFromDashboard ? onAskNovaFromDashboard(prefill) : onOpenLab()
        }
        onDismissBadgeToast={onDismissBadgeToast}
      />

      {/* Student & Teacher Portals Entry Section */}
      <section aria-label="Account portals" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {userProfile ? (
          <div className="md:col-span-2 bg-white rounded-2xl border border-[#D8D1CA] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p
                className={`text-xs font-semibold ${
                  userProfile.role === 'teacher' ? 'text-[#2B5B6C]' : 'text-[#6F4E37]'
                }`}
              >
                {userProfile.role === 'teacher' ? 'Teacher Portal Active' : 'Student Portal Active'}
              </p>
              <h2 className="text-lg font-bold text-[#302820]">
                Signed in as {userProfile.name}
                {userProfile.role === 'student' && userProfile.selectedClass
                  ? ` · Class ${userProfile.selectedClass}`
                  : ''}
              </h2>
              <p className="text-xs text-[#756B63]">
                <span className="font-mono text-[#302820]">@{userProfile.username}</span>
                <span aria-hidden="true"> · </span>
                <span>Browser-Local Demo Account (IndexedDB)</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenActivePortal}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[44px] ${
                userProfile.role === 'teacher'
                  ? 'bg-[#2B5B6C] hover:bg-[#1E4350]'
                  : 'bg-[#6F4E37] hover:bg-[#5C402C]'
              }`}
            >
              <span>
                {userProfile.role === 'teacher' ? 'Open Teacher Portal' : 'Open Student Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Portal</span>
                </div>
                <h2 className="text-lg font-bold text-[#302820]">
                  Save Your Class 6–10 Progress &amp; Join Classes
                </h2>
                <p className="text-sm text-[#756B63]">
                  Create local student accounts per class (6–10), join your teacher&apos;s
                  classroom via code, and keep each student&apos;s progress separated.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenPortalAuth('student', 'login')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] cursor-pointer min-h-[40px]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPortalAuth('student', 'register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E6E0F0] text-[#302820] text-xs sm:text-sm font-semibold hover:bg-[#DCD3EA] cursor-pointer min-h-[40px]"
                >
                  <span>Create Student Account</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2B5B6C]">
                  <Users className="w-4 h-4" />
                  <span>Teacher Portal</span>
                </div>
                <h2 className="text-lg font-bold text-[#302820]">
                  Manage Physics Classrooms &amp; Student Progress
                </h2>
                <p className="text-sm text-[#756B63]">
                  Create Class 6–10 sections, generate unique join codes, and monitor real
                  student experiment completions and quiz assessments.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenPortalAuth('teacher', 'login')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2B5B6C] text-white text-xs sm:text-sm font-semibold hover:bg-[#1E4350] cursor-pointer min-h-[40px]"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPortalAuth('teacher', 'register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E8F1F4] text-[#1E4350] text-xs sm:text-sm font-semibold hover:bg-[#D7E7ED] cursor-pointer min-h-[40px]"
                >
                  <span>Create Teacher Account</span>
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Redesigned Vertical Expandable Classroom Selector */}
      <ClassroomSelector
        selectedClass={selectedClass}
        lockedClass={lockedClass}
        studentProgress={studentProgress}
        t={t}
        onSelectClass={onSelectClass}
        onChapterAction={handleChapterAction}
        onLaunchExperiment={onLaunchExperiment}
      />

      {/* Main Action Grid: Textbook Upload + Featured Magnetism Experiment */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex">
          <div className="w-full">
            <TextbookUploadCard
              language={language}
              t={t}
              geminiConfigured={geminiConfigured}
              onAnalysisComplete={onAnalysisComplete}
              fileInputRef={fileInputRef}
            />
          </div>
        </div>

        {/* Sample Experiment Card: Magnetic Field Around a Bar Magnet */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#D8D1CA] shadow-xs p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-[#6F4E37] mb-2">
              {t.sampleCard.kicker}
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#302820] mb-3">
              {t.sampleCard.title}
            </h2>
            <p className="text-sm text-[#756B63] leading-relaxed mb-6">
              {t.sampleCard.description}
            </p>

            {/* Clean Scientific Dipole Schematic Preview */}
            <div className="rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] p-5 mb-5 flex items-center justify-center">
              <svg viewBox="0 0 320 150" className="w-full max-w-[290px] h-auto" aria-hidden="true">
                {/* Dipole field curves */}
                <path d="M 102 65 C 85 18, 235 18, 218 65" fill="none" stroke="#6F4E37" strokeWidth="1.5" opacity="0.85" />
                <path d="M 102 65 C 55 4, 265 4, 218 65" fill="none" stroke="#756B63" strokeWidth="1.1" opacity="0.65" />
                <path d="M 102 85 C 85 132, 235 132, 218 85" fill="none" stroke="#6F4E37" strokeWidth="1.5" opacity="0.85" />
                <path d="M 102 85 C 55 146, 265 146, 218 85" fill="none" stroke="#756B63" strokeWidth="1.1" opacity="0.65" />
                {/* Direction arrows */}
                <polygon points="163,29 156,25 156,33" fill="#6F4E37" />
                <polygon points="163,121 156,117 156,125" fill="#6F4E37" />
                {/* Bar Magnet */}
                <rect x="98" y="62" width="62" height="26" rx="3" fill="#B83A2D" />
                <rect x="160" y="62" width="62" height="26" rx="3" fill="#3E4C59" />
                <line x1="160" y1="62" x2="160" y2="88" stroke="#E5E4E2" strokeWidth="2" />
                <text x="129" y="80" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">N</text>
                <text x="191" y="80" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="700">S</text>
                {/* Miniature compass */}
                <circle cx="256" cy="44" r="14" fill="#FFFFFF" stroke="#6F4E37" strokeWidth="1.6" />
                <polygon points="264,49 254,41 251,45" fill="#B83A2D" />
                <polygon points="248,39 254,41 251,45" fill="#3E4C59" />
              </svg>
            </div>

            <p className="text-xs text-[#756B63] font-medium">
              {t.sampleCard.includesLabel}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#D8D1CA] flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenLab}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#6F4E37] text-white text-sm font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <Layers className="w-4 h-4" />
              <span>{t.sampleCard.launchLab}</span>
            </button>
            <button
              type="button"
              onClick={onOpenSampleConcepts}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E6E0F0] text-[#302820] text-sm font-medium hover:bg-[#DCD3EA] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-[#6F4E37]" />
              <span>{t.sampleCard.exploreConcepts}</span>
            </button>
          </div>
        </aside>
      </section>

      {/* Three-Step Learning Architecture Strip */}
      <section className="border-t border-[#D8D1CA] pt-10">
        <h2 className="text-xl sm:text-2xl font-semibold text-[#302820] mb-8">
          {t.workflow.heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white rounded-xl border border-[#D8D1CA] p-6">
            <h3 className="text-base font-semibold text-[#302820] mb-2">
              {t.workflow.step1Title}
            </h3>
            <p className="text-sm text-[#756B63] leading-relaxed">
              {t.workflow.step1Desc}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#D8D1CA] p-6">
            <h3 className="text-base font-semibold text-[#302820] mb-2">
              {t.workflow.step2Title}
            </h3>
            <p className="text-sm text-[#756B63] leading-relaxed">
              {t.workflow.step2Desc}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#D8D1CA] p-6">
            <h3 className="text-base font-semibold text-[#302820] mb-2">
              {t.workflow.step3Title}
            </h3>
            <p className="text-sm text-[#756B63] leading-relaxed">
              {t.workflow.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {chooserChapter && (
        <ConceptExperimentChooserModal
          chapter={chooserChapter.chapter}
          experiments={chooserChapter.experiments}
          studentProgress={studentProgress}
          t={t}
          onLaunchExperiment={onLaunchExperiment}
          onOpenActivityGuide={(exp) => setModalExperiment(exp)}
          onClose={() => setChooserChapter(null)}
        />
      )}

      {modalExperiment && (
        <ExperimentActivityModal
          experiment={modalExperiment}
          completion={studentProgress[modalExperiment.id]}
          t={t}
          onClose={() => setModalExperiment(null)}
          onSaveProgress={onSaveProgress}
        />
      )}
    </div>
  );
};
