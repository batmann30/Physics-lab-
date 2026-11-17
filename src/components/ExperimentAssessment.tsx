import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, XCircle, RotateCcw } from 'lucide-react';
import type { ExperimentAssessmentQuestion } from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';

interface ExperimentAssessmentProps {
  experimentId: string;
  questions: ExperimentAssessmentQuestion[];
  t: TranslationBundle;
  savedScore?: number;
  savedTotal?: number;
  onSaveScore: (score: number, total: number, markCompleted: boolean) => void;
}

export const ExperimentAssessment: React.FC<ExperimentAssessmentProps> = ({
  experimentId,
  questions,
  t,
  savedScore,
  savedTotal,
  onSaveScore,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 text-sm text-[#756B63]">
        {t.experimentLab.noQuestionsAvailable}
      </div>
    );
  }

  const allAnswered = questions.every((q) => typeof selectedAnswers[q.id] === 'number');
  const currentScore = questions.reduce(
    (sum, q) => sum + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0),
    0
  );

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleCheckAnswers = () => {
    setSubmitted(true);
    onSaveScore(currentScore, questions.length, true);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const kindLabels: Record<ExperimentAssessmentQuestion['kind'], string> = {
    conceptual: t.experimentLab.questionKindConceptual,
    application: t.experimentLab.questionKindApplication,
    numerical: t.experimentLab.questionKindNumerical,
  };

  return (
    <div
      key={experimentId}
      className="bg-white rounded-2xl border border-[#D8D1CA] p-5 sm:p-6 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D1CA] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#302820]">
            <HelpCircle className="w-5 h-5 text-[#6F4E37]" />
            <h3 className="text-base sm:text-lg font-semibold">
              {t.experimentLab.assessmentHeading}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#756B63]">
            {t.experimentLab.assessmentSubtitle}
          </p>
        </div>

        {typeof savedScore === 'number' && typeof savedTotal === 'number' && (
          <div className="px-3.5 py-2 rounded-lg bg-[#E6E0F0]/60 border border-[#D8D1CA] text-xs font-semibold text-[#302820] font-mono-tabular">
            {t.experimentLab.lastScoreLabel}: {savedScore}/{savedTotal}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const chosen = selectedAnswers[q.id];
          const isCorrect = submitted && chosen === q.correctIndex;

          return (
            <div
              key={q.id}
              className="p-4 sm:p-5 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#756B63]">
                <span className="font-semibold text-[#6F4E37]">
                  Q{qIdx + 1} · {kindLabels[q.kind]}
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-[#302820] leading-snug">
                {q.prompt}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isChosen = chosen === optIdx;
                  const isAnswer = q.correctIndex === optIdx;

                  let btnClass =
                    'bg-white border-[#D8D1CA] text-[#302820] hover:border-[#6F4E37]';
                  if (!submitted && isChosen) {
                    btnClass = 'bg-[#E6E0F0] border-[#6F4E37] text-[#302820] font-semibold';
                  } else if (submitted && isAnswer) {
                    btnClass = 'bg-[#ECFDF5] border-[#2B7A78] text-[#1D4E4F] font-semibold';
                  } else if (submitted && isChosen && !isAnswer) {
                    btnClass = 'bg-[#FDF2F0] border-[#B83A2D] text-[#7A271A]';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${btnClass}`}
                    >
                      <span className="font-mono-tabular font-semibold shrink-0 text-[#6F4E37]">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  className={`mt-2 p-3.5 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 ${
                    isCorrect
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#1D4E4F]'
                      : 'bg-white border-[#D8D1CA] text-[#302820]'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2B7A78] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#B83A2D] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      {isCorrect ? t.experimentLab.correctLabel : t.experimentLab.reviewLabel}
                    </p>
                    <p className="leading-relaxed opacity-90">{q.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#D8D1CA]">
        {submitted ? (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-semibold text-[#302820] font-mono-tabular">
              {t.experimentLab.scoreSavedLabel}: {currentScore} / {questions.length}
            </p>
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D8D1CA] bg-white text-xs sm:text-sm font-medium text-[#302820] hover:bg-[#F7F5F2] cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>{t.experimentLab.retakeQuizBtn}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={handleCheckAnswers}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#6F4E37] text-white text-sm font-semibold hover:bg-[#5C402C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.experimentLab.submitQuizBtn}</span>
          </button>
        )}
      </div>
    </div>
  );
};
