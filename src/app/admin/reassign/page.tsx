'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, UserCog, Save, CheckCircle2, ArrowLeft, Users } from 'lucide-react';
import { AdminGate } from '@/components/auth-gate';
import { loadState, updatePresenter } from '@/lib/storage';
import { Presenter, Judge, SESSION_TIMES } from '@/lib/types';
import { formatPresenterName } from '@/lib/utils';

// Committee members who can step in for conflicts
const COMMITTEE_MEMBERS = [
  'Committee Member 1',
  'Committee Member 2',
  'Committee Member 3',
  'Committee Member 4',
  'Committee Member 5',
  'Committee Member 6',
  'Committee Member 7',
  'Committee Member 8',
];

function ReassignContent() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresenter, setSelectedPresenter] = useState<Presenter | null>(null);
  const [editedJudges, setEditedJudges] = useState<{
    judge1: string | null;
    judge2: string | null;
    judge3: string | null;
  }>({ judge1: null, judge2: null, judge3: null });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filterSession, setFilterSession] = useState<string>('all');

  const loadData = useCallback(() => {
    const state = loadState();
    setPresenters(state.presenters);

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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // All available judge names (existing + committee members)
  const allJudgeOptions = useMemo(() => {
    const existingNames = judges.map(j => j.name);
    const allNames = [...new Set([...existingNames, ...COMMITTEE_MEMBERS])];
    return allNames.sort((a, b) => a.localeCompare(b));
  }, [judges]);

  // Filter presenters by search and session
  const filteredPresenters = useMemo(() => {
    return presenters.filter(p => {
      // Session filter
      if (filterSession !== 'all' && p.presentationTime !== filterSession) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const id = p.id.toLowerCase();
        return fullName.includes(query) || id.includes(query);
      }
      return true;
    });
  }, [presenters, searchQuery, filterSession]);

  const handlePresenterSelect = (presenter: Presenter) => {
    setSelectedPresenter(presenter);
    setEditedJudges({
      judge1: presenter.judge1,
      judge2: presenter.judge2,
      judge3: presenter.judge3,
    });
    setSaveSuccess(false);
  };

  const handleJudgeChange = (slot: 'judge1' | 'judge2' | 'judge3', value: string) => {
    setEditedJudges(prev => ({
      ...prev,
      [slot]: value || null,
    }));
    setSaveSuccess(false);
  };

  const handleSave = () => {
    if (!selectedPresenter) return;

    const updatedPresenter: Presenter = {
      ...selectedPresenter,
      judge1: editedJudges.judge1,
      judge2: editedJudges.judge2,
      judge3: editedJudges.judge3,
    };

    updatePresenter(updatedPresenter);
    setSelectedPresenter(updatedPresenter);
    setSaveSuccess(true);
    loadData(); // Refresh the list

    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const hasChanges = selectedPresenter && (
    editedJudges.judge1 !== selectedPresenter.judge1 ||
    editedJudges.judge2 !== selectedPresenter.judge2 ||
    editedJudges.judge3 !== selectedPresenter.judge3
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </a>
            <h2 className="text-2xl font-bold text-gray-900">Reassign Judges</h2>
          </div>
          <p className="text-gray-600 mt-1 ml-8">
            Handle conflicts of interest by reassigning judges to presenters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Presenter Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Presenter</h3>

          {/* Search and Filter */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-transparent"
              />
            </div>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-transparent"
            >
              <option value="all">All Sessions</option>
              {SESSION_TIMES.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Presenter List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredPresenters.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No presenters found
              </div>
            ) : (
              filteredPresenters.map(presenter => (
                <button
                  key={presenter.id}
                  onClick={() => handlePresenterSelect(presenter)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedPresenter?.id === presenter.id ? 'bg-csu-green/10 border-l-4 border-csu-green' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm">
                      {presenter.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {formatPresenterName(presenter.firstName, presenter.lastName)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {presenter.presentationTime} - {presenter.presentationType}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {filteredPresenters.length} presenter{filteredPresenters.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Right: Judge Assignment Editor */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {!selectedPresenter ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <UserCog className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select a Presenter</h3>
              <p className="text-gray-500 mt-2">
                Choose a presenter from the list to view and edit their judge assignments.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatPresenterName(selectedPresenter.firstName, selectedPresenter.lastName)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {selectedPresenter.id} - {selectedPresenter.presentationType}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedPresenter.presentationTime}
                </p>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-800">Judge assignments saved successfully!</span>
                </div>
              )}

              {/* Judge Assignments */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judge 1
                  </label>
                  <select
                    value={editedJudges.judge1 || ''}
                    onChange={(e) => handleJudgeChange('judge1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-transparent"
                  >
                    <option value="">-- Not Assigned --</option>
                    {allJudgeOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {selectedPresenter.judge1 !== editedJudges.judge1 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Changed from: {selectedPresenter.judge1 || '(none)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judge 2
                  </label>
                  <select
                    value={editedJudges.judge2 || ''}
                    onChange={(e) => handleJudgeChange('judge2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-transparent"
                  >
                    <option value="">-- Not Assigned --</option>
                    {allJudgeOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {selectedPresenter.judge2 !== editedJudges.judge2 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Changed from: {selectedPresenter.judge2 || '(none)'}
                    </p>
                  )}
                </div>

                {/* Judge 3 only for Undergrad Posters */}
                {selectedPresenter.presentationType === 'Undergrad Poster' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Judge 3
                    </label>
                    <select
                      value={editedJudges.judge3 || ''}
                      onChange={(e) => handleJudgeChange('judge3', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-csu-green focus:border-transparent"
                    >
                      <option value="">-- Not Assigned --</option>
                      {allJudgeOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {selectedPresenter.judge3 !== editedJudges.judge3 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Changed from: {selectedPresenter.judge3 || '(none)'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Committee Members Info */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Committee Members Available</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Committee Member 1-8 are available as replacement judges for conflicts of interest.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    hasChanges
                      ? 'bg-csu-green text-white hover:bg-csu-green/90'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-5 w-5" />
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReassignPage() {
  return (
    <AdminGate>
      <ReassignContent />
    </AdminGate>
  );
}
