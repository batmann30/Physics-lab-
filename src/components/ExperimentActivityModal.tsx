import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ClipboardList, X } from 'lucide-react';
import type {
  ExperimentCatalogItem,
  StudentExperimentCompletion,
} from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';
import { ExperimentAssessment } from './ExperimentAssessment';

interface ExperimentActivityModalProps {
  experiment: ExperimentCatalogItem;
  completion?: StudentExperimentCompletion;
  t: TranslationBundle;
  onClose: () => void;
  onSaveProgress: (
    experimentId: string,
    patch: {
      quizScore?: number;
      quizTotal?: number;
      observation?: string;
      markCompleted?: boolean;
    }
  ) => void;
}

export const ExperimentActivityModal: React.FC<ExperimentActivityModalProps> = ({
  experiment,
  completion,
  t,
  onClose,
  onSaveProgress,
}) => {
  const [noteInput, setNoteInput] = useState('');

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = noteInput.trim();
    if (!cleaned) return;
    onSaveProgress(experiment.id, { observation: cleaned });
    setNoteInput('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
      className="fixed inset-0 z-50 bg-[#302820]/50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#F7F5F2] border border-[#D8D1CA] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#D8D1CA] px-6 py-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#6F4E37]">
              {t.classLibrary.classPrefix} {experiment.classLevel} · Ch. {experiment.chapterNumber}: {experiment.chapterTitle}
            </p>
            <h2 id="activity-modal-title" className="text-lg sm:text-xl font-bold text-[#302820]">
              {experiment.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.componentOverlay.closeBtn}
            className="p-2 rounded-lg border border-[#D8D1CA] bg-white text-[#302820] hover:bg-[#F7F5F2] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Transparency Note */}
          <div className="p-4 rounded-xl bg-[#E6E0F0]/55 border border-[#D8D1CA] text-xs sm:text-sm text-[#302820] space-y-1">
            <p className="font-semibold text-[#6F4E37]">
              {experiment.availabilityStatus === 'coming_soon'
                ? t.classLibrary.statusComingSoon
                : t.classLibrary.statusExplanationOnly}
            </p>
            <p>{experiment.gradeAdaptedNote}</p>
            {experiment.verificationNote && (
              <p className="text-xs text-[#756B63] pt-1">{experiment.verificationNote}</p>
            )}
          </div>

          {/* A. Structured Overview */}
          <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#302820]">
              <BookOpen className="w-5 h-5 text-[#6F4E37]" />
              <h3 className="text-base font-semibold">{t.experimentLab.tabIntroduction}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] space-y-1">
                <p className="text-xs font-semibold text-[#6F4E37]">{t.experimentLab.objectiveLabel}</p>
                <p className="text-[#302820] leading-relaxed">{experiment.learningObjective}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] space-y-1">
                <p className="text-xs font-semibold text-[#6F4E37]">{t.experimentLab.realWorldLabel}</p>
                <p className="text-[#302820] leading-relaxed">{experiment.realWorldApplication}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#302820]">{t.experimentLab.apparatusLabel}</p>
                <ul className="list-disc pl-5 text-[#756B63] space-y-1">
                  {experiment.apparatus.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#302820]">{t.experimentLab.procedureLabel}</p>
                <ol className="list-decimal pl-5 text-[#756B63] space-y-1">
                  {experiment.procedure.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] space-y-1.5 text-sm">
              <p className="text-xs font-semibold text-[#6F4E37]">
                {t.experimentLab.scientificExplanationLabel}
              </p>
              <p className="text-[#302820] leading-relaxed">{experiment.scientificExplanation}</p>
            </div>
          </div>

          {/* D. Observation Logbook & Conclusion */}
          <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#302820]">
                <ClipboardList className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-base font-semibold">{t.experimentLab.tabObservations}</h3>
              </div>

              <button
                type="button"
                onClick={() => onSaveProgress(experiment.id, { markCompleted: true })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completion
                    ? t.experimentLab.completedBadge
                    : t.experimentLab.markCompletedBtn}
                </span>
              </button>
            </div>

            <ul className="list-disc pl-5 text-xs sm:text-sm text-[#756B63] space-y-1">
              {experiment.observationsGuide.map((obs, idx) => (
                <li key={idx}>{obs}</li>
              ))}
            </ul>

            <form onSubmit={handleAddObservation} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={t.experimentLab.observationPlaceholder}
                className="flex-1 px-3.5 py-2 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-sm text-[#302820] focus:outline-none focus:border-[#6F4E37]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg border border-[#6F4E37] bg-white text-[#6F4E37] text-xs sm:text-sm font-semibold hover:bg-[#E6E0F0]/40 cursor-pointer whitespace-nowrap"
              >
                {t.experimentLab.saveObservationBtn}
              </button>
            </form>

            {completion?.recordedObservations && completion.recordedObservations.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {completion.recordedObservations.map((entry, idx) => (
                  <li
                    key={idx}
                    className="px-3 py-2 rounded-lg bg-[#F7F5F2] border border-[#D8D1CA] text-xs text-[#302820]"
                  >
                    {entry}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* E. Interactive Assessment */}
          <ExperimentAssessment
            experimentId={experiment.id}
            questions={experiment.assessmentQuestions}
            t={t}
            savedScore={completion?.quizScore}
            savedTotal={completion?.quizTotal}
            onSaveScore={(score, total, markCompleted) =>
              onSaveProgress(experiment.id, {
                quizScore: score,
                quizTotal: total,
                markCompleted,
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
