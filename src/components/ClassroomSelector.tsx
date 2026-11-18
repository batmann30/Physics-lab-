import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Gauge,
  GraduationCap,
  Lightbulb,
  Lock,
  Magnet,
  Waves,
  Zap,
} from 'lucide-react';
import type {
  ExperimentCatalogItem,
  GradeClassLevel,
  NcertChapterMeta,
  SimulationMode,
  StudentProgressMap,
} from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';
import {
  CLASS_LEVELS,
  EXPERIMENT_CATALOGUE,
  NCERT_CLASS_CURRICULA,
} from '../data/ncertCurriculum';
import { isExperimentLaunchable } from '../data/simulationRegistry';

interface ClassroomSelectorProps {
  selectedClass: GradeClassLevel;
  lockedClass?: GradeClassLevel;
  studentProgress: StudentProgressMap;
  t: TranslationBundle;
  onSelectClass: (classLevel: GradeClassLevel) => void;
  onChapterAction?: (
    classLevel: GradeClassLevel,
    chapter: NcertChapterMeta,
    experiments: ExperimentCatalogItem[]
  ) => void;
  onLaunchExperiment?: (experiment: ExperimentCatalogItem, mode?: SimulationMode) => void;
  compact?: boolean;
}

const GRADE_ICON_MAP: Record<GradeClassLevel, React.ComponentType<{ className?: string }>> = {
  6: Magnet,
  7: Zap,
  8: Gauge,
  9: Waves,
  10: Lightbulb,
};

export const ClassroomSelector: React.FC<ClassroomSelectorProps> = ({
  selectedClass,
  lockedClass,
  studentProgress,
  t,
  onSelectClass,
  onChapterAction,
  compact = false,
}) => {
  const effectiveClasses: readonly GradeClassLevel[] = lockedClass ? [lockedClass] : CLASS_LEVELS;
  const activeClass: GradeClassLevel = lockedClass ?? selectedClass;

  const [expandedClass, setExpandedClass] = useState<GradeClassLevel | null>(activeClass);

  useEffect(() => {
    setExpandedClass(activeClass);
  }, [activeClass]);

  const toggleExpand = (cls: GradeClassLevel) => {
    setExpandedClass((prev) => (prev === cls ? null : cls));
  };

  return (
    <section aria-labelledby="choose-classroom-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#6F4E37] tracking-wide uppercase">
            <GraduationCap className="w-4 h-4" />
            <span>
              {lockedClass
                ? `Registered NCERT Classroom · Class ${lockedClass}`
                : 'NCERT Classes 6–10'}
            </span>
          </div>
          <h2 id="choose-classroom-heading" className="text-xl sm:text-2xl font-bold text-[#302820]">
            Choose Your Classroom
          </h2>
          <p className="text-sm text-[#756B63]">
            {lockedClass
              ? `Your account is registered in Class ${lockedClass}. Select any NCERT module below to launch its lab directly.`
              : 'Select your grade and continue exploring Physics.'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {effectiveClasses.map((cls) => {
          const curriculum = NCERT_CLASS_CURRICULA[cls];
          const classExps = EXPERIMENT_CATALOGUE.filter((e) => e.classLevel === cls);
          const interactiveCnt = classExps.filter((e) => isExperimentLaunchable(e)).length;
          const completedCnt = classExps.filter((e) => Boolean(studentProgress[e.id])).length;
          const isSelected = activeClass === cls;
          const isExpanded = expandedClass === cls;
          const IconComponent = GRADE_ICON_MAP[cls];

          return (
            <div
              key={cls}
              data-testid={`classroom-card-${cls}`}
              className={`rounded-2xl border transition-colors overflow-hidden shadow-[0_2px_14px_rgba(48,40,32,0.04)] ${
                isSelected
                  ? 'bg-white/78 border-[#6F4E37] ring-1 ring-[#6F4E37]/25'
                  : 'bg-white/74 border-[#D8D1CA]/90 hover:bg-white/86 hover:border-[#6F4E37]/60'
              }`}
            >
              {/* Classroom Header Row */}
              <div
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected ? 'bg-[#F7F5F2]/65' : 'bg-transparent'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-[#6F4E37] border-[#6F4E37] text-white'
                        : 'bg-[#E6E0F0]/70 border-[#D8D1CA] text-[#6F4E37]'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-[#302820]">
                        {t.classLibrary.classPrefix} {cls}
                      </h3>
                      <span aria-hidden="true" className="text-[#D8D1CA]">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-[#6F4E37]">
                        {curriculum.textbookSeries}
                      </span>
                      {lockedClass && (
                        <>
                          <span aria-hidden="true" className="text-[#D8D1CA]">
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#756B63]">
                            <Lock className="w-3 h-3 text-[#6F4E37]" />
                            <span>Locked Grade</span>
                          </span>
                        </>
                      )}
                    </div>

                    {!compact && (
                      <p className="text-xs sm:text-sm text-[#756B63] leading-relaxed">
                        {curriculum.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#756B63] pt-0.5 font-mono-tabular">
                      <span>
                        {curriculum.chapters.length} {t.classLibrary.statChaptersShort}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {interactiveCnt} {t.classLibrary.statInteractiveLabs}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#6F4E37]">
                        {completedCnt}/{classExps.length} completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    data-testid={`dashboard-class-card-${cls}`}
                    onClick={() => onSelectClass(cls)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[42px] whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#6F4E37] text-white hover:bg-[#5C402C]'
                        : 'bg-[#E6E0F0] text-[#302820] hover:bg-[#DCD3EA]'
                    }`}
                  >
                    <span>
                      {t.classLibrary.openClassBtn} {cls}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleExpand(cls)}
                    className="inline-flex items-center gap-1 px-3 py-2.5 rounded-lg border border-[#D8D1CA] bg-white text-xs font-medium text-[#302820] hover:bg-[#F7F5F2] transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                  >
                    <span>{isExpanded ? 'Hide Chapters' : 'Preview Chapters'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#756B63]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#756B63]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable NCERT Modules Inside This Classroom */}
              {isExpanded && (
                <div className="border-t border-[#D8D1CA] bg-white p-4 sm:p-5 space-y-3">
                  <p className="text-xs font-semibold text-[#756B63]">
                    Class {cls} NCERT Chapters · Click any concept to open its Interactive Lab
                    directly
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {curriculum.chapters.map((ch) => {
                      const chExps = classExps.filter((e) => e.chapterId === ch.id);
                      const hasInteractive = chExps.some((e) => isExperimentLaunchable(e));
                      const chDone = chExps.filter((e) => Boolean(studentProgress[e.id])).length;

                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            if (onChapterAction) {
                              onChapterAction(cls, ch, chExps);
                            } else {
                              onSelectClass(cls);
                            }
                          }}
                          className="text-left p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] hover:border-[#6F4E37] hover:bg-[#E6E0F0]/35 transition-colors cursor-pointer space-y-1.5 flex flex-col justify-between min-h-[104px]"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-mono-tabular font-semibold text-[#6F4E37]">
                                Ch. {ch.chapterNumber}
                              </span>
                              <span className="font-mono-tabular text-[#756B63]">
                                {chDone}/{chExps.length} done
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-semibold text-[#302820] leading-snug">
                              {ch.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-semibold text-[#6F4E37]">
                            <span className="inline-flex items-center gap-1">
                              {hasInteractive ? (
                                <FlaskConical className="w-3.5 h-3.5" />
                              ) : (
                                <BookOpen className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {chExps.length > 1
                                  ? `${chExps.length} Modules`
                                  : hasInteractive
                                    ? 'Interactive Lab'
                                    : 'Activity Guide'}
                              </span>
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
