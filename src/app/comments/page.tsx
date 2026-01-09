'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  User,
  MessageSquare,
  LogOut,
  Send
} from 'lucide-react';
import { loadState, saveFeedback, getFeedbackForPresenter } from '@/lib/storage';
import { getSelectedJudge, saveSelectedJudge, clearSelectedJudge } from '@/lib/auth';
import { Presenter, Judge, Feedback } from '@/lib/types';
import { formatPresenterName, generateId } from '@/lib/utils';

export default function CommentsPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [selectedPresenter, setSelectedPresenter] = useState<Presenter | null>(null);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    const state = loadState();
    setPresenters(state.presenters);
    setFeedback(state.feedback);

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

  // Check if this judge has already submitted feedback for a presenter
  const hasSubmittedFeedback = (presenterId: string): boolean => {
    if (!selectedJudge) return false;
    return feedback.some(
      f => f.presenterId === presenterId &&
           f.submitterName.toLowerCase() === selectedJudge.toLowerCase()
    );
  };

  const handleJudgeSelect = (judgeName: string) => {
    setSelectedJudge(judgeName);
    saveSelectedJudge(judgeName);
    setSelectedPresenter(null);
    setStrengths('');
    setImprovements('');
    setSubmitSuccess(false);
  };

  const handleJudgeLogout = () => {
    setSelectedJudge(null);
    clearSelectedJudge();
    setSelectedPresenter(null);
    setStrengths('');
    setImprovements('');
  };

  const handlePresenterSelect = (presenter: Presenter) => {
    setSelectedPresenter(presenter);
    setStrengths('');
    setImprovements('');
    setSubmitSuccess(false);

    // Load existing feedback if any
    const existingFeedback = feedback.find(
      f => f.presenterId === presenter.id &&
           f.submitterName.toLowerCase() === selectedJudge?.toLowerCase()
    );
    if (existingFeedback) {
      setStrengths(existingFeedback.strengths);
      setImprovements(existingFeedback.areasForImprovement);
    }
  };

  const handleSubmit = () => {
    if (!selectedJudge || !selectedPresenter) return;
    if (!strengths.trim() && !improvements.trim()) return;

    const newFeedback: Feedback = {
      id: generateId(),
      presenterId: selectedPresenter.id,
      presenterName: formatPresenterName(selectedPresenter.firstName, selectedPresenter.lastName),
      submitterType: 'judge',
      submitterName: selectedJudge,
      strengths: strengths.trim(),
      areasForImprovement: improvements.trim(),
      timestamp: new Date().toISOString(),
    };

    saveFeedback(newFeedback);
    setFeedback(prev => [...prev, newFeedback]);
    setSubmitSuccess(true);

    // Auto-advance to next presenter without feedback after 2 seconds
    setTimeout(() => {
      const nextWithoutFeedback = assignedPresenters.find(p =>
        p.id !== selectedPresenter.id && !hasSubmittedFeedback(p.id)
      );
      if (nextWithoutFeedback) {
        handlePresenterSelect(nextWithoutFeedback);
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
          <MessageSquare className="mx-auto h-16 w-16 text-csu-green" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Judge Comments</h2>
          <p className="mt-2 text-gray-600">
            Please select your name to provide feedback for your assigned presenters.
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
  const feedbackCount = assignedPresenters.filter(p => hasSubmittedFeedback(p.id)).length;
  const totalCount = assignedPresenters.length;
  const progressPercent = totalCount > 0 ? (feedbackCount / totalCount) * 100 : 0;

  // Step 2: Presenter Selection
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
            <span className="text-sm font-medium text-gray-700">Comments Progress</span>
            <span className="text-sm text-gray-500">{feedbackCount} of {totalCount} complete</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-csu-green transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {feedbackCount === totalCount && (
            <p className="mt-2 text-sm text-green-600 font-medium">
              All done! Thank you for your feedback!
            </p>
          )}
        </div>

        {/* Presenter list */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {assignedPresenters
              .sort((a, b) => {
                if (a.presentationTime !== b.presentationTime) {
                  return a.presentationTime.localeCompare(b.presentationTime);
                }
                return a.id.localeCompare(b.id);
              })
              .map((presenter) => {
                const hasFeedback = hasSubmittedFeedback(presenter.id);
                return (
                  <button
                    key={presenter.id}
                    onClick={() => handlePresenterSelect(presenter)}
                    className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                      hasFeedback ? 'bg-green-50' : ''
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
                          <span>*</span>
                          <span>{presenter.presentationTime}</span>
                          <span>*</span>
                          <span>{presenter.researchType}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {hasFeedback ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Submitted
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

  // Step 3: Feedback Form
  const existingFeedback = feedback.find(
    f => f.presenterId === selectedPresenter.id &&
         f.submitterName.toLowerCase() === selectedJudge.toLowerCase()
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
                <span>*</span>
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
            <p className="font-medium text-green-800">Comments submitted successfully!</p>
            <p className="text-sm text-green-600">Moving to next presenter...</p>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {!submitSuccess && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {existingFeedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              You've already submitted feedback for this presenter. You can add additional comments below.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strengths <span className="text-gray-400">(What did they do well?)</span>
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={4}
              placeholder="e.g., Clear explanation of methods, engaging presentation style, well-designed visuals..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-csu-green resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas for Improvement <span className="text-gray-400">(Constructive suggestions)</span>
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={4}
              placeholder="e.g., Consider slowing down during complex sections, add more context for non-specialists..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-csu-green resize-none"
            />
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSubmit}
              disabled={!strengths.trim() && !improvements.trim()}
              className={`w-full py-4 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-colors ${
                strengths.trim() || improvements.trim()
                  ? 'bg-csu-green text-white hover:bg-csu-green/90'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
              {existingFeedback ? 'Add More Feedback' : 'Submit Feedback'}
            </button>
            {!strengths.trim() && !improvements.trim() && (
              <p className="mt-2 text-sm text-center text-gray-500">
                Please enter at least one comment to submit.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
