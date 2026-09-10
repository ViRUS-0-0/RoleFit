import React, { useState } from 'react';
import {
  FIXED_ROLES,
  validateProfile,
  evaluateAll,
  getCounts,
  type RawProfileInput,
  type EvaluationResult,
  type EligibilityCounts,
  type ValidationErrorCode,
} from './core/evaluator.ts';

// Baseline default student profile from specification
const BUILT_IN_PROFILE: RawProfileInput = {
  branch: 'CSE',
  cgpa: '8.1',
  graduationYear: '2027',
  activeBacklogs: '1',
  skills: 'Git, Python, SQL',
};

interface ResultsViewProps {
  results: EvaluationResult[];
}

/**
 * Detailed List View representation of evaluation results.
 */
function ResultsListView({ results }: ResultsViewProps) {
  return (
    <div className="space-y-4">
      {results.map((item) => {
        const isEligible = item.status === 'ELIGIBLE';
        return (
          <div
            key={item.roleId}
            className={`rounded-xl border p-4 transition-all ${
              isEligible
                ? 'bg-emerald-50/30 border-emerald-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.roleId}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.roleTitle}
                  </h3>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                  isEligible
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {item.status}
              </span>
            </div>

            {/* Failure Reasons Details */}
            {!isEligible && item.failureReasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-bold tracking-wider text-rose-700 uppercase mb-1.5">
                  Unmet Criteria ({item.failureReasons.length})
                </h4>
                <ul className="space-y-1">
                  {item.failureReasons.map((reason, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-700 flex items-start space-x-1.5 font-mono"
                    >
                      <span className="text-rose-400 select-none">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact Card View representation of evaluation results in a responsive grid.
 */
function ResultsCardView({ results }: ResultsViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {results.map((item) => {
        const isEligible = item.status === 'ELIGIBLE';
        return (
          <div
            key={item.roleId}
            className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
              isEligible
                ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.roleId}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    isEligible
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-3">
                {item.roleTitle}
              </h3>
            </div>

            {/* Failure Reasons Details in compact tags */}
            {!isEligible && item.failureReasons.length > 0 && (
              <div className="mt-2 pt-2.5 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1.5">
                  Failed Requirements ({item.failureReasons.length})
                </div>
                <div className="flex flex-col gap-1">
                  {item.failureReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded break-all"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  // Controlled form input state
  const [profile, setProfile] = useState<RawProfileInput>(BUILT_IN_PROFILE);

  // In-memory evaluation outputs (cleared upon validation error)
  const [validationError, setValidationError] = useState<ValidationErrorCode | null>(null);
  const [results, setResults] = useState<EvaluationResult[] | null>(null);
  const [counts, setCounts] = useState<EligibilityCounts | null>(null);

  // Presentation view mode toggle: defaults to 'list'
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  /**
   * Evaluates the given profile using pure functions from Phase 1.
   * Clears results and counts if validation fails.
   */
  const handleEvaluate = (targetProfile: RawProfileInput = profile) => {
    const error = validateProfile(targetProfile);
    if (error) {
      setValidationError(error);
      setResults(null);
      setCounts(null);
    } else {
      setValidationError(null);
      const evalResults = evaluateAll(targetProfile);
      setResults(evalResults);
      setCounts(getCounts(evalResults));
    }
  };

  /**
   * Restores built-in default profile and triggers immediate evaluation.
   */
  const handleSample = () => {
    setProfile(BUILT_IN_PROFILE);
    handleEvaluate(BUILT_IN_PROFILE);
  };

  /**
   * Reset is functionally identical to Sample per Phase 0 documented assumptions.
   */
  const handleReset = () => {
    setProfile(BUILT_IN_PROFILE);
    handleEvaluate(BUILT_IN_PROFILE);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Role<span className="text-indigo-600">Fit</span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              SI26_P06
            </span>
          </div>
          <div className="text-sm text-slate-600">
            Career Fair Eligibility Shortlist
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Student Profile & Fixed Requirements (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Student Profile Form Panel */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Student Profile</h2>
                <span className="text-xs text-slate-600 font-medium">Editable Inputs</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEvaluate();
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="branch" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Branch / Department
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={profile.branch}
                    onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    placeholder="e.g. CSE, IT, ECE"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cgpa" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      CGPA (0.0 - 10.0)
                    </label>
                    <input
                      id="cgpa"
                      type="text"
                      value={profile.cgpa}
                      onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })}
                      placeholder="e.g. 8.1"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="gradYear" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Graduation Year
                    </label>
                    <input
                      id="gradYear"
                      type="text"
                      value={profile.graduationYear}
                      onChange={(e) => setProfile({ ...profile, graduationYear: e.target.value })}
                      placeholder="e.g. 2027"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="backlogs" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Active Backlogs
                  </label>
                  <input
                    id="backlogs"
                    type="text"
                    value={profile.activeBacklogs}
                    onChange={(e) => setProfile({ ...profile, activeBacklogs: e.target.value })}
                    placeholder="e.g. 0"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Skills (Comma-separated)
                  </label>
                  <textarea
                    id="skills"
                    rows={3}
                    value={profile.skills}
                    onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                    placeholder="e.g. Git, Python, SQL"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 resize-none"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Trimmed, case-insensitive, and deduplicated upon evaluation.
                  </p>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEvaluate()}
                    className="flex-1 min-w-[120px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Evaluate
                  </button>
                  <button
                    type="button"
                    onClick={handleSample}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Sample
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </section>

            {/* 2. Fixed Role Requirements Reference Panel */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Career Fair Roles Reference</h2>
                <span className="text-xs text-slate-600 font-medium">5 Fixed Requisitions</span>
              </div>
              
              <div className="space-y-3">
                {FIXED_ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-700">{role.id}</span>
                      <span className="text-xs font-semibold text-slate-700">Min CGPA: {role.minCgpa.toFixed(1)}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mb-2">{role.title}</div>
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600 mb-2">
                      <div>
                        <span className="text-slate-600">Branches:</span> {role.allowedBranches.join(', ')}
                      </div>
                      <div>
                        <span className="text-slate-600">Years:</span> {role.allowedGraduationYears.join(', ')}
                      </div>
                      <div>
                        <span className="text-slate-600">Max Backlogs:</span> {role.maxActiveBacklogs}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-1.5 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Validation Banner, Summary Counts & Results Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Validation Message Area */}
            {validationError && (
              <div
                role="alert"
                className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-xs"
              >
                <div className="flex items-start">
                  <div className="ml-1">
                    <h3 className="text-sm font-bold text-rose-800">
                      Validation Error: {validationError}
                    </h3>
                    <p className="mt-1 text-xs text-rose-700">
                      Please correct the highlighted input field before evaluating. All previously displayed results and counters have been cleared.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Counts Summary Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Eligibility Status Summary</h3>
                <p className="text-xs text-slate-600 mt-0.5">Automated multi-criteria evaluation outcome</p>
              </div>

              <div className="flex items-center space-x-3">
                {counts ? (
                  <>
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold">
                      <span>{counts.eligible}</span>
                      <span className="text-xs font-normal text-emerald-600">Eligible</span>
                    </div>
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-semibold">
                      <span>{counts.ineligible}</span>
                      <span className="text-xs font-normal text-rose-600">Ineligible</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-medium text-slate-600 px-3 py-1.5 bg-slate-100 rounded-lg">
                    — No evaluation active
                  </div>
                )}
              </div>
            </div>

            {/* Role Results Panel (with View Mode Toggle) */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <h2 className="text-base font-semibold text-slate-900">Evaluation Results</h2>
                  {results && (
                    <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {results.length} Roles
                    </span>
                  )}
                </div>

                {/* View Toggle Control */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      viewMode === 'card'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cards
                  </button>
                </div>
              </div>

              {!results ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-600">
                    {validationError
                      ? 'Results cleared due to invalid profile input.'
                      : 'No evaluation has run yet. Click "Evaluate" to screen the candidate or "Sample" to load defaults.'}
                  </p>
                </div>
              ) : viewMode === 'card' ? (
                <ResultsCardView results={results} />
              ) : (
                <ResultsListView results={results} />
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
