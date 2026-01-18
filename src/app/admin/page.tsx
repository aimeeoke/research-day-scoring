'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCw, Users, Award, FileText, ChevronRight, Trash2 } from 'lucide-react';
import { AdminGate } from '@/components/auth-gate';
import { parsePresenterCSV } from '@/lib/csv-parser';
import {
  loadState,
  savePresenters,
  saveJudges,
  downloadBackup,
  getScores,
  getPresenters,
  getJudges,
  clearScores,
} from '@/lib/storage';
import {
  getCategoryCompletionPercent,
  generateAllFinalScores,
  getAllCategoryWinners,
  getGoldenPipetteWinner,
} from '@/lib/calculations';
import { AWARD_CATEGORIES, SESSION_TIMES, Presenter, Score } from '@/lib/types';
import { formatPercent, getProgressColor, formatPresenterName } from '@/lib/utils';

function DashboardContent() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(() => {
    const state = loadState();
    setPresenters(state.presenters);
    setScores(state.scores);
    setIsLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    try {
      const text = await file.text();
      const { presenters: parsed, judges, errors } = parsePresenterCSV(text);

      if (errors.length > 0) {
        setUploadError(`Import warnings: ${errors.slice(0, 3).join('; ')}`);
      }

      if (parsed.length > 0) {
        savePresenters(parsed);
        saveJudges(judges);
        loadData();
      }
    } catch (error) {
      setUploadError('Failed to parse CSV file. Please check the format.');
    }
  };

  // Calculate session progress
  const getSessionProgress = (sessionTime: string) => {
    const sessionPresenters = presenters.filter(p => p.presentationTime === sessionTime);
    let totalRequired = 0;
    let totalReceived = 0;

    for (const presenter of sessionPresenters) {
      const requiredJudges = presenter.presentationType === 'Undergrad Poster' ? 3 : 2;
      totalRequired += requiredJudges;
      const presenterScores = scores.filter(s => s.presenterId === presenter.id && !s.isNoShow);
      totalReceived += Math.min(presenterScores.length, requiredJudges);
    }

    const percent = totalRequired > 0 ? (totalReceived / totalRequired) * 100 : 0;
    return {
      total: sessionPresenters.length,
      scoresReceived: totalReceived,
      scoresRequired: totalRequired,
      percent,
    };
  };

  // Get quick stats
  const totalPresenters = presenters.length;
  const totalScores = scores.length;
  const uniqueJudgesScored = new Set(scores.map(s => s.judgeId)).size;

  const dataLoaded = presenters.length > 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Real-time overview of Research Day scoring progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          {dataLoaded && (
            <button
              onClick={downloadBackup}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </button>
          )}
        </div>
      </div>

      {/* Upload Section (if no data) */}
      {!dataLoaded && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Presenter Data</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload your CSV file with presenter and judge assignments to get started.
            </p>
            <div className="mt-6">
              <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-csu-green hover:bg-csu-green/90 cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Select CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {uploadError && (
              <p className="mt-4 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Content (if data loaded) */}
      {dataLoaded && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-csu-green" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Presenters</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPresenters}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Scores Entered</p>
                  <p className="text-2xl font-bold text-gray-900">{totalScores}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Judges Scored</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueJudgesScored}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-csu-gold" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{AWARD_CATEGORIES.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Progress */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Progress</h3>
            <div className="space-y-4">
              {SESSION_TIMES.map((session) => {
                const progress = getSessionProgress(session);
                return (
                  <div key={session} className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700">{session}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-csu-green transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-20 text-right text-sm font-medium ${getProgressColor(progress.percent)}`}>
                      {formatPercent(progress.percent)}
                    </div>
                    <div className="w-32 text-right text-sm text-gray-500">
                      {progress.scoresReceived} / {progress.scoresRequired} scores
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Judge Scoring</h3>
                  <p className="text-sm text-gray-500 mt-1">Enter scores for assigned presenters</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-csu-green" />
              </div>
            </a>
            <a
              href="/comments"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Judge Comments</h3>
                  <p className="text-sm text-gray-500 mt-1">Enter feedback for presenters</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-csu-green" />
              </div>
            </a>
            <a
              href="/admin/monitor"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group border-2 border-orange-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Score Monitor</h3>
                  <p className="text-sm text-gray-500 mt-1">Track pending judge scores</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500" />
              </div>
            </a>
            <a
              href="/admin/results"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group border-2 border-csu-gold"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Award Results</h3>
                  <p className="text-sm text-gray-500 mt-1">View winners by category</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-csu-gold" />
              </div>
            </a>
          </div>

          {/* Re-upload option */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalPresenters} presenters loaded</span>
              <span className="mx-2">•</span>
              <span>Last refreshed: {lastRefresh.toLocaleTimeString()}</span>
            </div>
            <label className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Update CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Admin Actions - Clear Scores */}
          {totalScores > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-red-800">Reset Testing Data</h4>
                  <p className="text-sm text-red-600 mt-1">
                    Clear all {totalScores} scores and feedback. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete all ${totalScores} scores? This cannot be undone.`)) {
                      clearScores();
                      loadData();
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Scores
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGate>
      <DashboardContent />
    </AdminGate>
  );
}
