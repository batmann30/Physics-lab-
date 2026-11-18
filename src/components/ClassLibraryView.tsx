import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Filter,
  FlaskConical,
  Lock,
  Search,
  Sparkles,
} from 'lucide-react';
import type {
  CurriculumTopicArea,
  EntryCategory,
  ExperimentCatalogItem,
  GradeClassLevel,
  NcertChapterMeta,
  SimulationAvailabilityStatus,
  SimulationMode,
  StudentProgressMap,
} from '../types/physics';
import type { DynamicExperimentSpec } from '../types/dynamicExperiment';
import type { TranslationBundle } from '../i18n/translations';
import {
  CLASS_LEVELS,
  EXPERIMENT_CATALOGUE,
  NCERT_CLASS_CURRICULA,
  TOPIC_AREA_LABELS,
} from '../data/ncertCurriculum';
import { isExperimentLaunchable } from '../data/simulationRegistry';
import { CurriculumCoveragePanel } from './CurriculumCoveragePanel';
import { ExperimentActivityModal } from './ExperimentActivityModal';
import { ConceptExperimentChooserModal } from './ConceptExperimentChooserModal';

interface ClassLibraryViewProps {
  selectedClass: GradeClassLevel;
  lockedClass?: GradeClassLevel;
  onSelectClass: (classLevel: GradeClassLevel) => void;
  studentProgress: StudentProgressMap;
  t: TranslationBundle;
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
  savedDynamicExperiments?: DynamicExperimentSpec[];
  onLaunchDynamicExperiment?: (spec: DynamicExperimentSpec) => void;
  onDeleteDynamicExperiment?: (id: string) => void;
}

export const ClassLibraryView: React.FC<ClassLibraryViewProps> = ({
  selectedClass,
  lockedClass,
  onSelectClass,
  studentProgress,
  t,
  onLaunchExperiment,
  onSaveProgress,
  savedDynamicExperiments = [],
  onLaunchDynamicExperiment,
  onDeleteDynamicExperiment,
}) => {
  const effectiveClass: GradeClassLevel = lockedClass ?? selectedClass;

  const [viewTab, setViewTab] = useState<'library' | 'coverage'>('library');
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [selectedTopicArea, setSelectedTopicArea] = useState<CurriculumTopicArea | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | 'all'>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedCompletion, setSelectedCompletion] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalExperiment, setModalExperiment] = useState<ExperimentCatalogItem | null>(null);
  const [chooserChapter, setChooserChapter] = useState<{
    chapter: NcertChapterMeta;
    experiments: ExperimentCatalogItem[];
  } | null>(null);

  const curriculum = NCERT_CLASS_CURRICULA[effectiveClass];

  // Strictly isolated class experiments (never mixing all classes together)
  const classExperiments = useMemo(
    () => EXPERIMENT_CATALOGUE.filter((item) => item.classLevel === effectiveClass),
    [effectiveClass]
  );

  const completedInClass = useMemo(
    () => classExperiments.filter((exp) => Boolean(studentProgress[exp.id])).length,
    [classExperiments, studentProgress]
  );

  const interactiveCount = useMemo(
    () => classExperiments.filter((exp) => isExperimentLaunchable(exp)).length,
    [classExperiments]
  );

  const handleClassSwitch = (nextClass: GradeClassLevel) => {
    if (lockedClass && nextClass !== lockedClass) return;
    onSelectClass(nextClass);
    setSelectedChapterId('all');
    setSelectedTopicArea('all');
    setSelectedCategory('all');
    setSelectedAvailability('all');
    setSelectedCompletion('all');
    setSearchQuery('');
    setShowClassroomPicker(false);
    setViewTab('library');
  };

  // Part 1: Direct Concept-to-Experiment navigation without extra filtering friction
  const handleChapterCardClick = (ch: NcertChapterMeta, chExps: ExperimentCatalogItem[]) => {
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

    setSelectedChapterId(ch.id);
  };

  const filteredExperiments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classExperiments.filter((exp) => {
      if (selectedChapterId !== 'all' && exp.chapterId !== selectedChapterId) return false;
      if (selectedTopicArea !== 'all' && exp.topicArea !== selectedTopicArea) return false;
      if (selectedCategory !== 'all' && exp.entryCategory !== selectedCategory) return false;

      if (selectedAvailability === 'interactive') {
        if (!isExperimentLaunchable(exp)) return false;
      } else if (
        selectedAvailability !== 'all' &&
        exp.availabilityStatus !== (selectedAvailability as SimulationAvailabilityStatus)
      ) {
        return false;
      }

      const isCompleted = Boolean(studentProgress[exp.id]);
      if (selectedCompletion === 'completed' && !isCompleted) return false;
      if (selectedCompletion === 'incomplete' && isCompleted) return false;

      if (q) {
        const haystack =
          `${exp.title} ${exp.chapterTitle} ${exp.relevantConcept} ${exp.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    classExperiments,
    selectedChapterId,
    selectedTopicArea,
    selectedCategory,
    selectedAvailability,
    selectedCompletion,
    searchQuery,
    studentProgress,
  ]);

  const progressPct =
    classExperiments.length > 0
      ? Math.round((completedInClass / classExperiments.length) * 100)
      : 0;

  const hasActiveFilters =
    selectedChapterId !== 'all' ||
    selectedTopicArea !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAvailability !== 'all' ||
    selectedCompletion !== 'all' ||
    searchQuery.trim().length > 0;

  const availabilityLabel = (status: SimulationAvailabilityStatus) => {
    switch (status) {
      case 'interactive_2d_3d':
        return t.classLibrary.statusInteractive2d3d;
      case 'interactive_2d':
        return t.classLibrary.statusInteractive2d;
      case 'interactive_3d':
        return t.classLibrary.statusInteractive3d;
      case 'explanation_only':
        return t.classLibrary.statusExplanationOnly;
      default:
        return t.classLibrary.statusComingSoon;
    }
  };

  const verificationLabel = (status: ExperimentCatalogItem['verificationStatus']) => {
    switch (status) {
      case 'verified_ncert':
        return t.classLibrary.verifiedNcertLabel;
      case 'supplementary_physix':
        return t.classLibrary.supplementaryLabel;
      default:
        return t.classLibrary.needsVerificationLabel;
    }
  };

  const categoryLabel = (cat: EntryCategory) => {
    switch (cat) {
      case 'ncert_practical':
        return t.classLibrary.catPractical;
      case 'ncert_activity':
        return t.classLibrary.catActivity;
      case 'ncert_concept':
        return t.classLibrary.catConcept;
      default:
        return t.classLibrary.catSupplementary;
    }
  };

  const topicAreasPresent = useMemo(() => {
    const set = new Set<CurriculumTopicArea>();
    classExperiments.forEach((e) => set.add(e.topicArea));
    return Array.from(set);
  }, [classExperiments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header + Redesigned Classroom Selector / Locked Grade Indicator */}
      <div className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-semibold text-[#6F4E37] tracking-wide uppercase">
              {curriculum.textbookSeries}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#302820]">
              {t.classLibrary.classPrefix} {effectiveClass} · {t.classLibrary.title}
            </h1>
            <p className="text-sm text-[#756B63]">{curriculum.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!lockedClass ? (
              <button
                type="button"
                onClick={() => setShowClassroomPicker((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs sm:text-sm font-semibold text-[#302820] hover:border-[#6F4E37] transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
              >
                <span>Switch Classroom (6–10)</span>
                {showClassroomPicker ? (
                  <ChevronUp className="w-4 h-4 text-[#6F4E37]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6F4E37]" />
                )}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F7F5F2] border border-[#D8D1CA] text-xs font-semibold text-[#6F4E37]">
                <Lock className="w-3.5 h-3.5" />
                <span>Registered Class {lockedClass}</span>
              </span>
            )}

            <div
              role="tablist"
              aria-label="Library view tabs"
              className="inline-flex items-center rounded-lg bg-[#E5E4E2]/70 p-1 border border-[#D8D1CA] shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === 'library'}
                onClick={() => setViewTab('library')}
                className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  viewTab === 'library'
                    ? 'bg-[#6F4E37] text-white'
                    : 'text-[#302820] hover:bg-white/70'
                }`}
              >
                {t.classLibrary.tabClassLibrary}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === 'coverage'}
                onClick={() => setViewTab('coverage')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  viewTab === 'coverage'
                    ? 'bg-[#6F4E37] text-white'
                    : 'text-[#302820] hover:bg-white/70'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.classLibrary.tabCoverageReport}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Vertical Classroom Cards (Only shown for non-locked users when toggled) */}
        {!lockedClass && showClassroomPicker && (
          <div className="pt-4 border-t border-[#D8D1CA] space-y-2.5">
            <p className="text-xs font-semibold text-[#756B63]">
              Choose Your Classroom · Select a grade to switch your active NCERT library
            </p>
            <div className="space-y-2">
              {CLASS_LEVELS.map((cls) => {
                const active = cls === effectiveClass && viewTab === 'library';
                const clsExps = EXPERIMENT_CATALOGUE.filter((i) => i.classLevel === cls);
                const clsDone = clsExps.filter((i) => Boolean(studentProgress[i.id])).length;
                const meta = NCERT_CLASS_CURRICULA[cls];
                return (
                  <button
                    key={cls}
                    type="button"
                    aria-pressed={cls === effectiveClass}
                    onClick={() => handleClassSwitch(cls)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      active
                        ? 'bg-[#6F4E37] border-[#6F4E37] text-white'
                        : 'bg-[#F7F5F2] border-[#D8D1CA] text-[#302820] hover:border-[#6F4E37]/60'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-bold">
                          {t.classLibrary.classPrefix} {cls}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            active ? 'text-[#E6E0F0]' : 'text-[#6F4E37]'
                          }`}
                        >
                          {meta.textbookSeries}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          active ? 'text-white/85' : 'text-[#756B63]'
                        }`}
                      >
                        {meta.description}
                      </p>
                    </div>
                    <div
                      className={`font-mono-tabular text-xs font-semibold shrink-0 ${
                        active ? 'text-[#E6E0F0]' : 'text-[#6F4E37]'
                      }`}
                    >
                      {meta.chapters.length} {t.classLibrary.statChaptersShort} · {clsDone}/
                      {clsExps.length} done
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {viewTab === 'coverage' ? (
        <CurriculumCoveragePanel
          t={t}
          lockedClass={lockedClass}
          onSelectClass={(cls) => handleClassSwitch(cls)}
        />
      ) : (
        <div className="space-y-8">
          {/* Class Progress & Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-8 grid grid-cols-3 gap-4">
              <div className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-4 sm:p-5">
                <p className="text-xs text-[#756B63]">{t.classLibrary.statChapters}</p>
                <p className="text-2xl font-bold text-[#302820] font-mono-tabular mt-1">
                  {curriculum.chapters.length}
                </p>
              </div>
              <div className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-4 sm:p-5">
                <p className="text-xs text-[#756B63]">{t.classLibrary.statInteractiveLabs}</p>
                <p className="text-2xl font-bold text-[#6F4E37] font-mono-tabular mt-1">
                  {interactiveCount} / {classExperiments.length}
                </p>
              </div>
              <div className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-4 sm:p-5">
                <p className="text-xs text-[#756B63]">{t.classLibrary.statCompleted}</p>
                <p className="text-2xl font-bold text-[#6F4E37] font-mono-tabular mt-1">
                  {completedInClass} / {classExperiments.length}
                </p>
              </div>
            </div>

            <div className="md:col-span-4 bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-4 sm:p-5 flex flex-col justify-center space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#302820]">
                <span>
                  {t.classLibrary.classPrefix} {effectiveClass} {t.classLibrary.progressLabel}
                </span>
                <span className="font-mono-tabular text-[#6F4E37]">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#E5E4E2] overflow-hidden">
                <div
                  className="h-full bg-[#6F4E37] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-[#756B63]">{curriculum.editionNote}</p>
            </div>
          </div>

          {/* Direct-Launch NCERT Concept Cards */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold text-[#302820]">
                  {t.classLibrary.chaptersHeading} ({t.classLibrary.classPrefix} {effectiveClass})
                </h2>
                <p className="text-xs text-[#756B63]">
                  Click any Physics concept below to open its Interactive Lab or activity guide directly.
                </p>
              </div>
              {selectedChapterId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedChapterId('all')}
                  className="text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer"
                >
                  {t.classLibrary.showAllChapters}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {curriculum.chapters.map((ch) => {
                const isSelected = selectedChapterId === ch.id;
                const chExps = classExperiments.filter((e) => e.chapterId === ch.id);
                const interactiveChExps = chExps.filter((e) => isExperimentLaunchable(e));
                const isSingleInteractive =
                  chExps.length === 1 && isExperimentLaunchable(chExps[0]);

                return (
                  <div
                    key={ch.id}
                    data-testid={`concept-card-${ch.id}`}
                    className={`rounded-xl border transition-colors flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#E6E0F0]/55 border-[#6F4E37] ring-1 ring-[#6F4E37]'
                        : 'bg-white/76 border-[#D8D1CA]/90 hover:bg-white/88 hover:border-[#6F4E37]/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleChapterCardClick(ch, chExps)}
                      className="text-left p-4 sm:p-5 space-y-2.5 flex-1 cursor-pointer w-full"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono-tabular font-semibold text-[#6F4E37]">
                          Ch. {ch.chapterNumber}
                        </span>
                        <span className="text-[#756B63] font-mono-tabular">
                          {chExps.length} {t.classLibrary.activitiesUnit}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#302820]">
                        {ch.title}
                      </h3>
                      <ul className="text-xs text-[#756B63] space-y-0.5">
                        {ch.physicsTopics.slice(0, 3).map((topic, idx) => (
                          <li key={idx}>• {topic}</li>
                        ))}
                      </ul>
                      {ch.verificationStatus === 'needs_verification' && ch.verificationNote && (
                        <p className="text-[11px] text-[#B45309] pt-1">{ch.verificationNote}</p>
                      )}

                      <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#6F4E37]">
                        <span className="inline-flex items-center gap-1.5">
                          {interactiveChExps.length > 0 ? (
                            <FlaskConical className="w-3.5 h-3.5" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {chExps.length > 1
                              ? `Choose from ${chExps.length} Modules`
                              : isSingleInteractive
                                ? 'Open Interactive Lab'
                                : 'Open Activity & Quiz'}
                          </span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Search & Multi-Facet Filters */}
          <section className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#302820]">
                <Filter className="w-4 h-4 text-[#6F4E37]" />
                <span>{t.classLibrary.filterHeading}</span>
                <span className="font-mono-tabular text-xs font-medium text-[#756B63]">
                  ({filteredExperiments.length} / {classExperiments.length})
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChapterId('all');
                    setSelectedTopicArea('all');
                    setSelectedCategory('all');
                    setSelectedAvailability('all');
                    setSelectedCompletion('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer"
                >
                  {t.classLibrary.clearFiltersBtn}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative lg:col-span-1">
                <Search className="w-4 h-4 text-[#756B63] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.classLibrary.searchPlaceholder}
                  aria-label={t.classLibrary.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs sm:text-sm text-[#302820] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                aria-label={t.classLibrary.filterChapter}
                className="px-3 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs sm:text-sm text-[#302820]"
              >
                <option value="all">{t.classLibrary.filterAllChapters}</option>
                {curriculum.chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch. {ch.chapterNumber}: {ch.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedTopicArea}
                onChange={(e) =>
                  setSelectedTopicArea(e.target.value as CurriculumTopicArea | 'all')
                }
                aria-label={t.classLibrary.filterTopic}
                className="px-3 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs sm:text-sm text-[#302820]"
              >
                <option value="all">{t.classLibrary.filterAllTopics}</option>
                {topicAreasPresent.map((area) => (
                  <option key={area} value={area}>
                    {TOPIC_AREA_LABELS[area]}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as EntryCategory | 'all')
                }
                aria-label={t.classLibrary.filterCategory}
                className="px-3 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs sm:text-sm text-[#302820]"
              >
                <option value="all">{t.classLibrary.filterAllTypes}</option>
                <option value="ncert_practical">{t.classLibrary.catPractical}</option>
                <option value="ncert_activity">{t.classLibrary.catActivity}</option>
                <option value="ncert_concept">{t.classLibrary.catConcept}</option>
              </select>

              <div className="flex gap-2">
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  aria-label={t.classLibrary.filterAvailability}
                  className="flex-1 px-2.5 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs text-[#302820]"
                >
                  <option value="all">{t.classLibrary.filterAllModes}</option>
                  <option value="interactive">{t.classLibrary.filterInteractiveOnly}</option>
                  <option value="interactive_2d_3d">2D + 3D</option>
                  <option value="interactive_2d">2D</option>
                  <option value="explanation_only">{t.classLibrary.statusExplanationOnly}</option>
                  <option value="coming_soon">{t.classLibrary.statusComingSoon}</option>
                </select>
                <select
                  value={selectedCompletion}
                  onChange={(e) =>
                    setSelectedCompletion(
                      e.target.value as 'all' | 'completed' | 'incomplete'
                    )
                  }
                  aria-label={t.classLibrary.filterStatus}
                  className="flex-1 px-2.5 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-xs text-[#302820]"
                >
                  <option value="all">{t.classLibrary.filterAllStatus}</option>
                  <option value="completed">{t.classLibrary.filterCompleted}</option>
                  <option value="incomplete">{t.classLibrary.filterIncomplete}</option>
                </select>
              </div>
            </div>
          </section>

          {/* Filtered Experiment Catalogue Grid */}
          {filteredExperiments.length === 0 ? (
            <div className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-10 text-center space-y-3">
              <p className="text-base font-semibold text-[#302820]">
                {t.classLibrary.noResultsTitle}
              </p>
              <p className="text-sm text-[#756B63]">{t.classLibrary.noResultsDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map((exp) => {
                const completion = studentProgress[exp.id];
                const isInteractive = isExperimentLaunchable(exp);

                return (
                  <article
                    key={exp.id}
                    data-testid={`experiment-card-${exp.id}`}
                    className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 flex flex-col justify-between space-y-5 hover:border-[#6F4E37]/60 transition-colors"
                  >
                    <div className="space-y-3">
                      {/* Metadata Line (No rounded-full pills) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#6F4E37]">
                          Ch. {exp.chapterNumber} · {categoryLabel(exp.entryCategory)}
                        </span>
                        <span
                          className={`font-medium ${
                            exp.verificationStatus === 'verified_ncert'
                              ? 'text-[#6F4E37]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {verificationLabel(exp.verificationStatus)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-[#302820] leading-snug">
                        {exp.title}
                      </h3>

                      <p className="text-xs font-medium text-[#756B63]">
                        {TOPIC_AREA_LABELS[exp.topicArea]} · {exp.chapterTitle}
                      </p>

                      <p className="text-sm text-[#756B63] leading-relaxed">
                        {exp.description}
                      </p>

                      <div className="p-3 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] space-y-1 text-xs">
                        <p className="font-semibold text-[#302820]">
                          {availabilityLabel(exp.availabilityStatus)}
                        </p>
                        {exp.reusedAcrossClasses && exp.reusedAcrossClasses.length > 1 && (
                          <p className="text-[#756B63]">
                            {t.classLibrary.sharedAcrossPrefix}:{' '}
                            {exp.reusedAcrossClasses.map((c) => `Class ${c}`).join(' · ')}
                          </p>
                        )}
                        {exp.verificationNote && (
                          <p className="text-[#B45309] flex items-start gap-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{exp.verificationNote}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#D8D1CA] space-y-3">
                      {completion && (
                        <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37]">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t.experimentLab.completedBadge}</span>
                          </span>
                          {typeof completion.quizScore === 'number' &&
                            typeof completion.quizTotal === 'number' && (
                              <span className="font-mono-tabular">
                                {completion.quizScore}/{completion.quizTotal}
                              </span>
                            )}
                        </div>
                      )}

                      {isInteractive ? (
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => onLaunchExperiment(exp, '2d')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                          >
                            <FlaskConical className="w-4 h-4" />
                            <span>{t.classLibrary.launchLabBtn}</span>
                          </button>

                          {exp.availabilityStatus === 'interactive_2d_3d' && (
                            <button
                              type="button"
                              onClick={() => onLaunchExperiment(exp, '3d')}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#E6E0F0] text-[#302820] text-xs sm:text-sm font-semibold hover:bg-[#DCD3EA] transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                            >
                              <Compass className="w-4 h-4 text-[#6F4E37]" />
                              <span>3D</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModalExperiment(exp)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E6E0F0] text-[#302820] text-xs sm:text-sm font-semibold hover:bg-[#DCD3EA] transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                        >
                          {exp.availabilityStatus === 'coming_soon' ? (
                            <Sparkles className="w-4 h-4 text-[#6F4E37]" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-[#6F4E37]" />
                          )}
                          <span>{t.classLibrary.openActivityGuideBtn}</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {savedDynamicExperiments.length > 0 && onLaunchDynamicExperiment && (
            <section className="pt-4 border-t border-[#D8D1CA] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-[#302820]">
                  {t.dynamicLab.savedGeneratedSectionTitle}
                </h2>
                <span className="font-mono-tabular text-xs font-semibold text-[#6F4E37]">
                  {savedDynamicExperiments.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedDynamicExperiments.map((spec) => {
                  const completion = studentProgress[spec.id];
                  return (
                    <article
                      key={spec.id}
                      className="bg-white/78 rounded-2xl border border-[#D8D1CA]/90 shadow-[0_4px_20px_rgba(48,40,32,0.04)] p-6 flex flex-col justify-between space-y-4 hover:border-[#6F4E37]/60 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#6F4E37]">
                            Class {spec.studentClass} · {t.dynamicLab.generatedBadge}
                          </span>
                          <span className="font-mono-tabular text-[#756B63]">
                            {spec.supports3d ? '2D + 3D' : '2D'}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[#302820] leading-snug">
                          {spec.title}
                        </h3>
                        <p className="text-sm text-[#756B63] leading-relaxed">
                          {spec.educationalObjective || spec.conceptExplanation}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#D8D1CA] space-y-2.5">
                        {completion && (
                          <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37]">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{t.experimentLab.completedBadge}</span>
                            </span>
                            {typeof completion.quizScore === 'number' &&
                              typeof completion.quizTotal === 'number' && (
                                <span className="font-mono-tabular">
                                  {completion.quizScore}/{completion.quizTotal}
                                </span>
                              )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onLaunchDynamicExperiment(spec)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] cursor-pointer min-h-[42px]"
                          >
                            <FlaskConical className="w-4 h-4" />
                            <span>{t.classLibrary.launchLabBtn}</span>
                          </button>
                          {onDeleteDynamicExperiment && (
                            <button
                              type="button"
                              onClick={() => onDeleteDynamicExperiment(spec.id)}
                              aria-label={t.dynamicLab.deleteSavedLab}
                              className="px-3 py-2.5 rounded-lg border border-[#D8D1CA] text-xs font-medium text-[#756B63] hover:text-[#302820] hover:bg-[#F7F5F2] cursor-pointer min-h-[42px]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

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
