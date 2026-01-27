'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { loadStateFromCloud } from '@/lib/storage';
import { PRESENTERS } from '@/lib/data';
import {
  generateAllFinalScores,
  getAllCategoryWinners,
  getGoldenPipetteWinner,
  getCategoryCompletionPercent,
  calculateDepartmentScores,
} from '@/lib/calculations';
import { AWARD_CATEGORIES, DEPARTMENTS, Presenter, Score, CategoryWinner, DepartmentScore } from '@/lib/types';
import { formatPresenterName } from '@/lib/utils';
import { getWinnerDetail } from '@/lib/winner-details';
import Link from 'next/link';

export default function PublicResultsPage() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'category' | 'department'>('category');

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csu-green"></div>
      </div>
    );
  }

  if (presenters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
          <p className="mt-2 text-sm text-gray-500">
            Results are not available yet.
          </p>
        </div>
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

  const renderWinnerCard = (winner: CategoryWinner, subtitle?: string) => {
    const detail = getWinnerDetail(winner.presenter.lastName, winner.presenter.firstName);
    const mentors = detail
      ? [detail.mentor1, detail.mentor2].filter(Boolean).join(' & ')
      : null;

    return (
      <div className="py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getPlaceIcon(winner.place)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPlaceColor(winner.place)}`}>
                {winner.place === 1 ? '1st' : winner.place === 2 ? '2nd' : '3rd'}
              </span>
              {detail && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {detail.level}
                </span>
              )}
            </div>
            <p className="font-medium text-gray-900 mt-1">
              {formatPresenterName(winner.presenter.firstName, winner.presenter.lastName)}
            </p>
            <p className="text-sm text-gray-500 line-clamp-2">
              {winner.presenter.title}
            </p>
            {mentors && (
              <p className="text-xs text-gray-500 mt-1">
                Mentor{detail!.mentor2 ? 's' : ''}: {mentors}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const overallCompletion = categoryCompletion.reduce((acc, c) => acc + c.percent, 0) / categoryCompletion.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-csu-green text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Research Day 2026 Results</h1>
          <p className="text-green-100 mt-1">CVMBS Award Winners</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
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

        {/* View Toggle + Winners */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Winners</h3>
            <div className="inline-flex rounded-lg border border-gray-300 bg-white">
              <button
                onClick={() => setViewMode('category')}
                className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'category'
                    ? 'bg-csu-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setViewMode('department')}
                className={`px-3 py-1.5 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'department'
                    ? 'bg-csu-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                By Department
              </button>
            </div>
          </div>

          {viewMode === 'department' && (() => {
            // Group all winners by department
            const winnersByDept = new Map<string, { category: string; winner: CategoryWinner }[]>();
            for (const dept of DEPARTMENTS) {
              winnersByDept.set(dept, []);
            }
            categoryCompletion.forEach(({ category, winners }) => {
              winners.forEach(winner => {
                const dept = winner.presenter.department || 'Other';
                const list = winnersByDept.get(dept) || [];
                list.push({ category: category.name, winner });
                winnersByDept.set(dept, list);
              });
            });

            return (
              <div className="space-y-4">
                {Array.from(winnersByDept.entries()).map(([dept, entries]) => {
                  const isExpanded = expandedCategories.has(`dept-${dept}`);
                  return (
                    <div key={dept} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleCategory(`dept-${dept}`)}
                        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <Award className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${entries.length > 0 ? 'text-csu-green' : 'text-gray-400'}`} />
                          <div className="text-left min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">{dept}</h4>
                            <span className="text-xs text-gray-500">
                              {entries.length} winner{entries.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-4 border-t border-gray-100">
                          {entries.length === 0 ? (
                            <p className="py-4 text-gray-500 text-center text-sm">
                              No winners from this department.
                            </p>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {entries.map(({ category, winner }) => (
                                <div key={`${winner.presenter.id}-${winner.place}-${category}`}>
                                  {renderWinnerCard(winner, category)}
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
            );
          })()}

          {viewMode === 'category' && categoryCompletion.map(({ category, percent, winners }) => {
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
                        No winners in this category.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {winners.map((winner) => (
                          <div key={`${winner.presenter.id}-${winner.place}`}>
                            {renderWinnerCard(winner, winner.presenter.department || undefined)}
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
        <div className="bg-white rounded-lg shadow-sm p-4">
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

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>CVMBS Research Day 2026</p>
          <p className="mt-1">Colorado State University</p>
        </div>
      </main>
    </div>
  );
}
