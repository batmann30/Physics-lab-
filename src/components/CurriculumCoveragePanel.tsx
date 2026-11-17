import React from 'react';
import { CheckCircle2, Cpu, Layers, ShieldAlert } from 'lucide-react';
import { ALL_UNIQUE_SIMULATION_ENGINES } from '../data/simulationRegistry';
import { computeCurriculumCoverageReport } from '../data/ncertCurriculum';
import type { TranslationBundle } from '../i18n/translations';

import type { GradeClassLevel } from '../types/physics';

interface CurriculumCoveragePanelProps {
  t: TranslationBundle;
  lockedClass?: GradeClassLevel;
  onSelectClass: (classLevel: 6 | 7 | 8 | 9 | 10) => void;
}

export const CurriculumCoveragePanel: React.FC<CurriculumCoveragePanelProps> = ({
  t,
  lockedClass,
  onSelectClass,
}) => {
  const report = computeCurriculumCoverageReport();

  return (
    <div className="space-y-6">
      {/* Architecture Headline Metrics (Separating Unique Engines from Reused Listings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs font-medium text-[#756B63]">
            {t.classLibrary.coverageUniqueEnginesLabel}
          </p>
          <p className="text-2xl font-bold text-[#6F4E37] font-mono-tabular">
            {report.implementedUniqueSimulationEngines} / {report.totalUniqueSimulationEngines}
          </p>
          <p className="text-xs text-[#756B63]">
            {t.classLibrary.coverageZeroDuplicatesNote}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs font-medium text-[#756B63]">
            {t.classLibrary.coverageClassListingsLabel}
          </p>
          <p className="text-2xl font-bold text-[#302820] font-mono-tabular">
            {report.totalClassExperimentListings}
          </p>
          <p className="text-xs text-[#756B63]">
            {t.classLibrary.coverageInteractiveListingsLabel}: {report.totalInteractiveListings}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs font-medium text-[#756B63]">
            {t.classLibrary.coverageRemainingLabel}
          </p>
          <p className="text-2xl font-bold text-[#302820] font-mono-tabular">
            {report.totalRemainingToDevelop}
          </p>
          <p className="text-xs text-[#756B63]">
            {t.classLibrary.coverageRemainingNote}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs font-medium text-[#756B63]">
            {t.classLibrary.coverageGradesLabel}
          </p>
          <p className="text-2xl font-bold text-[#302820] font-mono-tabular">6 – 10</p>
          <p className="text-xs text-[#756B63]">Curiosity · Exploration · Rationalised</p>
        </div>
      </div>

      {/* Per-Class Coverage Table */}
      <div className="bg-white rounded-2xl border border-[#D8D1CA] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8D1CA] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#302820]">
            <Layers className="w-5 h-5 text-[#6F4E37]" />
            <h3 className="text-base font-semibold">{t.classLibrary.coverageTableHeading}</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F7F5F2] border-b border-[#D8D1CA] text-xs font-semibold text-[#756B63]">
              <tr>
                <th className="py-3 px-4">{t.conceptExplorer.classLevelLabel}</th>
                <th className="py-3 px-4">{t.classLibrary.statChapters}</th>
                <th className="py-3 px-4">{t.classLibrary.coverageColListed}</th>
                <th className="py-3 px-4">{t.classLibrary.coverageColImplemented}</th>
                <th className="py-3 px-4">{t.classLibrary.coverageColReused}</th>
                <th className="py-3 px-4">{t.classLibrary.coverageColVerification}</th>
                <th className="py-3 px-4 text-right">{t.classLibrary.coverageColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D1CA]">
              {report.rows.map((row) => {
                const isAllowed = !lockedClass || lockedClass === row.classLevel;
                return (
                  <tr key={row.classLevel} className="hover:bg-[#F7F5F2]/60">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#302820]">
                        {t.classLibrary.classPrefix} {row.classLevel}
                      </p>
                      <p className="text-xs text-[#756B63]">{row.textbookSeries}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#302820]">
                      {row.physicsChaptersCount} ({row.physicsTopicsCount} topics)
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#302820]">
                      {row.totalExperimentsListed}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#2B7A78]">
                      {row.implementedCount} / {row.simulatableCount}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#756B63]">
                      {row.reusedFromOtherClassesCount}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 text-[#2B7A78] font-medium mr-3">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {row.verifiedCount} verified
                      </span>
                      {row.needsVerificationCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#B45309] font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {row.needsVerificationCount} check
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAllowed ? (
                        <button
                          type="button"
                          onClick={() => onSelectClass(row.classLevel)}
                          className="px-3 py-1.5 rounded-lg border border-[#D8D1CA] bg-white text-xs font-semibold text-[#6F4E37] hover:bg-[#E6E0F0]/50 cursor-pointer whitespace-nowrap"
                        >
                          {t.classLibrary.openClassBtn} {row.classLevel}
                        </button>
                      ) : (
                        <span className="text-xs text-[#756B63]">
                          Locked to Class {lockedClass}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Simulation Engine Registry Directory */}
      <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#302820]">
          <Cpu className="w-5 h-5 text-[#6F4E37]" />
          <h3 className="text-base font-semibold">{t.classLibrary.sharedEnginesHeading}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_UNIQUE_SIMULATION_ENGINES.map((engine) => (
            <div
              key={engine.id}
              className="p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#302820]">{engine.name}</p>
                <span className="font-mono-tabular text-xs font-semibold text-[#6F4E37] shrink-0">
                  {engine.supportedModes.map((m) => m.toUpperCase()).join(' + ')}
                </span>
              </div>
              <p className="text-xs text-[#756B63] leading-relaxed">{engine.explanationMetadata}</p>
              <p className="text-[11px] font-medium text-[#6F4E37]">
                {t.classLibrary.sharedAcrossPrefix}: {engine.supportedClasses.map((c) => `Class ${c}`).join(' · ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
