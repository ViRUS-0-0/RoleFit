import React, { useState, useEffect } from 'react';
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
    <div className="space-y-3.5">
      {results.map((item) => {
        const isEligible = item.status === 'ELIGIBLE';
        return (
          <div
            key={item.roleId}
            className={`rounded-xl border p-4 transition-all ${
              isEligible
                ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {item.roleId}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.roleTitle}
                  </h3>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                  isEligible
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {item.status}
              </span>
            </div>

            {/* Failure Reasons Details */}
            {!isEligible && item.failureReasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold tracking-wider text-rose-700 dark:text-rose-400 uppercase mb-1.5">
                  Unmet Criteria ({item.failureReasons.length})
                </h4>
                <ul className="space-y-1">
                  {item.failureReasons.map((reason, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-1.5 font-mono"
                    >
                      <span className="text-rose-400 dark:text-rose-500 select-none">•</span>
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
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {item.roleId}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                    isEligible
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mb-3">
                {item.roleTitle}
              </h3>
            </div>

            {/* Failure Reasons Details in compact tags */}
            {!isEligible && item.failureReasons.length > 0 && (
              <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1.5">
                  Failed Requirements ({item.failureReasons.length})
                </div>
                <div className="flex flex-col gap-1">
                  {item.failureReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 px-2 py-1 rounded break-all"
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

  // Collapsible role items state (set of expanded role IDs)
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // In-memory Dark Mode state with system preference fallback
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Synchronize 'dark' class on HTML document root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const toggleRole = (roleId: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const allRolesExpanded = expandedRoles.size === FIXED_ROLES.length;

  const toggleAllRoles = () => {
    if (allRolesExpanded) {
      setExpandedRoles(new Set());
    } else {
      setExpandedRoles(new Set(FIXED_ROLES.map((r) => r.id)));
    }
  };

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-4 transition-colors duration-200">
      {/* Fixed Sticky Top Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Role<span className="text-indigo-600 dark:text-indigo-400">Fit</span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              SI26_P06
            </span>
          </div>

          {/* In-page section jump links */}
          <nav aria-label="Section Navigation" className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
            <a
              href="#profile-section"
              className="px-2.5 sm:px-3 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              Profile
            </a>
            <a
              href="#roles-section"
              className="px-2.5 sm:px-3 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              Roles
            </a>
            <a
              href="#results-section"
              className="px-2.5 sm:px-3 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              Results
            </a>
          </nav>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="hidden lg:block text-xs text-slate-500 dark:text-slate-400">
              Career Fair Eligibility Shortlist
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Student Profile & Compact Roles Reference (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. Student Profile Form Panel */}
            <section
              id="profile-section"
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs relative"
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Student Profile</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Editable Inputs</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEvaluate();
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="branch" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Branch / Department
                  </label>
                  <input
                    id="branch"
                    type="text"
                    value={profile.branch}
                    onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                    placeholder="e.g. CSE, IT, ECE"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="cgpa" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      CGPA (0.0 - 10.0)
                    </label>
                    <input
                      id="cgpa"
                      type="text"
                      value={profile.cgpa}
                      onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })}
                      placeholder="e.g. 8.1"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="gradYear" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      Graduation Year
                    </label>
                    <input
                      id="gradYear"
                      type="text"
                      value={profile.graduationYear}
                      onChange={(e) => setProfile({ ...profile, graduationYear: e.target.value })}
                      placeholder="e.g. 2027"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="backlogs" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Active Backlogs
                  </label>
                  <input
                    id="backlogs"
                    type="text"
                    value={profile.activeBacklogs}
                    onChange={(e) => setProfile({ ...profile, activeBacklogs: e.target.value })}
                    placeholder="e.g. 0"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Skills (Comma-separated)
                  </label>
                  <textarea
                    id="skills"
                    rows={2}
                    value={profile.skills}
                    onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                    placeholder="e.g. Git, Python, SQL"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition-colors"
                  />
                </div>

                {/* Sticky Actions Toolbar */}
                <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur pt-3 pb-0.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => handleEvaluate()}
                    className="flex-1 min-w-[110px] px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Evaluate
                  </button>
                  <button
                    type="button"
                    onClick={handleSample}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Sample
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </section>

            {/* 2. Compact & Collapsible Role Requirements Reference Panel */}
            <section
              id="roles-section"
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Career Fair Roles Reference</h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">5 Fixed Requisitions</span>
                </div>
                <button
                  type="button"
                  onClick={toggleAllRoles}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 transition-colors cursor-pointer"
                >
                  {allRolesExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
              
              {/* Compact Accordion Role Rows */}
              <div className="space-y-1.5">
                {FIXED_ROLES.map((role) => {
                  const isExpanded = expandedRoles.has(role.id);
                  return (
                    <div
                      key={role.id}
                      className={`rounded-lg border transition-all ${
                        isExpanded
                          ? 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Compact summary row (always visible) */}
                      <button
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className="w-full text-left px-3 py-2 flex items-center justify-between gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded shrink-0">
                            {role.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {role.title}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Min {role.minCgpa.toFixed(1)}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded criteria details */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-indigo-100 dark:border-indigo-900/40 space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Branches:</span>{' '}
                              <span className="font-medium">{role.allowedBranches.join(', ')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Years:</span>{' '}
                              <span className="font-medium">{role.allowedGraduationYears.join(', ')}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Max Backlogs:</span>{' '}
                              <span className="font-medium">{role.maxActiveBacklogs}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 dark:text-slate-400">Cutoff:</span>{' '}
                              <span className="font-medium">{role.minCgpa.toFixed(1)} CGPA</span>
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">
                              Required Skills
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {role.requiredSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* Right Column: Validation Banner, Summary Counts & Results Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Validation Message Area */}
            {validationError && (
              <div
                role="alert"
                className="bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-xs"
              >
                <div className="flex items-start">
                  <div className="ml-1">
                    <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                      Validation Error: {validationError}
                    </h3>
                    <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                      Please correct the highlighted input field before evaluating. All previously displayed results and counters have been cleared.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Counts Summary Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Eligibility Status Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated multi-criteria evaluation outcome</p>
              </div>

              <div className="flex items-center space-x-2.5">
                {counts ? (
                  <>
                    <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-bold">
                      <span>{counts.eligible}</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Eligible</span>
                    </div>
                    <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-sm font-bold">
                      <span>{counts.ineligible}</span>
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Ineligible</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    — No evaluation active
                  </div>
                )}
              </div>
            </div>

            {/* Role Results Panel (with View Mode Toggle) */}
            <section
              id="results-section"
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Evaluation Results</h2>
                  {results && (
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {results.length} Roles
                    </span>
                  )}
                </div>

                {/* View Toggle Control */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      viewMode === 'card'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Cards
                  </button>
                </div>
              </div>

              {!results ? (
                /* Compact Rebalanced Empty State */
                <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {validationError ? 'Input Correction Required' : 'Ready to Screen Candidate'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {validationError
                      ? 'Results cleared due to invalid profile input. Correct the highlighted errors to re-evaluate.'
                      : 'Click "Evaluate" to screen against all 5 roles, or click "Sample" to test the built-in profile.'}
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
