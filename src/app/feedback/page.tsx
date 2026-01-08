'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle2, MessageSquare, Search } from 'lucide-react';
import { loadState, saveFeedback } from '@/lib/storage';
import { Presenter, Feedback } from '@/lib/types';
import { formatPresenterName, generateId } from '@/lib/utils';

export default function FeedbackPage() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresenter, setSelectedPresenter] = useState<Presenter | null>(null);
  const [submitterType, setSubmitterType] = useState<'judge' | 'attendee'>('attendee');
  const [submitterName, setSubmitterName] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const state = loadState();
    setPresenters(state.presenters);
    setIsLoading(false);
  }, []);

  // Filter presenters by search
  const filteredPresenters = presenters.filter(p => {
    const query = searchQuery.toLowerCase();
    const fullName = formatPresenterName(p.firstName, p.lastName).toLowerCase();
    return (
      fullName.includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.title.toLowerCase().includes(query)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPresenter) return;

    const feedback: Feedback = {
      id: generateId(),
      presenterId: selectedPresenter.id,
      presenterName: formatPresenterName(selectedPresenter.firstName, selectedPresenter.lastName),
      submitterType,
      submitterName: submitterName.trim() || 'Anonymous',
      strengths: strengths.trim(),
      areasForImprovement: improvements.trim(),
      timestamp: new Date().toISOString(),
    };

    saveFeedback(feedback);
    setSubmitSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSelectedPresenter(null);
      setStrengths('');
      setImprovements('');
      setSubmitSuccess(false);
      setSearchQuery('');
    }, 3000);
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
      <div className="max-w-2xl mx-auto text-center py-12">
        <MessageSquare className="mx-auto h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Feedback Not Yet Available</h2>
        <p className="mt-2 text-gray-600">
          The presenter list hasn't been loaded yet. Please check back during the event.
        </p>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-50 rounded-lg p-8">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-green-800">Thank You!</h2>
          <p className="mt-2 text-green-600">
            Your feedback has been submitted successfully.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Preparing form for another submission...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <MessageSquare className="mx-auto h-12 w-12 text-csu-green" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Presenter Feedback</h2>
        <p className="mt-2 text-gray-600">
          Help presenters improve by sharing constructive feedback on their presentation.
        </p>
      </div>

      {/* Step 1: Select Presenter */}
      {!selectedPresenter && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Step 1: Find the Presenter
          </h3>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-csu-green"
            />
          </div>

          {/* Presenter list */}
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {filteredPresenters.length === 0 ? (
              <p className="p-4 text-center text-gray-500">
                No presenters found matching "{searchQuery}"
              </p>
            ) : (
              <div className="divide-y">
                {filteredPresenters.slice(0, 50).map((presenter) => (
                  <button
                    key={presenter.id}
                    onClick={() => setSelectedPresenter(presenter)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm">
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
                  </button>
                ))}
                {filteredPresenters.length > 50 && (
                  <p className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                    Showing first 50 results. Refine your search to see more.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Feedback Form */}
      {selectedPresenter && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected presenter card */}
          <div className="bg-csu-green/5 border border-csu-green/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-csu-green text-white font-bold">
                  {selectedPresenter.id}
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    {formatPresenterName(selectedPresenter.firstName, selectedPresenter.lastName)}
                  </p>
                  <p className="text-sm text-gray-600">{selectedPresenter.presentationType}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPresenter(null)}
                className="text-sm text-csu-green hover:underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Submitter info */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">About You</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="submitterType"
                    value="attendee"
                    checked={submitterType === 'attendee'}
                    onChange={(e) => setSubmitterType(e.target.value as 'attendee')}
                    className="text-csu-green focus:ring-csu-green"
                  />
                  <span>General Attendee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="submitterType"
                    value="judge"
                    checked={submitterType === 'judge'}
                    onChange={(e) => setSubmitterType(e.target.value as 'judge')}
                    className="text-csu-green focus:ring-csu-green"
                  />
                  <span>Judge</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (optional)
              </label>
              <input
                type="text"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Leave blank to remain anonymous"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-csu-green"
              />
            </div>
          </div>

          {/* Feedback content */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Feedback</h3>

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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!strengths.trim() && !improvements.trim()}
            className={`w-full py-4 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-colors ${
              strengths.trim() || improvements.trim()
                ? 'bg-csu-green text-white hover:bg-csu-green/90'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="h-5 w-5" />
            Submit Feedback
          </button>

          <p className="text-center text-sm text-gray-500">
            Feedback will be shared with the presenter after the event.
          </p>
        </form>
      )}
    </div>
  );
}
