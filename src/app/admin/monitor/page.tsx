'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { AdminGate } from '@/components/auth-gate';
import { loadState } from '@/lib/storage';
import { Presenter, Score, SESSION_TIMES, SessionTime } from '@/lib/types';
import { formatPresenterName } from '@/lib/utils';

interface PendingScore {
  presenterId: string;
  presenterName: string;
  judgeName: string;
  sessionTime: SessionTime;
  presentationType: string;
}

function MonitorContent() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filterSession, setFilterSession] = useState<SessionTime | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = useCallback(() => {
    const state = loadState();
    setPresenters(state.presenters);
    setScores(state.scores);
    setIsLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds when enabled
    if (autoRefresh) {
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [loadData, autoRefresh]);

  // Calculate all pending scores
  const getPendingScores = (): PendingScore[] => {
    const pending: PendingScore[] = [];

    for (const presenter of presenters) {
      const presenterScores = scores.filter(s => s.presenterId === presenter.id);
      const scoredJudges = new Set(presenterScores.map(s => s.judgeName.toLowerCase()));

      // Check each assigned judge
      const assignedJudges = [presenter.judge1, presenter.judge2, presenter.judge3]
        .filter((j): j is string => j !== null && j.length > 0);

      for (const judgeName of assignedJudges) {
        if (!scoredJudges.has(judgeName.toLowerCase())) {
          pending.push({
            presenterId: presenter.id,
            presenterName: formatPresenterName(presenter.firstName, presenter.lastName),
            judgeName: judgeName,
            sessionTime: presenter.presentationTime,
            presentationType: presenter.presentationType,
          });
        }
      }
    }

    // Sort by session time, then by judge name
    const sessionOrder = { '10:15 - 11:15': 0, '11:30 - 1:30': 1, '1:45 - 3:45': 2 };
    pending.sort((a, b) => {
      const sessionDiff = sessionOrder[a.sessionTime] - sessionOrder[b.sessionTime];
      if (sessionDiff !== 0) return sessionDiff;
      return a.judgeName.localeCompare(b.judgeName);
    });

    return pending;
  };

  const pendingScores = getPendingScores();
  const filteredPending = filterSession === 'all'
    ? pendingScores
    : pendingScores.filter(p => p.sessionTime === filterSession);

  // Group by judge for the summary view
  const pendingByJudge = filteredPending.reduce((acc, p) => {
    if (!acc[p.judgeName]) {
      acc[p.judgeName] = [];
    }
    acc[p.judgeName].push(p);
    return acc;
  }, {} as Record<string, PendingScore[]>);

  // Get all judges (for showing completed judges too)
  const allJudges = new Set<string>();
  const filteredPresenters = filterSession === 'all'
    ? presenters
    : presenters.filter(p => p.presentationTime === filterSession);

  for (const presenter of filteredPresenters) {
    [presenter.judge1, presenter.judge2, presenter.judge3]
      .filter((j): j is string => j !== null && j.length > 0)
      .forEach(j => allJudges.add(j));
  }

  // Create complete judge list with pending scores (empty array if complete)
  const allJudgesWithStatus = Array.from(allJudges).map(judgeName => ({
    judgeName,
    pending: pendingByJudge[judgeName] || [],
    isComplete: !pendingByJudge[judgeName] || pendingByJudge[judgeName].length === 0,
  }));

  // Count by session
  const countBySession = SESSION_TIMES.map(session => ({
    session,
    count: pendingScores.filter(p => p.sessionTime === session).length,
  }));

  const totalPending = pendingScores.length;
  const totalExpected = presenters.reduce((sum, p) => {
    return sum + (p.presentationType === 'Undergrad Poster' ? 3 : 2);
  }, 0);
  const totalReceived = totalExpected - totalPending;

  if (presenters.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Loaded</h3>
        <p className="mt-2 text-sm text-gray-500">
          Upload presenter data on the Dashboard first.
        </p>
        <a
          href="/admin"
          className="mt-4 inline-flex items-center px-4 py-2 bg-csu-green text-white rounded-md hover:bg-csu-green/90"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Score Monitor</h2>
          <p className="text-gray-600 mt-1">
            Track pending scores in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-csu-green focus:ring-csu-green"
            />
            Auto-refresh (10s)
          </label>
          <button
            onClick={loadData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pending</p>
              <p className="text-3xl font-bold text-red-600">{totalPending}</p>
            </div>
            <Clock className="h-10 w-10 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Scores Received</p>
              <p className="text-3xl font-bold text-green-600">{totalReceived}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completion</p>
              <p className="text-3xl font-bold text-gray-900">
                {totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0}%
              </p>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#1E4D2B"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(totalReceived / totalExpected) * 176} 176`}
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm font-medium text-gray-500 mb-2">By Session</p>
          <div className="space-y-1">
            {countBySession.map(({ session, count }) => (
              <div key={session} className="flex justify-between text-sm">
                <span className="text-gray-600">{session}</span>
                <span className={count > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {count} pending
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Filter by session:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterSession('all')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              filterSession === 'all'
                ? 'bg-csu-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Sessions
          </button>
          {SESSION_TIMES.map((session) => (
            <button
              key={session}
              onClick={() => setFilterSession(session)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filterSession === session
                  ? 'bg-csu-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {session}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* All Complete Message */}
      {filteredPending.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-xl font-semibold text-green-800">
            {filterSession === 'all' ? 'All Scores Received!' : `${filterSession} Complete!`}
          </h3>
          <p className="mt-2 text-green-600">
            {filterSession === 'all'
              ? 'Every judge has submitted all their scores.'
              : 'All scores for this session have been submitted.'}
          </p>
        </div>
      )}

      {/* Scores by Judge */}
      {allJudgesWithStatus.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Scores by Judge ({allJudgesWithStatus.filter(j => !j.isComplete).length} pending, {allJudgesWithStatus.filter(j => j.isComplete).length} complete)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allJudgesWithStatus
              .sort((a, b) => {
                // Sort: pending judges first (by last name), then complete judges (by last name)
                const getLastName = (name: string) => name.split(' ').pop() || name;
                if (a.isComplete !== b.isComplete) {
                  return a.isComplete ? 1 : -1; // Pending first
                }
                return getLastName(a.judgeName).localeCompare(getLastName(b.judgeName));
              })
              .map(({ judgeName, pending, isComplete }) => (
                <div key={judgeName} className={`bg-white rounded-lg shadow-sm border overflow-hidden ${isComplete ? 'border-green-200 opacity-75' : 'border-gray-200'}`}>
                  <div className={`px-4 py-3 border-b ${isComplete ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{judgeName}</h4>
                      {isComplete ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {pending.length} pending
                        </span>
                      )}
                    </div>
                  </div>
                  {!isComplete && (
                    <ul className="divide-y divide-gray-100">
                      {pending.map((p) => (
                        <li key={`${p.presenterId}-${p.judgeName}`} className="px-4 py-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {p.presenterName}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {p.presenterId}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                {p.presentationType}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {p.sessionTime}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Full List View (collapsible) */}
      {filteredPending.length > 0 && (
        <details className="bg-white rounded-lg shadow-sm">
          <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-medium text-gray-900">
            View Full Pending List ({filteredPending.length} scores)
          </summary>
          <div className="border-t">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Judge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Presenter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPending.map((p) => (
                  <tr key={`${p.presenterId}-${p.judgeName}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.sessionTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.judgeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {p.presenterName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.presenterId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {p.presentationType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export default function MonitorPage() {
  return (
    <AdminGate>
      <MonitorContent />
    </AdminGate>
  );
}
