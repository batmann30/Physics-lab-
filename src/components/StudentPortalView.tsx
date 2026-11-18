import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Edit3,
  FlaskConical,
  GraduationCap,
  Lock,
  LogOut,
  Plus,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  AssessmentResultRecord,
  ClassMembership,
  ExperimentCatalogItem,
  FirestoreStudentProgress,
  GradeClassLevel,
  NcertChapterMeta,
  SimulationMode,
  StudentProgressMap,
  UserProfile,
} from '../types/physics';
import type { TranslationBundle } from '../i18n/translations';
import {
  EXPERIMENT_CATALOGUE,
  NCERT_CLASS_CURRICULA,
} from '../data/ncertCurriculum';
import {
  joinLocalClassByCode,
  leaveLocalClass,
  updateLocalUserProfile,
} from '../services/localAuthDb';
import { isExperimentLaunchable } from '../data/simulationRegistry';
import { ConceptExperimentChooserModal } from './ConceptExperimentChooserModal';
import { ExperimentActivityModal } from './ExperimentActivityModal';
import type {
  GuidedActivityCompletion,
  GuidedClassroomActivity,
} from '../types/companion';

interface StudentPortalViewProps {
  profile: UserProfile;
  memberships: ClassMembership[];
  progressRecords: FirestoreStudentProgress[];
  studentProgressMap: StudentProgressMap;
  assessmentResults: AssessmentResultRecord[];
  guidedActivities?: GuidedClassroomActivity[];
  guidedCompletions?: GuidedActivityCompletion[];
  t: TranslationBundle;
  onProfileUpdated: (next: UserProfile) => void;
  onRefreshData: () => Promise<void>;
  onOpenLibrary: () => void;
  onLaunchExperiment: (experiment: ExperimentCatalogItem, mode?: SimulationMode) => void;
  onLaunchGuidedActivity?: (activity: GuidedClassroomActivity) => void;
  onSaveProgress: (
    experimentId: string,
    patch: {
      quizScore?: number;
      quizTotal?: number;
      observation?: string;
      markCompleted?: boolean;
    }
  ) => void;
  onOpenTextbookScanner: () => void;
  onLogout: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  profile,
  memberships,
  progressRecords,
  studentProgressMap,
  assessmentResults,
  guidedActivities = [],
  guidedCompletions = [],
  t,
  onProfileUpdated,
  onRefreshData,
  onOpenLibrary,
  onLaunchExperiment,
  onLaunchGuidedActivity,
  onSaveProgress,
  onOpenTextbookScanner,
  onLogout,
}) => {
  const activeClass: GradeClassLevel = profile.selectedClass ?? 6;
  const curriculum = NCERT_CLASS_CURRICULA[activeClass];

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editSchool, setEditSchool] = useState(profile.schoolOrSubject || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [modalExperiment, setModalExperiment] = useState<ExperimentCatalogItem | null>(null);
  const [chooserChapter, setChooserChapter] = useState<{
    chapter: NcertChapterMeta;
    experiments: ExperimentCatalogItem[];
  } | null>(null);

  const classExperiments = useMemo(
    () => EXPERIMENT_CATALOGUE.filter((e) => e.classLevel === activeClass),
    [activeClass]
  );

  const completedInActiveClass = useMemo(
    () => classExperiments.filter((e) => Boolean(studentProgressMap[e.id])),
    [classExperiments, studentProgressMap]
  );

  const totalCompletedExperiments = useMemo(() => {
    const ids = new Set<string>();
    progressRecords.forEach((p) => {
      if (p.completionStatus === 'completed') ids.add(p.experimentId);
    });
    Object.keys(studentProgressMap).forEach((id) => ids.add(id));
    return ids.size;
  }, [progressRecords, studentProgressMap]);

  const completedModulesCount = useMemo(() => {
    const completedIds = new Set(Object.keys(studentProgressMap));
    let done = 0;
    for (const ch of curriculum.chapters) {
      const chExps = classExperiments.filter((e) => e.chapterId === ch.id);
      if (chExps.length > 0 && chExps.every((e) => completedIds.has(e.id))) {
        done += 1;
      }
    }
    return done;
  }, [curriculum.chapters, classExperiments, studentProgressMap]);

  const continueLearningExperiments = useMemo(() => {
    const nextIncomplete = classExperiments.filter(
      (e) => !studentProgressMap[e.id] && isExperimentLaunchable(e)
    );
    if (nextIncomplete.length > 0) return nextIncomplete.slice(0, 3);
    return classExperiments.filter((e) => isExperimentLaunchable(e)).slice(0, 3);
  }, [classExperiments, studentProgressMap]);

  const classProgressPct =
    classExperiments.length > 0
      ? Math.round((completedInActiveClass.length / classExperiments.length) * 100)
      : 0;

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    if (!joinCodeInput.trim()) {
      setJoinError('Enter the class join code provided by your teacher.');
      return;
    }
    setJoining(true);
    try {
      const joined = await joinLocalClassByCode(profile.uid, joinCodeInput);
      setJoinCodeInput('');
      setJoinSuccess(`Joined "${joined.className}" (Class ${joined.classGrade}).`);
      await onRefreshData();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Unable to join class.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClass = async (membershipId: string) => {
    setJoinError(null);
    setJoinSuccess(null);
    try {
      await leaveLocalClass(profile.uid, membershipId);
      await onRefreshData();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not leave class.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const updated = await updateLocalUserProfile(profile.uid, {
        name: editName,
        schoolOrSubject: editSchool,
      });
      onProfileUpdated(updated);
      await onRefreshData();
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleModuleCardClick = (ch: NcertChapterMeta, chExps: ExperimentCatalogItem[]) => {
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

    onOpenLibrary();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Student Welcome & Profile Header */}
      <section className="bg-white rounded-2xl border border-[#D8D1CA] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6F4E37]">
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
              <span aria-hidden="true">·</span>
              <span>NCERT Class {activeClass}</span>
              {profile.schoolOrSubject && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#756B63] font-medium">{profile.schoolOrSubject}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#302820]">
              Welcome back, {profile.name}
            </h1>
            <p className="text-sm text-[#756B63]">
              <span className="font-mono text-[#302820]">@{profile.username}</span>
              <span aria-hidden="true"> · </span>
              <span>Browser-Local Demo Mode (IndexedDB)</span>
              <span aria-hidden="true"> · </span>
              <span>
                Your selected class and progress stay saved to this account on this browser.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#6F4E37] text-white text-sm font-semibold hover:bg-[#5C402C] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Class {activeClass} Library</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditName(profile.name);
                setEditSchool(profile.schoolOrSubject || '');
                setEditingProfile((prev) => !prev);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E6E0F0] text-[#302820] text-sm font-medium hover:bg-[#DCD3EA] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4 text-[#6F4E37]" />
              <span>{editingProfile ? 'Close Profile' : 'Edit Profile'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D8D1CA] text-sm font-medium text-[#302820] hover:bg-[#F7F5F2] transition-colors cursor-pointer min-h-[44px] whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 text-[#756B63]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Inline Editable Student Profile Drawer */}
        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="pt-6 border-t border-[#D8D1CA] grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
          >
            <label className="md:col-span-4 space-y-1.5">
              <span className="text-xs font-semibold text-[#302820] block">Student Name</span>
              <input
                type="text"
                required
                maxLength={100}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-sm text-[#302820]"
              />
            </label>

            <div className="md:col-span-4 space-y-1.5">
              <span className="text-xs font-semibold text-[#302820] block">
                Registered NCERT Class
              </span>
              <div className="px-3.5 py-2.5 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-sm font-semibold text-[#6F4E37] flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Class {activeClass} (Locked)</span>
              </div>
            </div>

            <label className="md:col-span-4 space-y-1.5">
              <span className="text-xs font-semibold text-[#302820] block">School (Optional)</span>
              <input
                type="text"
                maxLength={120}
                value={editSchool}
                onChange={(e) => setEditSchool(e.target.value)}
                placeholder="Your school name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-sm text-[#302820]"
              />
            </label>

            {profileError && (
              <div className="md:col-span-12 text-xs text-[#B83A2D]">{profileError}</div>
            )}

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#756B63]">
                Registered class is locked to keep curriculum mastery and classroom memberships
                consistent.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8D1CA] text-xs font-medium text-[#302820] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer disabled:opacity-60"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Locked Registered Classroom Track Summary */}
        <div className="pt-4 border-t border-[#D8D1CA] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#756B63]">
            Registered Textbook Track:{' '}
            <span className="font-semibold text-[#302820]">{curriculum.textbookSeries}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6F4E37]">
            <Lock className="w-3.5 h-3.5" />
            <span>Class {activeClass} · Locked to your student account</span>
          </div>
        </div>
      </section>

      {/* Progress Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs text-[#756B63]">Class {activeClass} Progress</p>
          <p className="text-2xl font-bold text-[#6F4E37] font-mono-tabular">{classProgressPct}%</p>
          <div className="w-full h-1.5 rounded-full bg-[#E5E4E2] overflow-hidden mt-2">
            <div className="h-full bg-[#6F4E37]" style={{ width: `${classProgressPct}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs text-[#756B63]">Completed Experiments</p>
          <p className="text-2xl font-bold text-[#302820] font-mono-tabular">
            {totalCompletedExperiments}
          </p>
          <p className="text-xs text-[#756B63] font-mono-tabular">
            {completedInActiveClass.length}/{classExperiments.length} in Class {activeClass}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs text-[#756B63]">Completed Modules</p>
          <p className="text-2xl font-bold text-[#302820] font-mono-tabular">
            {completedModulesCount} / {curriculum.chapters.length}
          </p>
          <p className="text-xs text-[#756B63]">NCERT Chapters</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D8D1CA] p-5 space-y-1">
          <p className="text-xs text-[#756B63]">Joined Classes</p>
          <p className="text-2xl font-bold text-[#302820] font-mono-tabular">
            {memberships.length}
          </p>
          <p className="text-xs text-[#756B63] font-mono-tabular">
            {assessmentResults.length} quiz attempts
          </p>
        </div>
      </section>

      {/* Continue Learning & Joined Classes Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7: Continue Learning + NCERT Modules */}
        <div className="lg:col-span-7 space-y-6">
          {guidedActivities.length > 0 && onLaunchGuidedActivity && (
            <div
              data-testid="student-guided-activities-card"
              className="bg-white rounded-2xl border-2 border-[#6F4E37]/45 p-6 space-y-4"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#6F4E37]">
                  Live Classroom Activities
                </p>
                <h2 className="text-lg font-semibold text-[#302820]">
                  Guided Teacher Labs
                </h2>
              </div>
              <div className="space-y-2.5">
                {guidedActivities.map((act) => {
                  const done = guidedCompletions.some((c) => c.activityId === act.activityId);
                  return (
                    <div
                      key={act.activityId}
                      className="p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F4E37] font-semibold">
                          <span>{act.className}</span>
                          <span aria-hidden="true">·</span>
                          <span>{act.teacherName}</span>
                          {done && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#6F4E37]">Submitted</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-[#302820]">{act.experimentTitle}</h3>
                        <p className="text-xs text-[#756B63] line-clamp-1">{act.predictionPrompt}</p>
                      </div>
                      <button
                        type="button"
                        data-testid={`start-guided-activity-${act.activityId}`}
                        onClick={() => onLaunchGuidedActivity(act)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>{done ? 'Revisit Guided Lab' : 'Start Guided Lab'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#302820]">Continue Learning</h2>
                <p className="text-xs text-[#756B63]">
                  Recommended interactive Class {activeClass} physics labs
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenTextbookScanner}
                className="text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer"
              >
                Scan Textbook Page &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {continueLearningExperiments.map((exp) => {
                const done = Boolean(studentProgressMap[exp.id]);
                return (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#6F4E37] font-semibold">
                        <span>Ch. {exp.chapterNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exp.chapterTitle}</span>
                        {done && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#6F4E37] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#302820]">{exp.title}</h3>
                      <p className="text-xs text-[#756B63] line-clamp-2">{exp.learningObjective}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onLaunchExperiment(exp, '2d')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6F4E37] text-white text-xs font-semibold hover:bg-[#5C402C] cursor-pointer whitespace-nowrap min-h-[40px]"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>{done ? 'Revisit Lab' : 'Start Lab'}</span>
                      </button>
                      {exp.availabilityStatus === 'interactive_2d_3d' && (
                        <button
                          type="button"
                          onClick={() => onLaunchExperiment(exp, '3d')}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#E6E0F0] text-[#302820] text-xs font-semibold hover:bg-[#DCD3EA] cursor-pointer whitespace-nowrap min-h-[40px]"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                          <span>3D</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive NCERT Physics Modules for Registered Class */}
          <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold text-[#302820]">
                  Class {activeClass} NCERT Physics Modules
                </h2>
                <p className="text-xs text-[#756B63]">
                  Click any concept below to open its interactive lab directly
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenLibrary}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#6F4E37] hover:underline cursor-pointer"
              >
                <span>Browse All ({classExperiments.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {curriculum.chapters.map((ch) => {
                const chExps = classExperiments.filter((e) => e.chapterId === ch.id);
                const chDone = chExps.filter((e) => Boolean(studentProgressMap[e.id])).length;
                const hasInteractive = chExps.some((e) => isExperimentLaunchable(e));
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleModuleCardClick(ch, chExps)}
                    className="text-left p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] hover:border-[#6F4E37] hover:bg-[#E6E0F0]/35 transition-colors cursor-pointer space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#6F4E37]">
                          Chapter {ch.chapterNumber}
                        </span>
                        <span className="font-mono-tabular text-[#756B63]">
                          {chDone}/{chExps.length} done
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#302820]">{ch.title}</h3>
                      <p className="text-xs text-[#756B63]">
                        {ch.physicsTopics.slice(0, 2).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#6F4E37] pt-1">
                      <span className="inline-flex items-center gap-1">
                        {hasInteractive ? (
                          <FlaskConical className="w-3.5 h-3.5" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {chExps.length > 1
                            ? `Choose Module (${chExps.length})`
                            : hasInteractive
                              ? 'Open Interactive Lab'
                              : 'Open Activity Guide'}
                        </span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5: Joined Classes + Assessment Results */}
        <div className="lg:col-span-5 space-y-6">
          {/* Joined Classes & Join by Code */}
          <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6F4E37]" />
              <h2 className="text-lg font-semibold text-[#302820]">Joined Classes</h2>
            </div>

            <form onSubmit={handleJoinClass} className="flex gap-2">
              <input
                type="text"
                maxLength={12}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter join code (e.g. PHY...)"
                aria-label="Class join code"
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#D8D1CA] bg-[#F7F5F2] text-sm font-mono uppercase text-[#302820] focus:outline-none focus:border-[#6F4E37]"
              />
              <button
                type="submit"
                disabled={joining}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#6F4E37] text-white text-xs sm:text-sm font-semibold hover:bg-[#5C402C] cursor-pointer disabled:opacity-60 whitespace-nowrap min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>{joining ? 'Joining...' : 'Join Class'}</span>
              </button>
            </form>

            {joinError && (
              <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#E7B5AF] text-xs text-[#7A271A] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div className="p-3 rounded-xl bg-[#E6E0F0]/65 border border-[#D8D1CA] text-xs text-[#302820] flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
                <span>{joinSuccess}</span>
              </div>
            )}

            {memberships.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] text-xs text-[#756B63]">
                You have not joined any teacher classroom yet. Ask your Physics teacher for their
                class join code to share your lab progress and quiz scores with them.
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberships.map((m) => (
                  <div
                    key={m.membershipId}
                    className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-[#302820]">{m.className}</p>
                      <p className="text-xs text-[#756B63]">
                        Class {m.classGrade} · {m.teacherName} · Code{' '}
                        <span className="font-mono text-[#302820]">{m.joinCode}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLeaveClass(m.membershipId)}
                      aria-label={`Leave ${m.className}`}
                      className="p-2 rounded-lg text-[#756B63] hover:text-[#B83A2D] hover:bg-white cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assessment History */}
          <div className="bg-white rounded-2xl border border-[#D8D1CA] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6F4E37]" />
              <h2 className="text-lg font-semibold text-[#302820]">Assessment History</h2>
            </div>

            {assessmentResults.length === 0 ? (
              <p className="text-xs text-[#756B63] leading-relaxed">
                No quiz attempts recorded yet. Open any interactive experiment or activity guide and
                submit its Assessment Quiz to record your score here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {assessmentResults.slice(0, 6).map((res) => (
                  <div
                    key={res.resultId}
                    className="p-3.5 rounded-xl bg-[#F7F5F2] border border-[#D8D1CA] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-semibold text-[#302820] truncate">
                        {res.experimentTitle}
                      </p>
                      <p className="text-[11px] text-[#756B63] font-mono-tabular">
                        Class {res.classGrade} · {new Date(res.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-sm font-bold text-[#6F4E37] shrink-0">
                      {res.score}/{res.totalQuestions}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {chooserChapter && (
        <ConceptExperimentChooserModal
          chapter={chooserChapter.chapter}
          experiments={chooserChapter.experiments}
          studentProgress={studentProgressMap}
          t={t}
          onLaunchExperiment={onLaunchExperiment}
          onOpenActivityGuide={(exp) => setModalExperiment(exp)}
          onClose={() => setChooserChapter(null)}
        />
      )}

      {modalExperiment && (
        <ExperimentActivityModal
          experiment={modalExperiment}
          completion={studentProgressMap[modalExperiment.id]}
          t={t}
          onClose={() => setModalExperiment(null)}
          onSaveProgress={onSaveProgress}
        />
      )}
    </div>
  );
};
