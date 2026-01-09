'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  User,
  ClipboardList,
  LogOut,
  Star
} from 'lucide-react';
import { loadState, saveScore, getScores } from '@/lib/storage';
import { getSelectedJudge, saveSelectedJudge, clearSelectedJudge } from '@/lib/auth';
import { calculateWeightedTotal } from '@/lib/calculations';
import { Presenter, Judge, Score, ScoreCriteria, CRITERIA_WEIGHTS } from '@/lib/types';
import { formatPresenterName, generateId } from '@/lib/utils';

// Criteria labels for the form
const CRITERIA_INFO = [
  {
    key: 'contentWhy' as const,
    label: 'Content - WHY',
    description: 'A clear research problem or hypothesis is stated, supported by strong conceptual understanding.',
    weight: CRITERIA_WEIGHTS.contentWhy,
  },
  {
    key: 'contentWhatHow' as const,
    label: 'Content - WHAT/HOW',
    description: 'Clear research design including methods, preliminary data, results and interpretation.',
    weight: CRITERIA_WEIGHTS.contentWhatHow,
  },
  {
    key: 'contentNextSteps' as const,
    label: 'Content - Next Steps',
    description: 'Results/conclusions support future research directions with clear implications.',
    weight: CRITERIA_WEIGHTS.contentNextSteps,
  },
  {
    key: 'presentationFlow' as const,
    label: 'Logical Flow',
    description: 'Presentation followed a logical flow (title, introduction, design, conclusion).',
    weight: CRITERIA_WEIGHTS.presentationFlow,
  },
  {
    key: 'preparedness' as const,
    label: 'Preparedness',
    description: 'Well-practiced and professional (minimal pauses, good eye contact, appropriate appearance).',
    weight: CRITERIA_WEIGHTS.preparedness,
  },
  {
    key: 'verbalComm' as const,
    label: 'Verbal Communication',
    description: 'Clear, articulate, and concise. Language appropriate for presenter\'s level.',
    weight: CRITERIA_WEIGHTS.verbalComm,
  },
  {
    key: 'visualAids' as const,
    label: 'Visual Aids',
    description: 'Figures and text clear, large enough to see and understand. Relevant to research.',
    weight: CRITERIA_WEIGHTS.visualAids,
  },
];

const SCORE_OPTIONS = [
  { value: 5, label: '5 - Strongly Agree' },
  { value: 4, label: '4 - Agree' },
  { value: 3, label: '3 - Neutral' },
  { value: 2, label: '2 - Disagree' },
  { value: 1, label: '1 - Strongly Disagree' },
];

export default function ScoringPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [selectedPresenter, setSelectedPresenter] = useState<Presenter | null>(null);
  const [formScores, setFormScores] = useState<Partial<ScoreCriteria>>({});
  const [isNoShow, setIsNoShow] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    const state = loadState();
    setPresenters(state.presenters);
    setScores(state.scores);

    // Extract unique judges from presenters
    const judgeMap = new Map<string, Judge>();
    for (const presenter of state.presenters) {
      const judgeNames = [presenter.judge1, presenter.judge2, presenter.judge3]
        .filter((j): j is string => j !== null && j.length > 0);

      for (const name of judgeNames) {
        const id = name.toLowerCase().trim().replace(/\s+/g, '-');
        if (!judgeMap.has(id)) {
          judgeMap.set(id, { id, name, assignedPresenters: [] });
        }
        judgeMap.get(id)!.assignedPresenters.push(presenter.id);
      }
    }
    setJudges(Array.from(judgeMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

    // Restore previously selected judge
    const savedJudge = getSelectedJudge();
    if (savedJudge) {
      setSelectedJudge(savedJudge);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get presenters assigned to the selected judge
  const assignedPresenters = selectedJudge
    ? presenters.filter(p => {
        const judgeLower = selectedJudge.toLowerCase();
        return (
          p.judge1?.toLowerCase() === judgeLower ||
          p.judge2?.toLowerCase() === judgeLower ||
          p.judge3?.toLowerCase() === judgeLower
        );
      })
    : [];

  // Check which presenters have already been scored by this judge
  const getScoredStatus = (presenterId: string): boolean => {
    if (!selectedJudge) return false;
    return scores.some(
      s => s.presenterId === presenterId &&
           s.judgeName.toLowerCase() === selectedJudge.toLowerCase()
    );
  };

  const handleJudgeSelect = (judgeName: string) => {
    setSelectedJudge(judgeName);
    saveSelectedJudge(judgeName);
    setSelectedPresenter(null);
    setFormScores({});
    setIsNoShow(false);
    setSubmitSuccess(false);
  };

  const handleJudgeLogout = () => {
    setSelectedJudge(null);
    clearSelectedJudge();
    setSelectedPresenter(null);
    setFormScores({});
  };

  const handlePresenterSelect = (presenter: Presenter) => {
    setSelectedPresenter(presenter);
    setFormScores({});
    setIsNoShow(false);
    setSubmitSuccess(false);

    // Check if already scored and load existing scores
    const existingScore = scores.find(
      s => s.presenterId === presenter.id &&
           s.judgeName.toLowerCase() === selectedJudge?.toLowerCase()
    );
    if (existingScore) {
      setFormScores(existingScore.criteria);
      setIsNoShow(existingScore.isNoShow);
    }
  };

  const handleScoreChange = (criterion: keyof ScoreCriteria, value: number) => {
    setFormScores(prev => ({ ...prev, [criterion]: value }));
  };

  const isFormComplete = (): boolean => {
    if (isNoShow) return true;
    return CRITERIA_INFO.every(c => formScores[c.key] !== undefined);
  };

  const handleSubmit = () => {
    if (!selectedJudge || !selectedPresenter) return;

    const criteria: ScoreCriteria = isNoShow
      ? { contentWhy: 0, contentWhatHow: 0, contentNextSteps: 0, presentationFlow: 0, preparedness: 0, verbalComm: 0, visualAids: 0 }
      : {
          contentWhy: formScores.contentWhy || 0,
          contentWhatHow: formScores.contentWhatHow || 0,
          contentNextSteps: formScores.contentNextSteps || 0,
          presentationFlow: formScores.presentationFlow || 0,
          preparedness: formScores.preparedness || 0,
          verbalComm: formScores.verbalComm || 0,
          visualAids: formScores.visualAids || 0,
        };

    const score: Score = {
      id: `${selectedPresenter.id}-${selectedJudge.toLowerCase().replace(/\s+/g, '-')}`,
      presenterId: selectedPresenter.id,
      judgeName: selectedJudge,
      judgeId: selectedJudge.toLowerCase().replace(/\s+/g, '-'),
      timestamp: new Date().toISOString(),
      criteria,
      weightedTotal: isNoShow ? 0 : calculateWeightedTotal(criteria),
      isNoShow,
    };

    saveScore(score);
    setScores(prev => {
      const filtered = prev.filter(s => s.id !== score.id);
      return [...filtered, score];
    });
    setSubmitSuccess(true);

    // Auto-advance to next unscored presenter after 2 seconds
    setTimeout(() => {
      const nextUnscored = assignedPresenters.find(p =>
        p.id !== selectedPresenter.id && !getScoredStatus(p.id)
      );
      if (nextUnscored) {
        handlePresenterSelect(nextUnscored);
      } else {
        setSelectedPresenter(null);
        setSubmitSuccess(false);
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csu-green"></div>
      </div>
    );
  }

  if (presenters.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Event Not Set Up</h3>
        <p className="mt-2 text-sm text-gray-500">
          Presenter data hasn't been loaded yet. Please check back later.
        </p>
      </div>
    );
  }

  // Step 1: Judge Selection
  if (!selectedJudge) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <User className="mx-auto h-16 w-16 text-csu-green" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome, Judge!</h2>
          <p className="mt-2 text-gray-600">
            Please select your name to see your assigned presenters.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Name
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {judges.map((judge) => (
              <button
                key={judge.id}
                onClick={() => handleJudgeSelect(judge.name)}
                className="text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-csu-green hover:bg-csu-green/5 transition-colors"
              >
                <span className="font-medium text-gray-900">{judge.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({judge.assignedPresenters.length} presenters)
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress
  const scoredCount = assignedPresenters.filter(p => getScoredStatus(p.id)).length;
  const totalCount = assignedPresenters.length;
  const progressPercent = totalCount > 0 ? (scoredCount / totalCount) * 100 : 0;

  // Step 2: Presenter Selection (only shows assigned presenters!)
  if (!selectedPresenter) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Header with judge info and logout */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Assigned Presenters</h2>
            <p className="text-gray-600 mt-1">
              Logged in as: <span className="font-medium">{selectedJudge}</span>
            </p>
          </div>
          <button
            onClick={handleJudgeLogout}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Switch Judge
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm text-gray-500">{scoredCount} of {totalCount} complete</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-csu-green transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {scoredCount === totalCount && (
            <p className="mt-2 text-sm text-green-600 font-medium">
              All done! Thank you for judging!
            </p>
          )}
        </div>

        {/* Presenter list */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {assignedPresenters
              .sort((a, b) => {
                // Sort by session time first, then by ID
                if (a.presentationTime !== b.presentationTime) {
                  return a.presentationTime.localeCompare(b.presentationTime);
                }
                return a.id.localeCompare(b.id);
              })
              .map((presenter) => {
                const isScored = getScoredStatus(presenter.id);
                return (
                  <button
                    key={presenter.id}
                    onClick={() => handlePresenterSelect(presenter)}
                    className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                      isScored ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 text-gray-700 font-bold text-lg">
                            {presenter.id}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatPresenterName(presenter.firstName, presenter.lastName)}
                            </p>
                            <p className="text-sm text-gray-500 truncate max-w-md">
                              {presenter.title}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>{presenter.presentationType}</span>
                          <span>•</span>
                          <span>{presenter.presentationTime}</span>
                          <span>•</span>
                          <span>{presenter.researchType}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {isScored ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Scored
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Score Entry Form
  const existingScore = scores.find(
    s => s.presenterId === selectedPresenter.id &&
         s.judgeName.toLowerCase() === selectedJudge.toLowerCase()
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button and presenter info */}
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedPresenter(null);
            setSubmitSuccess(false);
          }}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center"
        >
          ← Back to presenter list
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-csu-green text-white font-bold text-2xl">
              {selectedPresenter.id}
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {formatPresenterName(selectedPresenter.firstName, selectedPresenter.lastName)}
              </h2>
              <p className="text-gray-600 mt-1">{selectedPresenter.title}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span>{selectedPresenter.presentationType}</span>
                <span>•</span>
                <span>{selectedPresenter.researchType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success message */}
      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Score submitted successfully!</p>
            <p className="text-sm text-green-600">Moving to next presenter...</p>
          </div>
        </div>
      )}

      {/* Score Form */}
      {!submitSuccess && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {existingScore && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              You've already scored this presenter. You can update your scores below.
            </div>
          )}

          {/* No-show toggle */}
          <div className="mb-6 pb-6 border-b">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isNoShow}
                onChange={(e) => setIsNoShow(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-csu-green focus:ring-csu-green"
              />
              <span className="font-medium text-gray-900">Mark as No-Show</span>
            </label>
            <p className="mt-1 text-sm text-gray-500 ml-8">
              Check this if the presenter did not appear for their presentation.
            </p>
          </div>

          {/* Criteria scoring */}
          {!isNoShow && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Rate each criterion: <span className="font-medium">5 = Strongly Agree</span> to{' '}
                <span className="font-medium">1 = Strongly Disagree</span>
              </p>

              {CRITERIA_INFO.map((criterion) => (
                <div key={criterion.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-900">
                      {criterion.label}
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        (weight: {criterion.weight})
                      </span>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">{criterion.description}</p>
                  <div className="flex gap-2">
                    {SCORE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleScoreChange(criterion.key, option.value)}
                        className={`flex-1 py-3 px-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                          formScores[criterion.key] === option.value
                            ? 'border-csu-green bg-csu-green text-white'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit button */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete()}
              className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-colors ${
                isFormComplete()
                  ? 'bg-csu-green text-white hover:bg-csu-green/90'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {existingScore ? 'Update Score' : 'Submit Score'}
            </button>
            {!isFormComplete() && !isNoShow && (
              <p className="mt-2 text-sm text-center text-gray-500">
                Please rate all criteria to submit.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
