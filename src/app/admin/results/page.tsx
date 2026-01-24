'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Download, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminGate } from '@/components/auth-gate';
import { loadStateFromCloud } from '@/lib/storage';
import { PRESENTERS } from '@/lib/data';
import {
  generateAllFinalScores,
  getAllCategoryWinners,
  getGoldenPipetteWinner,
  getCategoryCompletionPercent,
  calculateDepartmentScores,
} from '@/lib/calculations';
import { AWARD_CATEGORIES, Presenter, Score, CategoryWinner, DepartmentScore } from '@/lib/types';
import { formatPresenterName } from '@/lib/utils';

function ResultsContent() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setPresenters(PRESENTERS);
      const state = await loadStateFromCloud();
      setScores(state.scores);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
        <p className="mt-2 text-sm text-gray-500">
          Presenter data hasn't been loaded yet.
        </p>
      </div>
    );
  }

  // Calculate all results
  const allWinners = getAllCategoryWinners(presenters, scores);
  const goldenPipette = getGoldenPipetteWinner(presenters, scores);
  const departmentScores = calculateDepartmentScores(generateAllFinalScores(presenters, scores));

  // Calculate category completion
  const categoryCompletion = AWARD_CATEGORIES.map(cat => ({
    category: cat,
    percent: getCategoryCompletionPercent(cat, presenters, scores),
    winners: allWinners.get(cat.id) || [],
  }));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Export results to CSV
  const exportResultsCSV = () => {
    const rows: string[][] = [
      ['Category', 'Place', 'Presenter ID', 'Presenter Name', 'Final Score'],
    ];

    for (const { category, winners } of categoryCompletion) {
      if (winners.length === 0) {
        rows.push([category.name, 'No winners yet', '', '', '']);
      } else {
        for (const winner of winners) {
          rows.push([
            category.name,
            winner.place === 1 ? '1st' : winner.place === 2 ? '2nd' : '3rd',
            winner.presenter.id,
            formatPresenterName(winner.presenter.firstName, winner.presenter.lastName),
            winner.finalScore.toFixed(4),
          ]);
        }
      }
    }

    // Add Golden Pipette
    rows.push([]);
    rows.push(['Golden Pipette Award']);
    if (goldenPipette) {
      rows.push([goldenPipette.department, '', '', `${goldenPipette.presenterCount} presenters`, goldenPipette.averageScore.toFixed(4)]);
    }

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-day-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPlaceColor = (place: number) => {
    switch (place) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3: return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPlaceIcon = (place: number) => {
    return place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
  };

  const overallCompletion = categoryCompletion.reduce((acc, c) => acc + c.percent, 0) / categoryCompletion.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Award Results</h2>
          <p className="text-gray-600 mt-1">
            Category winners and final standings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportResultsCSV}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-csu-green hover:bg-csu-green/90"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Scoring Progress</h3>
          <span className={`text-lg font-bold ${overallCompletion === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
            {overallCompletion.toFixed(1)}%
          </span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${overallCompletion === 100 ? 'bg-green-500' : 'bg-csu-green'}`}
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
        {overallCompletion < 100 && (
          <p className="mt-2 text-sm text-yellow-600">
            Some categories are still missing scores. Winners shown are based on current data.
          </p>
        )}
      </div>

      {/* Golden Pipette Award */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-yellow-800">Golden Pipette Award</h3>
              <p className="text-yellow-700 text-xs sm:text-sm">Highest average score by department</p>
            </div>
          </div>
          {goldenPipette ? (
            <div className="sm:ml-auto sm:text-right bg-yellow-100 rounded-lg p-3 sm:bg-transparent sm:p-0">
              <p className="text-xl sm:text-2xl font-bold text-yellow-800">{goldenPipette.department || 'Unknown Department'}</p>
              <p className="text-sm text-yellow-700">
                Avg: {goldenPipette.averageScore.toFixed(2)} ({goldenPipette.presenterCount} presenters)
              </p>
            </div>
          ) : (
            <p className="text-yellow-700">Not enough data yet</p>
          )}
        </div>

        {/* Department Rankings */}
        {departmentScores.length > 1 && (
          <div className="mt-4 pt-4 border-t border-yellow-200">
            <p className="text-sm font-medium text-yellow-800 mb-2">All Departments:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {departmentScores.slice(0, 6).map((dept, idx) => (
                <div key={dept.department} className="flex items-center justify-between text-sm">
                  <span className={`${idx === 0 ? 'font-bold text-yellow-800' : 'text-yellow-700'}`}>
                    {idx + 1}. {dept.department || 'Unknown'}
                  </span>
                  <span className="text-yellow-600">
                    {dept.averageScore.toFixed(2)} ({dept.presenterCount})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Winners */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Category Winners</h3>

        {categoryCompletion.map(({ category, percent, winners }) => {
          const isExpanded = expandedCategories.has(category.id);
          const isComplete = percent === 100;

          return (
            <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <Award className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${isComplete ? 'text-csu-green' : 'text-gray-400'}`} />
                  <div className="text-left min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">{category.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {category.places} places
                      </span>
                      {isComplete ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 sm:hidden">
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 sm:hidden">{percent.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  {isComplete ? (
                    <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-sm text-gray-500">{percent.toFixed(0)}% scored</span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Winners */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-4 border-t border-gray-100">
                  {winners.length === 0 ? (
                    <p className="py-4 text-gray-500 text-center text-sm">
                      No complete scores yet. Winners will appear once all judges have scored.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {winners.map((winner) => (
                        <div key={`${winner.presenter.id}-${winner.place}`} className="py-4">
                          {/* Mobile layout */}
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getPlaceIcon(winner.place)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPlaceColor(winner.place)}`}>
                                  {winner.place === 1 ? '1st' : winner.place === 2 ? '2nd' : '3rd'}
                                </span>
                                <span className="font-mono text-sm font-bold text-gray-900">
                                  {winner.finalScore.toFixed(2)}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900 mt-1">
                                {formatPresenterName(winner.presenter.firstName, winner.presenter.lastName)}
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {winner.presenter.title}
                              </p>
                              {winner.presenter.department && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {winner.presenter.department}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{presenters.length}</p>
            <p className="text-sm text-gray-500">Presenters</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{scores.length}</p>
            <p className="text-sm text-gray-500">Scores Entered</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{AWARD_CATEGORIES.length}</p>
            <p className="text-sm text-gray-500">Award Categories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {categoryCompletion.filter(c => c.percent === 100).length}
            </p>
            <p className="text-sm text-gray-500">Categories Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <AdminGate>
      <ResultsContent />
    </AdminGate>
  );
}
