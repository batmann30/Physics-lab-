import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Flame,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Layers,
  Play,
  RefreshCw,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import type {
  ExperimentCatalogItem,
  GradeClassLevel,
  LanguageCode,
  NcertChapterMeta,
  SimulationEngineId,
  SimulationMode,
  StudentProgressMap,
  TextbookAnalysisResult,
  UserProfile,
  UserRole,
} from '../types/physics';
import type {
  BadgeDefinition,
  CompanionEmotion,
  CompanionMessageState,
  CompanionPointTarget,
  RewardProgressState,
} from '../types/companion';
import type { TranslationBundle } from '../i18n/translations';
import { EXPERIMENT_CATALOGUE } from '../data/ncertCurriculum';
import { isExperimentLaunchable } from '../data/simulationRegistry';
import {
  getDailyChallengeForClass,
  getTodayIsoLocal,
  loadTodayChallengeAttempt,
  saveTodayChallengeAttempt,
} from '../data/dailyChallenges';
import { requestCompanionReaction } from '../services/explainabilityApi';
import { BADGE_CATALOG, getRankForXp, loadRewardState } from '../services/rewardsEngine';
import { buildLocalCompanionMessage } from '../utils/companionFallback';
import { TutorAudioController, type TutorAudioSnapshot } from '../utils/speechUtils';
import heroMagnetismImg from '../assets/images/hero_magnetism_lab_1794907496509.jpg';
import batteryImg from '../assets/images/battery_component_1794946708574.jpg';
import glassSlabImg from '../assets/images/glass_slab_refraction_1794950274854.jpg';
import kinematicsCartImg from '../assets/images/kinematics_cart_track_1794950277166.jpg';
import pulleyLeverImg from '../assets/images/pulley_lever_rig_1794950277789.jpg';
import thermometerHeatImg from '../assets/images/thermometer_calorimetry_1794950278404.jpg';
import tuningForkImg from '../assets/images/tuning_fork_sound_1794950279538.jpg';
import buoyancyBalanceImg from '../assets/images/buoyancy_spring_balance_1794950279672.jpg';
import { PhysixCompanionAvatar } from './PhysixCompanionAvatar';
import { TextbookUploadCard } from './TextbookUploadCard';
import { ClassroomSelector } from './ClassroomSelector';
import { ConceptExperimentChooserModal } from './ConceptExperimentChooserModal';
import { ExperimentActivityModal } from './ExperimentActivityModal';

export interface LastAccessedExperimentInfo {
  experimentId: string;
  accessedAt: string;
  mode: SimulationMode;
}

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
  sessionsCount?: number;
  savedDynamicCount?: number;
  lastAccessedExperiment?: LastAccessedExperimentInfo | null;
  recentCompletedExperimentId?: string | null;
  onDismissRecentCompletion?: () => void;
  onSolveDailyChallenge?: (dateIso: string) => void;
  onDismissBadgeToast?: () => void;
  onAskNovaFromDashboard?: (prefillQuestion?: string) => void;
  onOpenPortalAuth: (role: UserRole, mode?: 'login' | 'register') => void;
  onOpenActivePortal: () => void;
  onOpenAchievements?: () => void;
  onOpenExperimentsLibrary?: () => void;
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

const ENGINE_THUMBNAIL_MAP: Record<SimulationEngineId, string> = {
  bar_magnet: heroMagnetismImg,
  electric_circuit_lab: batteryImg,
  optics_ray_lab: glassSlabImg,
  motion_kinematics: kinematicsCartImg,
  simple_machines_energy: pulleyLeverImg,
  heat_transfer_lab: thermometerHeatImg,
  sound_wave_lab: tuningForkImg,
  force_friction_buoyancy: buoyancyBalanceImg,
};

const DASHBOARD_UI_COPY: Record<
  LanguageCode,
  {
    letsLearnBtn: string;
    exploreExperimentsBtn: string;
    welcomeGuest: string;
    welcomeNamedPrefix: string;
    novaLabel: string;
    novaTapHint: string;
    novaWaveBtn: string;
    novaTips: [string, string, string];
    novaCompletedGreeting: string;
    cardLearnTitle: string;
    cardLearnDesc: string;
    cardLearnCta: string;
    cardRunTitle: string;
    cardRunDesc: string;
    cardRunCta: string;
    cardScanTitle: string;
    cardScanDesc: string;
    cardScanCta: string;
    cardTutorTitle: string;
    cardTutorDesc: string;
    cardTutorCta: string;
    continueLearningTitle: string;
    viewAllLink: string;
    continueBtn: string;
    revisitBtn: string;
    startFirstLabBtn: string;
    emptyContinueTitle: string;
    emptyContinueDesc: string;
    inProgressLabel: string;
    yourProgressTitle: string;
    achievementsLink: string;
    completedLabel: string;
    streakLabel: string;
    daysUnit: string;
    milestoneHeading: string;
    badgesHeading: string;
    dailyChallengeHeading: string;
    dailyChallengeBadge: string;
    tryInLabBtn: string;
    nextPracticeBtn: string;
    correctChallengeLabel: string;
    incorrectChallengeLabel: string;
    listenLabel: string;
    stopListenLabel: string;
  }
> = {
  en: {
    letsLearnBtn: "Let's Learn",
    exploreExperimentsBtn: 'Explore Experiments',
    welcomeGuest: 'Welcome to PHYSIX AI',
    welcomeNamedPrefix: 'Welcome back,',
    novaLabel: 'Nova · Your Physics Lab Companion',
    novaTapHint: 'Tap Nova to wave',
    novaWaveBtn: 'Say Hi & Tip',
    novaTips: [
      'Explore interactive 2D & 3D experiments, photograph any textbook page, or try today’s Daily Physics Challenge below!',
      'Curiosity tip: Inside any lab, tap a magnet, lens, or circuit wire to ask how it works and watch variables respond live.',
      'Ready to build mastery? Complete experiments and record observations to earn XP and unlock new Science Rank badges!',
    ],
    novaCompletedGreeting: 'Great job completing your physics experiment! Ready for your next discovery?',
    cardLearnTitle: 'Learn Concepts',
    cardLearnDesc: 'Explore NCERT chapters, visual breakdowns & key equations.',
    cardLearnCta: 'Open Concepts',
    cardRunTitle: 'Run Experiments',
    cardRunDesc: 'Launch interactive 2D and 3D physics simulations.',
    cardRunCta: 'Browse Labs',
    cardScanTitle: 'Scan Textbook',
    cardScanDesc: 'Photograph any page to generate an interactive lab.',
    cardScanCta: 'Upload Page',
    cardTutorTitle: 'Ask AI Tutor',
    cardTutorDesc: 'Get voice & text help in English, ಕನ್ನಡ, or हिन्दी.',
    cardTutorCta: 'Chat with Nova',
    continueLearningTitle: 'Continue Learning',
    viewAllLink: 'All Experiments',
    continueBtn: 'Continue',
    revisitBtn: 'Revisit Lab',
    startFirstLabBtn: 'Start First Lab',
    emptyContinueTitle: 'No experiments started yet',
    emptyContinueDesc:
      'Pick your first NCERT experiment below or launch a guided simulation to start tracking real progress.',
    inProgressLabel: 'Last opened',
    yourProgressTitle: 'Your Progress',
    achievementsLink: 'All Badges',
    completedLabel: 'Completed',
    streakLabel: 'Streak',
    daysUnit: 'days',
    milestoneHeading: 'Next Milestone',
    badgesHeading: 'Achievement Badges',
    dailyChallengeHeading: 'Daily Physics Challenge',
    dailyChallengeBadge: 'Quick Check · +20 XP',
    tryInLabBtn: 'Test in Interactive Lab',
    nextPracticeBtn: 'Practice Another',
    correctChallengeLabel: 'Correct!',
    incorrectChallengeLabel: 'Not quite — check the physics:',
    listenLabel: 'Listen',
    stopListenLabel: 'Stop',
  },
  kn: {
    letsLearnBtn: 'ಕಲಿಯೋಣ ಬನ್ನಿ',
    exploreExperimentsBtn: 'ಪ್ರಯೋಗಗಳನ್ನು ನೋಡಿ',
    welcomeGuest: 'PHYSIX AI ಗೆ ಸ್ವಾಗತ',
    welcomeNamedPrefix: 'ಮತ್ತೆ ಸ್ವಾಗತ,',
    novaLabel: 'ನೋವಾ · ನಿಮ್ಮ ಭೌತಶಾಸ್ತ್ರ ಸಂಗಾತಿ',
    novaTapHint: 'ನೋವಾ ಸ್ಪರ್ಶಿಸಿ',
    novaWaveBtn: 'ಹಲೋ ಹೇಳಿ',
    novaTips: [
      'ಸಂವಾದಾತ್ಮಕ 2D ಮತ್ತು 3D ಪ್ರಯೋಗಗಳನ್ನು ನಡೆಸಿ, ಪಠ್ಯಪುಸ್ತಕದ ಪುಟ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಇಂದಿನ ಸವಾಲು ಪ್ರಯತ್ನಿಸಿ!',
      'ಸಲಹೆ: ಪ್ರಯೋಗಶಾಲೆಯಲ್ಲಿ ಯಾವುದೇ ಉಪಕರಣವನ್ನು ಸ್ಪರ್ಶಿಸಿ ಅದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ತಿಳಿಯಿರಿ.',
      'ಪ್ರಯೋಗಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ವೀಕ್ಷಣೆಗಳನ್ನು ದಾಖಲಿಸಿ XP ಹಾಗೂ ವಿಜ್ಞಾನ ಬ್ಯಾಡ್ಜ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ!',
    ],
    novaCompletedGreeting: 'ಅದ್ಭುತ! ನಿಮ್ಮ ಭೌತಶಾಸ್ತ್ರ ಪ್ರಯೋಗ ಪೂರ್ಣಗೊಂಡಿದೆ. ಮುಂದಿನ ಪ್ರಯೋಗಕ್ಕೆ ಸಿದ್ಧರೇ?',
    cardLearnTitle: 'ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಕಲಿಯಿರಿ',
    cardLearnDesc: 'NCERT ಅಧ್ಯಾಯಗಳು, ವಿವರಣೆ ಮತ್ತು ಸಮೀಕರಣಗಳನ್ನು ಓದಿ.',
    cardLearnCta: 'ಪರಿಕಲ್ಪನೆ ತೆರೆಯಿರಿ',
    cardRunTitle: 'ಪ್ರಯೋಗಗಳನ್ನು ನಡೆಸಿ',
    cardRunDesc: 'ಸಂವಾದಾತ್ಮಕ 2D ಮತ್ತು 3D ಭೌತಶಾಸ್ತ್ರ ಪ್ರಯೋಗಗಳನ್ನು ತೆರೆಯಿರಿ.',
    cardRunCta: 'ಲ್ಯಾಬ್‌ಗಳನ್ನು ನೋಡಿ',
    cardScanTitle: 'ಪುಸ್ತಕ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
    cardScanDesc: 'ಪಠ್ಯಪುಸ್ತಕದ ಪುಟದ ಫೋಟೋದಿಂದ ಲೈವ್ ಲ್ಯಾಬ್ ರಚಿಸಿ.',
    cardScanCta: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್',
    cardTutorTitle: 'AI ಟ್ಯೂಟರ್ ಕೇಳಿ',
    cardTutorDesc: 'ಕನ್ನಡ, English ಅಥವಾ हिन्दी ಯಲ್ಲಿ ಧ್ವನಿ ಸಹಾಯ ಪಡೆಯಿರಿ.',
    cardTutorCta: 'ನೋವಾ ಕೇಳಿ',
    continueLearningTitle: 'ಕಲಿಕೆ ಮುಂದುವರಿಸಿ',
    viewAllLink: 'ಎಲ್ಲಾ ಪ್ರಯೋಗಗಳು',
    continueBtn: 'ಮುಂದುವರಿಸಿ',
    revisitBtn: 'ಮತ್ತೆ ತೆರೆಯಿರಿ',
    startFirstLabBtn: 'ಮೊದಲ ಲ್ಯಾಬ್ ಪ್ರಾರಂಭಿಸಿ',
    emptyContinueTitle: 'ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಯೋಗ ಪ್ರಾರಂಭಿಸಿಲ್ಲ',
    emptyContinueDesc:
      'ನಿಮ್ಮ ಕಲಿಕೆಯ ಪ್ರಗತಿಯನ್ನು ದಾಖಲಿಸಲು ಮೊದಲ NCERT ಪ್ರಯೋಗವನ್ನು ಪ್ರಾರಂಭಿಸಿ.',
    inProgressLabel: 'ಕೊನೆಯದಾಗಿ ತೆರೆದಿದ್ದು',
    yourProgressTitle: 'ನಿಮ್ಮ ಪ್ರಗತಿ',
    achievementsLink: 'ಎಲ್ಲಾ ಬ್ಯಾಡ್ಜ್‌ಗಳು',
    completedLabel: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    streakLabel: 'ಸತತ ದಿನಗಳು',
    daysUnit: 'ದಿನ',
    milestoneHeading: 'ಮುಂದಿನ ಗುರಿ',
    badgesHeading: 'ಸಾಧನೆ ಬ್ಯಾಡ್ಜ್‌ಗಳು',
    dailyChallengeHeading: 'ದೈನಂದಿನ ಭೌತಶಾಸ್ತ್ರ ಸವಾಲು',
    dailyChallengeBadge: 'ತ್ವರಿತ ಪರೀಕ್ಷೆ · +20 XP',
    tryInLabBtn: 'ಲ್ಯಾಬ್‌ನಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ',
    nextPracticeBtn: 'ಇನ್ನೊಂದು ಪ್ರಶ್ನೆ',
    correctChallengeLabel: 'ಸರಿ ಉತ್ತರ!',
    incorrectChallengeLabel: 'ಸರಿ ಉತ್ತರ ನೋಡಿ:',
    listenLabel: 'ಕೇಳಿ',
    stopListenLabel: 'ನಿಲ್ಲಿಸಿ',
  },
  hi: {
    letsLearnBtn: 'आइए सीखें',
    exploreExperimentsBtn: 'प्रयोग देखें',
    welcomeGuest: 'PHYSIX AI में आपका स्वागत है',
    welcomeNamedPrefix: 'वापसी पर स्वागत है,',
    novaLabel: 'नोवा · आपकी भौतिकी साथी',
    novaTapHint: 'नोवा से मिलें',
    novaWaveBtn: 'हाय कहें व टिप',
    novaTips: [
      'इंटरैक्टिव 2D और 3D प्रयोग चलाएँ, पाठ्यपुस्तक का पृष्ठ स्कैन करें या आज की दैनिक चुनौती हल करें!',
      'टिप: किसी भी लैब में उपकरण के हिस्से पर टैप करें और देखें कि हर चर कैसे बदलता है।',
      'प्रयोग पूरा करें और अवलोकन दर्ज करके XP व नए विज्ञान बैज अर्जित करें!',
    ],
    novaCompletedGreeting: 'शाबाश! आपने अपना भौतिकी प्रयोग सफलतापूर्वक पूरा किया। अगले प्रयोग के लिए तैयार हैं?',
    cardLearnTitle: 'अवधारणाएँ सीखें',
    cardLearnDesc: 'NCERT अध्याय, सरल व्याख्या और समीकरण समझें।',
    cardLearnCta: 'अवधारणाएँ खोलें',
    cardRunTitle: 'प्रयोग चलाएँ',
    cardRunDesc: 'इंटरैक्टिव 2D और 3D भौतिकी सिमुलेशन खोलें।',
    cardRunCta: 'प्रयोगशाला देखें',
    cardScanTitle: 'पाठ्यपुस्तक स्कैन करें',
    cardScanDesc: 'किसी भी पृष्ठ की फोटो से इंटरैक्टिव लैब बनाएँ।',
    cardScanCta: 'पृष्ठ अपलोड करें',
    cardTutorTitle: 'AI ट्यूटर से पूछें',
    cardTutorDesc: 'हिन्दी, English या ಕನ್ನಡ में आवाज़ और टेक्स्ट मदद पाएँ।',
    cardTutorCta: 'नोवा से पूछें',
    continueLearningTitle: 'सीखना जारी रखें',
    viewAllLink: 'सभी प्रयोग',
    continueBtn: 'जारी रखें',
    revisitBtn: 'फिर खोलें',
    startFirstLabBtn: 'पहली लैब शुरू करें',
    emptyContinueTitle: 'अभी कोई प्रयोग शुरू नहीं हुआ है',
    emptyContinueDesc:
      'अपनी वास्तविक प्रगति शुरू करने के लिए नीचे से अपना पहला NCERT इंटरैक्टिव प्रयोग खोलें।',
    inProgressLabel: 'अंतिम बार खोला गया',
    yourProgressTitle: 'आपकी प्रगति',
    achievementsLink: 'सभी बैज',
    completedLabel: 'पूर्ण',
    streakLabel: 'स्ट्रीक',
    daysUnit: 'दिन',
    milestoneHeading: 'अगला लक्ष्य',
    badgesHeading: 'उपलब्धि बैज',
    dailyChallengeHeading: 'दैनिक भौतिकी चुनौती',
    dailyChallengeBadge: 'त्वरित प्रश्न · +20 XP',
    tryInLabBtn: 'इंटरैक्टिव लैब में जांचें',
    nextPracticeBtn: 'अगला अभ्यास प्रश्न',
    correctChallengeLabel: 'सही उत्तर!',
    incorrectChallengeLabel: 'सही अवधारणा समझें:',
    listenLabel: 'सुनें',
    stopListenLabel: 'रोकें',
  },
};

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
  sessionsCount = 0,
  savedDynamicCount = 0,
  lastAccessedExperiment = null,
  recentCompletedExperimentId = null,
  onDismissRecentCompletion,
  onSolveDailyChallenge,
  onDismissBadgeToast,
  onAskNovaFromDashboard,
  onOpenPortalAuth,
  onOpenActivePortal,
  onOpenAchievements,
  onOpenExperimentsLibrary,
  onSelectClass,
  onAnalysisComplete,
  onOpenLab,
  onLaunchExperiment,
  onSaveProgress,
  onOpenSampleConcepts,
}) => {
  const accountScopeId = userProfile?.uid ?? 'guest';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveResetTimerRef = useRef<number | null>(null);
  const [thumbError, setThumbError] = useState(false);
  const [modalExperiment, setModalExperiment] = useState<ExperimentCatalogItem | null>(null);
  const [chooserChapter, setChooserChapter] = useState<{
    chapter: NcertChapterMeta;
    experiments: ExperimentCatalogItem[];
  } | null>(null);

  // Interactive Nova companion state in the hero banner
  const [novaPointTarget, setNovaPointTarget] = useState<CompanionPointTarget>('wave');
  const [novaReactionEmotion, setNovaReactionEmotion] = useState<CompanionEmotion | null>(null);
  const [novaTipIndex, setNovaTipIndex] = useState<number>(-1);
  const [milestoneBannerText, setMilestoneBannerText] = useState<string | null>(null);

  // Daily Physics Challenge state
  const [practiceOffset, setPracticeOffset] = useState(0);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<number | null>(null);
  const [dailySolvedToday, setDailySolvedToday] = useState<boolean>(false);

  const audioCtrlRef = useRef<TutorAudioController | null>(null);
  const [audioSnap, setAudioSnap] = useState<TutorAudioSnapshot>({
    status: 'idle',
    messageId: null,
    provider: null,
    errorNote: null,
    amplitude: 0,
  });

  useEffect(() => {
    const ctrl = new TutorAudioController((snap) => setAudioSnap(snap));
    audioCtrlRef.current = ctrl;
    return () => {
      ctrl.dispose();
      audioCtrlRef.current = null;
      if (waveResetTimerRef.current) {
        window.clearTimeout(waveResetTimerRef.current);
      }
    };
  }, []);

  const copy = DASHBOARD_UI_COPY[language];
  const effectiveRewardState = rewardState ?? loadRewardState(accountScopeId);
  const { currentRank, nextRank, progressPercent: rankProgressPct } = getRankForXp(
    effectiveRewardState.xp
  );

  // Restore today's solved Daily Physics Challenge attempt for this account
  const { challenge: activeChallenge } = useMemo(
    () => getDailyChallengeForClass(selectedClass, practiceOffset),
    [selectedClass, practiceOffset]
  );

  useEffect(() => {
    setPracticeOffset(0);
  }, [accountScopeId, selectedClass]);

  useEffect(() => {
    const stored = loadTodayChallengeAttempt(accountScopeId);
    setDailySolvedToday(Boolean(stored?.isCorrect));
    if (stored && practiceOffset === 0 && stored.challengeId === activeChallenge.id) {
      setSelectedChallengeOption(stored.selectedIndex);
    } else {
      setSelectedChallengeOption(null);
    }
  }, [accountScopeId, activeChallenge.id, practiceOffset]);

  // Brief initial friendly wave when dashboard loads (skipped if reducedMotion)
  useEffect(() => {
    if (reducedMotion) {
      setNovaPointTarget('none');
      return;
    }
    setNovaPointTarget('wave');
    const id = window.setTimeout(() => {
      setNovaPointTarget('none');
    }, 2400);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  // React warmly when returning from a newly completed experiment or unlocked badge
  useEffect(() => {
    if (recentCompletedExperimentId) {
      const exp = EXPERIMENT_CATALOGUE.find((e) => e.id === recentCompletedExperimentId);
      setNovaReactionEmotion('celebrating');
      setNovaPointTarget(reducedMotion ? 'none' : 'wave');
      setMilestoneBannerText(
        exp ? `${copy.novaCompletedGreeting} (${exp.title})` : copy.novaCompletedGreeting
      );
      const timer = window.setTimeout(() => {
        setNovaReactionEmotion(null);
        setNovaPointTarget('none');
      }, 4500);
      return () => window.clearTimeout(timer);
    }
  }, [recentCompletedExperimentId, reducedMotion, copy.novaCompletedGreeting]);

  const [companionMessage, setCompanionMessage] = useState<CompanionMessageState>(() =>
    buildLocalCompanionMessage({
      eventType: userProfile ? 'returning_user' : 'dashboard_welcome',
      language,
      studentName: userProfile?.name,
      studentClass: selectedClass,
    })
  );

  useEffect(() => {
    const eventType = recentCompletedExperimentId
      ? 'experiment_completed'
      : userProfile
        ? 'returning_user'
        : 'dashboard_welcome';
    setCompanionMessage(
      buildLocalCompanionMessage({
        eventType,
        language,
        studentName: userProfile?.name,
        studentClass: selectedClass,
      })
    );
    setNovaTipIndex(-1);

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
  }, [
    language,
    selectedClass,
    userProfile?.uid,
    userProfile?.name,
    geminiConfigured,
    recentCompletedExperimentId,
  ]);

  const classExperiments = useMemo(
    () => EXPERIMENT_CATALOGUE.filter((e) => e.classLevel === selectedClass),
    [selectedClass]
  );

  const completedInClass = useMemo(
    () => classExperiments.filter((e) => Boolean(studentProgress[e.id])).length,
    [classExperiments, studentProgress]
  );

  const classProgressPct =
    classExperiments.length > 0
      ? Math.round((completedInClass / classExperiments.length) * 100)
      : 0;

  const totalCompletedOverall = Object.keys(studentProgress).length;

  // Genuine Continue Learning resolution: exact last-accessed experiment, else latest completed in class
  const continueEntry = useMemo(() => {
    if (lastAccessedExperiment) {
      const exactLast = EXPERIMENT_CATALOGUE.find(
        (e) => e.id === lastAccessedExperiment.experimentId
      );
      if (exactLast && (!lockedClass || exactLast.classLevel === lockedClass)) {
        return {
          experiment: exactLast,
          accessedAt: lastAccessedExperiment.accessedAt,
          mode: lastAccessedExperiment.mode,
        };
      }
    }

    const completedList = classExperiments
      .filter((e) => Boolean(studentProgress[e.id]))
      .sort((a, b) => {
        const ta = Date.parse(studentProgress[a.id]?.completedAt || '') || 0;
        const tb = Date.parse(studentProgress[b.id]?.completedAt || '') || 0;
        return tb - ta;
      });

    if (completedList.length > 0) {
      return {
        experiment: completedList[0],
        accessedAt: studentProgress[completedList[0].id]?.completedAt ?? null,
        mode: '2d' as SimulationMode,
      };
    }

    return null;
  }, [lastAccessedExperiment, lockedClass, classExperiments, studentProgress]);

  const firstRecommendedExperiment = useMemo(
    () => classExperiments.find((e) => isExperimentLaunchable(e)) ?? classExperiments[0] ?? null,
    [classExperiments]
  );

  const continueExperiment = continueEntry?.experiment ?? null;

  useEffect(() => {
    setThumbError(false);
  }, [continueExperiment?.id]);

  const continueThumbnailUrl =
    continueExperiment?.simulationEngineId
      ? ENGINE_THUMBNAIL_MAP[continueExperiment.simulationEngineId]
      : heroMagnetismImg;

  const continueCompletion = continueExperiment
    ? studentProgress[continueExperiment.id]
    : undefined;

  const continuePct = useMemo(() => {
    if (!continueExperiment) return 0;
    if (continueCompletion) return 100;
    return 25; // Accessed in lab, ready to complete observations/quiz
  }, [continueExperiment, continueCompletion]);

  const handleBringToLife = () => {
    const uploadSection = document.getElementById('textbook-upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 250);
  };

  const handleLetsLearn = () => {
    const target = continueExperiment ?? firstRecommendedExperiment;
    if (target && isExperimentLaunchable(target)) {
      onLaunchExperiment(target, continueEntry?.mode ?? '2d');
      return;
    }
    onOpenLab();
  };

  const handleInteractWithNova = () => {
    if (waveResetTimerRef.current) {
      window.clearTimeout(waveResetTimerRef.current);
    }
    setNovaTipIndex((prev) => (prev + 1) % copy.novaTips.length);
    setNovaReactionEmotion('excited');
    setNovaPointTarget(reducedMotion ? 'none' : 'wave');
    waveResetTimerRef.current = window.setTimeout(() => {
      setNovaPointTarget('none');
      setNovaReactionEmotion(null);
    }, 2600);
  };

  const activeSpeechText =
    novaTipIndex >= 0
      ? copy.novaTips[novaTipIndex]
      : recentCompletedExperimentId && milestoneBannerText
        ? milestoneBannerText
        : companionMessage.text;

  const handleToggleHeroVoice = async () => {
    if (audioSnap.status === 'playing') {
      audioCtrlRef.current?.stop();
      return;
    }
    audioCtrlRef.current?.unlock();
    await audioCtrlRef.current?.playMessage(
      `hero_${companionMessage.id}_${novaTipIndex}`,
      activeSpeechText,
      language
    );
  };

  const handleAnswerDailyChallenge = (optionIndex: number) => {
    setSelectedChallengeOption(optionIndex);
    const isCorrect = optionIndex === activeChallenge.correctIndex;
    const todayIso = getTodayIsoLocal();

    if (practiceOffset === 0) {
      saveTodayChallengeAttempt(accountScopeId, {
        dateIso: todayIso,
        challengeId: activeChallenge.id,
        selectedIndex: optionIndex,
        isCorrect,
      });
    }

    if (isCorrect) {
      setNovaReactionEmotion('celebrating');
      setNovaPointTarget(reducedMotion ? 'none' : 'wave');
      if (waveResetTimerRef.current) window.clearTimeout(waveResetTimerRef.current);
      waveResetTimerRef.current = window.setTimeout(() => {
        setNovaReactionEmotion(null);
        setNovaPointTarget('none');
      }, 2800);

      if (!dailySolvedToday && practiceOffset === 0) {
        setDailySolvedToday(true);
        onSolveDailyChallenge?.(todayIso);
      }
    } else {
      setNovaReactionEmotion('encouraging');
      if (waveResetTimerRef.current) window.clearTimeout(waveResetTimerRef.current);
      waveResetTimerRef.current = window.setTimeout(() => {
        setNovaReactionEmotion(null);
      }, 2200);
    }
  };

  const handleLaunchChallengeExperiment = () => {
    const targetExp =
      EXPERIMENT_CATALOGUE.find((e) => e.id === activeChallenge.experimentId) ??
      firstRecommendedExperiment;
    if (targetExp && isExperimentLaunchable(targetExp)) {
      onLaunchExperiment(targetExp, '2d');
      return;
    }
    onOpenLab();
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

  const isHeroSpeaking = audioSnap.status === 'playing';
  const heroEmotion: CompanionEmotion = isHeroSpeaking
    ? 'speaking'
    : novaReactionEmotion ?? (latestBadgeToast ? 'celebrating' : companionMessage.emotion);

  // Progress Ring SVG math (radius = 36, circumference = 2 * pi * 36)
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeOffset =
    ringCircumference - (classProgressPct / 100) * ringCircumference;

  const featuredBadges = useMemo(() => {
    const unlocked = BADGE_CATALOG.filter((b) =>
      effectiveRewardState.unlockedBadgeIds.includes(b.id)
    );
    const locked = BADGE_CATALOG.filter(
      (b) => !effectiveRewardState.unlockedBadgeIds.includes(b.id)
    );
    return [...unlocked, ...locked].slice(0, 4);
  }, [effectiveRewardState.unlockedBadgeIds]);

  const hasMilestoneCelebration = Boolean(
    latestBadgeToast || recentCompletedExperimentId || (dailySolvedToday && selectedChallengeOption === activeChallenge.correctIndex)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7">
      {/* Real Milestone / Badge Celebration Banner */}
      {(latestBadgeToast || (recentCompletedExperimentId && milestoneBannerText)) && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          className="rounded-2xl bg-[#E6E0F0]/80 border border-[#6F4E37]/35 px-4 py-3 flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#302820]">
            <Award className="w-4 h-4 text-[#6F4E37] shrink-0" />
            <span>
              {latestBadgeToast ? (
                <>
                  <strong className="text-[#6F4E37]">{latestBadgeToast.title[language]}</strong>
                  <span aria-hidden="true"> · </span>
                  <span className="text-[#756B63]">
                    {latestBadgeToast.description[language]}
                  </span>
                </>
              ) : (
                <strong className="text-[#302820]">{milestoneBannerText}</strong>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onDismissBadgeToast?.();
              onDismissRecentCompletion?.();
              setMilestoneBannerText(null);
            }}
            className="text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer shrink-0 min-h-[44px] px-2.5 inline-flex items-center"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* 1. Welcome Hero Banner with Integrated Interactive Nova & Conversational Speech Bubble */}
      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Welcome banner"
        className="relative overflow-hidden rounded-2xl border border-[#D8D1CA]/90 bg-gradient-to-br from-white/80 via-[#F7F5F2]/72 to-[#E6E0F0]/68 shadow-[0_4px_24px_rgba(48,40,32,0.05)] p-5 sm:p-7 lg:p-8"
      >
        {/* Subtle Hero Atmospheric Physics Curves & Orbital Geometry */}
        <svg
          aria-hidden="true"
          viewBox="0 0 900 320"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.16]"
          fill="none"
        >
          <g transform="translate(740, 145)">
            <ellipse
              cx="0"
              cy="0"
              rx="145"
              ry="48"
              transform="rotate(-22)"
              stroke="#6F4E37"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="145"
              ry="48"
              transform="rotate(32)"
              stroke="#8B739E"
              strokeWidth="1.2"
            />
            <circle cx="0" cy="0" r="96" stroke="#6F4E37" strokeWidth="0.9" opacity="0.55" />
          </g>
          <path
            d="M -20 278 Q 120 245, 260 278 T 540 278 T 920 278"
            stroke="#6F4E37"
            strokeWidth="1.3"
            opacity="0.45"
          />
          <path
            d="M -20 292 Q 120 318, 260 292 T 540 292 T 920 292"
            stroke="#8B739E"
            strokeWidth="1.1"
            opacity="0.45"
          />
        </svg>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-center">
          {/* Left 6: Greeting & Primary Let's Learn Actions */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F4E37]">
              <span>
                {t.classLibrary.classPrefix} {selectedClass} · NCERT Physics
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#756B63]">{copy.novaLabel}</span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#302820] tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {userProfile
                ? `${copy.welcomeNamedPrefix} ${userProfile.name}!`
                : copy.welcomeGuest}
            </h1>

            <p className="text-sm sm:text-base text-[#756B63] leading-relaxed max-w-xl">
              {t.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-testid="hero-lets-learn-btn"
                onClick={handleLetsLearn}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6F4E37] text-white text-sm font-semibold hover:bg-[#5C402C] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap shadow-xs focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2"
              >
                <span>{copy.letsLearnBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenExperimentsLibrary
                    ? onOpenExperimentsLibrary()
                    : onSelectClass(selectedClass)
                }
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-[#E6E0F0] text-[#302820] text-sm font-semibold hover:bg-[#DCD3EA] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2"
              >
                <Compass className="w-4 h-4 text-[#6F4E37]" />
                <span>{copy.exploreExperimentsBtn}</span>
              </button>
            </div>
          </div>

          {/* Right 6: Integrated Prominent Animated Nova + Conversational Speech Bubble */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row items-center lg:justify-end gap-4 sm:gap-5">
            {/* Conversational Speech Bubble */}
            <div className="relative flex-1 w-full bg-white/86 rounded-2xl border border-[#D8D1CA]/90 p-4 shadow-xs space-y-3">
              {/* Speech Bubble Pointer (Desktop/Tablet right tail toward Nova) */}
              <span
                aria-hidden="true"
                className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-3.5 rotate-45 bg-white border-t border-r border-[#D8D1CA]"
              />
              {/* Mobile downward tail */}
              <span
                aria-hidden="true"
                className="sm:hidden absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-white border-r border-b border-[#D8D1CA]"
              />

              <p
                data-testid="nova-speech-bubble-text"
                className="text-xs sm:text-sm text-[#302820] leading-relaxed"
              >
                {activeSpeechText}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  data-testid="nova-wave-tip-btn"
                  onClick={handleInteractWithNova}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E6E0F0]/75 text-[#302820] text-xs font-semibold hover:bg-[#DCD3EA] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <span>{copy.novaWaveBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleToggleHeroVoice()}
                  aria-label={isHeroSpeaking ? copy.stopListenLabel : copy.listenLabel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs font-semibold text-[#302820] hover:border-[#6F4E37] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap"
                >
                  {isHeroSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#6F4E37]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#6F4E37]" />
                  )}
                  <span>{isHeroSpeaking ? copy.stopListenLabel : copy.listenLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAskNovaFromDashboard
                      ? onAskNovaFromDashboard(companionMessage.quickPrompt)
                      : onOpenLab()
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer min-h-[44px] px-2 whitespace-nowrap"
                >
                  <span>{copy.cardTutorTitle} &rarr;</span>
                </button>
              </div>
            </div>

            {/* Integrated Interactive Nova Character (No isolated card border) */}
            <button
              type="button"
              data-testid="nova-companion-trigger"
              onClick={handleInteractWithNova}
              aria-label="Interact with Nova AI companion"
              className="group relative shrink-0 flex flex-col items-center gap-1.5 p-1 rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-4 active:scale-95 transition-transform duration-150"
            >
              <div className="relative flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[#E6E0F0]/75 scale-105 group-hover:scale-110 transition-transform duration-200"
                />
                <PhysixCompanionAvatar
                  emotion={heroEmotion}
                  pointTarget={novaPointTarget}
                  amplitude={audioSnap.amplitude ?? 0}
                  size={120}
                  reducedMotion={reducedMotion}
                  className="relative z-10"
                />
              </div>
              <span className="text-[11px] font-semibold text-[#6F4E37] group-hover:text-[#302820] transition-colors whitespace-nowrap">
                {copy.novaTapHint}
              </span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* 2. Four Interactive Learning Action Cards */}
      <section aria-label="Quick actions" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Learn Concepts */}
        <button
          type="button"
          data-testid="action-card-learn"
          onClick={onOpenSampleConcepts}
          className="group text-left bg-white/76 hover:bg-white/88 rounded-2xl border border-[#D8D1CA]/90 p-5 shadow-[0_4px_20px_rgba(48,40,32,0.04)] hover:-translate-y-0.5 hover:shadow-md hover:border-[#6F4E37] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 min-h-[172px] focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E6E0F0] text-[#6F4E37] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
            {/* Open NCERT Book + Physics Wave SVG Illustration */}
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path
                d="M4 7.5C4 6.4 4.9 5.5 6 5.5H12.5C13.3 5.5 14 6.2 14 7V21.5C14 20.7 13.3 20 12.5 20H6C4.9 20 4 19.1 4 18V7.5Z"
                fill="#FFFFFF"
                stroke="#6F4E37"
                strokeWidth="1.7"
              />
              <path
                d="M24 7.5C24 6.4 23.1 5.5 22 5.5H15.5C14.7 5.5 14 6.2 14 7V21.5C14 20.7 14.7 20 15.5 20H22C23.1 20 24 19.1 24 18V7.5Z"
                fill="#F7F5F2"
                stroke="#6F4E37"
                strokeWidth="1.7"
              />
              <path
                d="M7 12C8 10 9.5 10 10.5 12C11.5 14 12.2 14 12.7 12"
                stroke="#302820"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line x1="16.5" y1="10.5" x2="21.5" y2="10.5" stroke="#6F4E37" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16.5" y1="14" x2="20.5" y2="14" stroke="#6F4E37" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[#302820]">{copy.cardLearnTitle}</h2>
            <p className="text-xs text-[#756B63] leading-relaxed">{copy.cardLearnDesc}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37] pt-1">
            <span>{copy.cardLearnCta}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" />
          </div>
        </button>

        {/* Card 2: Run Experiments */}
        <button
          type="button"
          data-testid="action-card-experiments"
          onClick={() =>
            onOpenExperimentsLibrary
              ? onOpenExperimentsLibrary()
              : onSelectClass(selectedClass)
          }
          className="group text-left bg-white/76 hover:bg-white/88 rounded-2xl border border-[#D8D1CA]/90 p-5 shadow-[0_4px_20px_rgba(48,40,32,0.04)] hover:-translate-y-0.5 hover:shadow-md hover:border-[#6F4E37] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 min-h-[172px] focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E6E0F0] text-[#6F4E37] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
            {/* Flask + Atom Orbit SVG Illustration */}
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path
                d="M11 4.5H17M12 4.5V10L6.8 19.6C6.2 20.8 7 22.3 8.4 22.3H19.6C21 22.3 21.8 20.8 21.2 19.6L16 10V4.5"
                fill="#FFFFFF"
                stroke="#6F4E37"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8.8 17.2H19.2L20.6 19.8C20.9 20.4 20.4 21.2 19.6 21.2H8.4C7.6 21.2 7.1 20.4 7.4 19.8L8.8 17.2Z" fill="#E6E0F0" />
              <circle cx="12.5" cy="14.5" r="1.1" fill="#302820" />
              <circle cx="15.8" cy="19" r="1.1" fill="#6F4E37" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[#302820]">{copy.cardRunTitle}</h2>
            <p className="text-xs text-[#756B63] leading-relaxed">{copy.cardRunDesc}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37] pt-1">
            <span>{copy.cardRunCta}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" />
          </div>
        </button>

        {/* Card 3: Scan Textbook */}
        <button
          type="button"
          data-testid="action-card-scan"
          onClick={handleBringToLife}
          className="group text-left bg-white/76 hover:bg-white/88 rounded-2xl border border-[#D8D1CA]/90 p-5 shadow-[0_4px_20px_rgba(48,40,32,0.04)] hover:-translate-y-0.5 hover:shadow-md hover:border-[#6F4E37] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 min-h-[172px] focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E6E0F0] text-[#6F4E37] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
            {/* Textbook Page + Scanner Corners SVG Illustration */}
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M4.5 9V6.5C4.5 5.4 5.4 4.5 6.5 4.5H9" stroke="#6F4E37" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M19 4.5H21.5C22.6 4.5 23.5 5.4 23.5 6.5V9" stroke="#6F4E37" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M4.5 19V21.5C4.5 22.6 5.4 23.5 6.5 23.5H9" stroke="#6F4E37" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M19 23.5H21.5C22.6 23.5 23.5 22.6 23.5 21.5V19" stroke="#6F4E37" strokeWidth="1.7" strokeLinecap="round" />
              <rect x="8.5" y="7.5" width="11" height="13" rx="1.5" fill="#FFFFFF" stroke="#302820" strokeWidth="1.4" />
              <line x1="6" y1="14" x2="22" y2="14" stroke="#6F4E37" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[#302820]">{copy.cardScanTitle}</h2>
            <p className="text-xs text-[#756B63] leading-relaxed">{copy.cardScanDesc}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37] pt-1">
            <span>{copy.cardScanCta}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" />
          </div>
        </button>

        {/* Card 4: Ask AI Tutor */}
        <button
          type="button"
          data-testid="action-card-tutor"
          onClick={() =>
            onAskNovaFromDashboard ? onAskNovaFromDashboard() : onOpenLab()
          }
          className="group text-left bg-white/76 hover:bg-white/88 rounded-2xl border border-[#D8D1CA]/90 p-5 shadow-[0_4px_20px_rgba(48,40,32,0.04)] hover:-translate-y-0.5 hover:shadow-md hover:border-[#6F4E37] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 min-h-[172px] focus-visible:outline-2 focus-visible:outline-[#6F4E37] focus-visible:outline-offset-2"
        >
          <div className="w-12 h-12 rounded-xl bg-[#E6E0F0] text-[#6F4E37] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
            {/* Voice Waveform + Speech Bubble SVG Illustration */}
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path
                d="M5 7.5C5 6.1 6.1 5 7.5 5H20.5C21.9 5 23 6.1 23 7.5V16.5C23 17.9 21.9 19 20.5 19H12L7.5 22.5V19H7.5C6.1 19 5 17.9 5 16.5V7.5Z"
                fill="#FFFFFF"
                stroke="#6F4E37"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <line x1="9.5" y1="12" x2="9.5" y2="12.5" stroke="#302820" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12.5" y1="9.5" x2="12.5" y2="14.5" stroke="#6F4E37" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="15.5" y1="10.5" x2="15.5" y2="13.5" stroke="#302820" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="18.5" y1="11.5" x2="18.5" y2="12.5" stroke="#6F4E37" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-[#302820]">{copy.cardTutorTitle}</h2>
            <p className="text-xs text-[#756B63] leading-relaxed">{copy.cardTutorDesc}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37] pt-1">
            <span>{copy.cardTutorCta}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" />
          </div>
        </button>
      </section>

      {/* 3. Continue Learning + Visual Progress Ring Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Continue Learning */}
        <div
          data-testid="continue-learning-card"
          className="lg:col-span-7 bg-white/76 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-5 sm:p-6 flex flex-col justify-between space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#302820]">{copy.continueLearningTitle}</h2>
            <button
              type="button"
              onClick={() =>
                onOpenExperimentsLibrary
                  ? onOpenExperimentsLibrary()
                  : onSelectClass(selectedClass)
              }
              className="text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer whitespace-nowrap min-h-[44px] inline-flex items-center"
            >
              {copy.viewAllLink} &rarr;
            </button>
          </div>

          {continueExperiment ? (
            <div className="group rounded-xl border border-[#D8D1CA]/90 bg-[#F7F5F2]/65 p-4 hover:border-[#6F4E37]/60 transition-colors flex flex-col sm:flex-row gap-5 items-stretch">
              <button
                type="button"
                onClick={() =>
                  isExperimentLaunchable(continueExperiment)
                    ? onLaunchExperiment(continueExperiment, continueEntry?.mode ?? '2d')
                    : setModalExperiment(continueExperiment)
                }
                aria-label={`Open ${continueExperiment.title}`}
                className="sm:w-44 h-36 sm:h-auto rounded-xl border border-[#D8D1CA] bg-[#E5E4E2]/60 overflow-hidden shrink-0 cursor-pointer relative block"
              >
                {!thumbError ? (
                  <img
                    src={continueThumbnailUrl}
                    alt={continueExperiment.title}
                    referrerPolicy="no-referrer"
                    onError={() => setThumbError(true)}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-[#F7F5F2]">
                    <FlaskConical className="w-8 h-8 text-[#6F4E37]" />
                  </div>
                )}
              </button>

              <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                    <span>
                      {t.classLibrary.classPrefix} {continueExperiment.classLevel} · Ch.{' '}
                      {continueExperiment.chapterNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    {continueCompletion ? (
                      <span className="inline-flex items-center gap-1 text-[#302820]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>
                          {t.experimentLab.completedBadge}
                          {typeof continueCompletion.quizScore === 'number' &&
                          typeof continueCompletion.quizTotal === 'number'
                            ? ` (${continueCompletion.quizScore}/${continueCompletion.quizTotal})`
                            : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[#756B63]">
                        {copy.inProgressLabel}{' '}
                        {continueEntry?.accessedAt
                          ? new Date(continueEntry.accessedAt).toLocaleDateString()
                          : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-[#302820] leading-snug">
                    {continueExperiment.title}
                  </h3>
                  <p className="text-xs text-[#756B63] line-clamp-2 leading-relaxed">
                    {continueExperiment.learningObjective}
                  </p>
                </div>

                {/* Genuine completion meter for this experiment */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#756B63]">
                    <span>
                      {continueCompletion ? t.experimentLab.completedBadge : copy.inProgressLabel}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#6F4E37]">
                      {continuePct}%
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={copy.continueLearningTitle}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={continuePct}
                    className="w-full h-2 rounded-full bg-[#E5E4E2] overflow-hidden"
                  >
                    <div
                      className="h-full bg-[#6F4E37] transition-all duration-300"
                      style={{ width: `${continuePct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    data-testid="continue-learning-btn"
                    onClick={() =>
                      isExperimentLaunchable(continueExperiment)
                        ? onLaunchExperiment(continueExperiment, continueEntry?.mode ?? '2d')
                        : setModalExperiment(continueExperiment)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{continueCompletion ? copy.revisitBtn : copy.continueBtn}</span>
                  </button>

                  {continueExperiment.availabilityStatus === 'interactive_2d_3d' && (
                    <button
                      type="button"
                      onClick={() => onLaunchExperiment(continueExperiment, '3d')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#E6E0F0] text-[#302820] text-xs sm:text-sm font-semibold hover:bg-[#DCD3EA] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap"
                    >
                      <Compass className="w-4 h-4 text-[#6F4E37]" />
                      <span>3D</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Honest Empty State when the student hasn't started an experiment yet */
            <div
              data-testid="continue-learning-empty"
              className="rounded-xl border border-dashed border-[#D8D1CA] bg-[#F7F5F2]/65 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#E6E0F0] text-[#6F4E37] flex items-center justify-center shrink-0">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[#302820]">
                    {copy.emptyContinueTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#756B63] leading-relaxed max-w-md">
                    {copy.emptyContinueDesc}
                  </p>
                  {totalCompletedOverall > 0 && (
                    <p className="text-xs font-medium text-[#6F4E37]">
                      {totalCompletedOverall} experiment{totalCompletedOverall === 1 ? '' : 's'} completed in other classes.
                    </p>
                  )}
                </div>
              </div>
              {firstRecommendedExperiment && (
                <button
                  type="button"
                  data-testid="continue-empty-start-btn"
                  onClick={() =>
                    isExperimentLaunchable(firstRecommendedExperiment)
                      ? onLaunchExperiment(firstRecommendedExperiment, '2d')
                      : setModalExperiment(firstRecommendedExperiment)
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-[44px] whitespace-nowrap shrink-0"
                >
                  <Layers className="w-4 h-4" />
                  <span>{copy.startFirstLabBtn}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Your Progress: Progress Ring + Completed Count + Milestones + Badges */}
        <div
          data-testid="your-progress-card"
          className={`lg:col-span-5 bg-white/76 rounded-2xl border shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-colors ${
            hasMilestoneCelebration ? 'border-[#6F4E37]/60' : 'border-[#D8D1CA]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#302820]">{copy.yourProgressTitle}</h2>
            {onOpenAchievements && (
              <button
                type="button"
                onClick={onOpenAchievements}
                className="text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer whitespace-nowrap min-h-[44px] inline-flex items-center"
              >
                {copy.achievementsLink} &rarr;
              </button>
            )}
          </div>

          {/* Simple SVG Progress Ring + Completed Count & Streak */}
          <div className="flex items-center gap-5">
            <div className="relative w-[92px] h-[92px] shrink-0 flex items-center justify-center">
              <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90" aria-hidden="true">
                <circle
                  cx="46"
                  cy="46"
                  r={ringRadius}
                  fill="none"
                  stroke="#E5E4E2"
                  strokeWidth="9"
                />
                <circle
                  cx="46"
                  cy="46"
                  r={ringRadius}
                  fill="none"
                  stroke="#6F4E37"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringStrokeOffset}
                  style={{
                    transition: reducedMotion ? 'none' : 'stroke-dashoffset 450ms ease-out',
                  }}
                />
              </svg>
              <span
                data-testid="progress-ring-pct"
                className="absolute text-lg font-bold text-[#302820] font-mono-tabular"
              >
                {classProgressPct}%
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-xs text-[#756B63]">
                  {t.classLibrary.classPrefix} {selectedClass} · {copy.completedLabel}
                </p>
                <p className="text-base font-bold text-[#302820] font-mono-tabular">
                  {completedInClass} / {classExperiments.length}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#756B63]">
                <span className="inline-flex items-center gap-1 font-semibold text-[#302820] font-mono-tabular">
                  <Flame className="w-3.5 h-3.5 text-[#6F4E37]" />
                  {effectiveRewardState.streakDays} {copy.daysUnit}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular font-semibold text-[#6F4E37]">
                  {effectiveRewardState.xp} XP
                </span>
                {(sessionsCount > 0 || savedDynamicCount > 0) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {sessionsCount + savedDynamicCount} saved
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Learning Milestone Bar */}
          <div className="space-y-1.5 pt-1 border-t border-[#D8D1CA]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#302820]">
                {copy.milestoneHeading}: {currentRank.title[language]}
              </span>
              <span className="font-mono-tabular text-[#6F4E37] font-semibold">
                {nextRank
                  ? `${effectiveRewardState.xp}/${nextRank.minXp} XP`
                  : 'Max Rank'}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={copy.milestoneHeading}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rankProgressPct}
              className="w-full h-2 rounded-full bg-[#E5E4E2] overflow-hidden"
            >
              <div
                className="h-full bg-[#6F4E37] transition-all duration-300"
                style={{ width: `${rankProgressPct}%` }}
              />
            </div>
          </div>

          {/* Small Genuine Achievement Badges Strip */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#756B63]">{copy.badgesHeading}</p>
            <div className="grid grid-cols-2 gap-2">
              {featuredBadges.map((badge) => {
                const unlocked = effectiveRewardState.unlockedBadgeIds.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={onOpenAchievements}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer min-h-[44px] ${
                      unlocked
                        ? 'bg-[#E6E0F0]/75 border-[#6F4E37]/45 text-[#302820]'
                        : 'bg-[#F7F5F2] border-[#D8D1CA] text-[#756B63] hover:border-[#6F4E37]/40'
                    }`}
                  >
                    <Award
                      className={`w-3.5 h-3.5 shrink-0 ${
                        unlocked ? 'text-[#6F4E37]' : 'text-[#756B63]'
                      }`}
                    />
                    <span className="text-[11px] font-semibold truncate">
                      {badge.title[language]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Compact Daily Physics Challenge */}
      <section
        data-testid="daily-physics-challenge"
        aria-label="Daily Physics Challenge"
        className="bg-white/76 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F4E37]">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>{copy.dailyChallengeHeading}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#756B63]">{activeChallenge.topicLabel[language]}</span>
          </div>
          <span className="text-xs font-semibold text-[#6F4E37] font-mono-tabular">
            {dailySolvedToday && practiceOffset === 0
              ? 'Solved Today ✓'
              : copy.dailyChallengeBadge}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[#302820] leading-snug">
          {activeChallenge.question[language]}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeChallenge.options[language].map((opt, idx) => {
            const answered = selectedChallengeOption !== null;
            const isChosen = selectedChallengeOption === idx;
            const isRight = idx === activeChallenge.correctIndex;

            let btnStyle =
              'bg-[#F7F5F2] border-[#D8D1CA] text-[#302820] hover:border-[#6F4E37] hover:bg-[#E6E0F0]/45';
            if (answered && isRight) {
              btnStyle = 'bg-[#E6E0F0]/80 border-[#6F4E37] text-[#302820] font-semibold';
            } else if (answered && isChosen && !isRight) {
              btnStyle = 'bg-[#FDF2F0] border-[#B83A2D] text-[#7A271A]';
            }

            return (
              <button
                key={`${activeChallenge.id}_${idx}`}
                type="button"
                data-testid={`daily-challenge-option-${idx}`}
                onClick={() => handleAnswerDailyChallenge(idx)}
                className={`text-left px-4 py-3 rounded-xl border text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-start gap-2.5 min-h-[48px] active:scale-[0.99] ${btnStyle}`}
              >
                <span className="font-mono-tabular font-bold text-[#6F4E37] shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {selectedChallengeOption !== null && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            data-testid="daily-challenge-feedback"
            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              selectedChallengeOption === activeChallenge.correctIndex
                ? 'bg-[#E6E0F0]/60 border-[#6F4E37]/45 text-[#302820]'
                : 'bg-[#FDF2F0] border-[#E7B5AF] text-[#302820]'
            }`}
          >
            <div className="flex items-start gap-2.5 text-xs sm:text-sm">
              {selectedChallengeOption === activeChallenge.correctIndex ? (
                <CheckCircle2 className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-[#B83A2D] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {selectedChallengeOption === activeChallenge.correctIndex
                    ? copy.correctChallengeLabel
                    : copy.incorrectChallengeLabel}
                </p>
                <p className="text-xs text-[#302820]/90 leading-relaxed">
                  {activeChallenge.explanation[language]}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="daily-challenge-lab-btn"
                onClick={handleLaunchChallengeExperiment}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>{copy.tryInLabBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setPracticeOffset((n) => n + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8D1CA] bg-white text-xs font-semibold text-[#302820] hover:border-[#6F4E37] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span>{copy.nextPracticeBtn}</span>
              </button>
            </div>
          </motion.div>
        )}
      </section>

      {/* 5. Textbook Scanner & Account Portals */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <TextbookUploadCard
            language={language}
            t={t}
            geminiConfigured={geminiConfigured}
            onAnalysisComplete={onAnalysisComplete}
            fileInputRef={fileInputRef}
          />
        </div>

        <div className="lg:col-span-5 space-y-5">
          {userProfile ? (
            <div className="bg-white/76 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                {userProfile.role === 'teacher' ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <GraduationCap className="w-4 h-4" />
                )}
                <span>
                  {userProfile.role === 'teacher'
                    ? 'Teacher Portal Active'
                    : 'Student Portal Active'}
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#302820]">
                  {userProfile.name}
                  {userProfile.role === 'student' && userProfile.selectedClass
                    ? ` · Class ${userProfile.selectedClass}`
                    : ''}
                </h2>
                <p className="text-xs text-[#756B63]">
                  <span className="font-mono text-[#302820]">@{userProfile.username}</span>
                  <span aria-hidden="true"> · </span>
                  <span>Browser-Local Account (IndexedDB)</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenActivePortal}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#6F4E37] text-white text-sm font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[44px]"
              >
                <span>
                  {userProfile.role === 'teacher'
                    ? 'Open Teacher Portal'
                    : 'Open Student Portal'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/76 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Portal</span>
                </div>
                <h2 className="text-base font-bold text-[#302820]">
                  Save Your Class 6–10 Progress &amp; Join Classes
                </h2>
                <p className="text-xs text-[#756B63] leading-relaxed">
                  Create a local student account, join your teacher&apos;s classroom via code, and
                  sync experiment completions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenPortalAuth('student', 'login')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer min-h-[44px]"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPortalAuth('student', 'register')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E6E0F0] text-[#302820] text-xs font-semibold hover:bg-[#DCD3EA] cursor-pointer min-h-[44px]"
                  >
                    <span>Create Student Account</span>
                  </button>
                </div>
              </div>

              <div className="bg-white/76 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                  <Users className="w-4 h-4" />
                  <span>Teacher Portal</span>
                </div>
                <h2 className="text-base font-bold text-[#302820]">
                  Manage Physics Classrooms &amp; Student Progress
                </h2>
                <p className="text-xs text-[#756B63] leading-relaxed">
                  Create Class 6–10 sections, share join codes, and monitor quiz assessments.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenPortalAuth('teacher', 'login')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer min-h-[44px]"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPortalAuth('teacher', 'register')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E6E0F0] text-[#302820] text-xs font-semibold hover:bg-[#DCD3EA] cursor-pointer min-h-[44px]"
                  >
                    <span>Create Teacher Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Expandable NCERT Classroom Curriculum Explorer */}
      <ClassroomSelector
        selectedClass={selectedClass}
        lockedClass={lockedClass}
        studentProgress={studentProgress}
        t={t}
        onSelectClass={onSelectClass}
        onChapterAction={handleChapterAction}
        onLaunchExperiment={onLaunchExperiment}
      />

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
