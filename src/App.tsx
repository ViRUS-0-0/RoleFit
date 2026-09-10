import React, { useState, useEffect, useRef } from 'react';
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

// Clean initial empty profile for clearing form state
const EMPTY_PROFILE: RawProfileInput = {
  branch: '',
  cgpa: '',
  graduationYear: '',
  activeBacklogs: '',
  skills: '',
};

interface ResultsViewProps {
  results: EvaluationResult[];
}

/**
 * Detailed List View representation of evaluation results with generous spacing.
 */
function ResultsListView({ results }: ResultsViewProps) {
  return (
    <div className="space-y-4">
      {results.map((item) => {
        const isEligible = item.status === 'ELIGIBLE';
        return (
          <div
            key={item.roleId}
            className={`rounded-xl border p-5 transition-all ${
              isEligible
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {item.roleId}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {item.roleTitle}
                </h3>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
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
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold tracking-wider text-rose-700 dark:text-rose-400 uppercase mb-2">
                  Unmet Criteria ({item.failureReasons.length})
                </h4>
                <ul className="space-y-1.5">
                  {item.failureReasons.map((reason, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-start space-x-2 font-mono"
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {results.map((item) => {
        const isEligible = item.status === 'ELIGIBLE';
        return (
          <div
            key={item.roleId}
            className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
              isEligible
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {item.roleId}
                </span>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug mb-3">
                {item.roleTitle}
              </h3>
            </div>

            {/* Failure Reasons Details in compact tags */}
            {!isEligible && item.failureReasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
                  Failed Requirements ({item.failureReasons.length})
                </div>
                <div className="flex flex-col gap-1.5">
                  {item.failureReasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 px-2.5 py-1 rounded break-all"
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

  // Active section for scroll-spy highlighting
  const [activeSection, setActiveSection] = useState<'profile' | 'roles' | 'results'>('profile');

  // In-memory Dark Mode state with system preference fallback
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Transient notification message for user actions (Sample, Reset)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (message: string) => {
    setActionFeedback(message);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

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

  // Scroll-spy intersection observer to update active header nav link
  useEffect(() => {
    const sectionIds = ['profile-section', 'roles-section', 'results-section'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.id === 'profile-section') setActiveSection('profile');
            else if (entry.target.id === 'roles-section') setActiveSection('roles');
            else if (entry.target.id === 'results-section') setActiveSection('results');
          }
        });
      },
      { rootMargin: '-20% 0px -55% 0px' }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Evaluates the given profile using pure functions from Phase 1.
   * Clears results and counts if validation fails.
   * Optionally auto-scrolls down to the Results section smoothly.
   */
  const handleEvaluate = (targetProfile: RawProfileInput = profile, shouldScroll = true) => {
    const error = validateProfile(targetProfile);
    if (error) {
      setValidationError(error);
      setResults(null);
      setCounts(null);
      if (shouldScroll) {
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    } else {
      setValidationError(null);
      const evalResults = evaluateAll(targetProfile);
      setResults(evalResults);
      setCounts(getCounts(evalResults));
      if (shouldScroll) {
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  };

  /**
   * Restores built-in default profile, clears validation errors,
   * immediately evaluates the profile, and shows confirmation feedback.
   */
  const handleSample = () => {
    setProfile({ ...BUILT_IN_PROFILE });
    setValidationError(null);
    const evalResults = evaluateAll(BUILT_IN_PROFILE);
    setResults(evalResults);
    setCounts(getCounts(evalResults));
    showFeedback('Sample defaults loaded & evaluated');
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  /**
   * Resets form fields to empty, clears screening results,
   * clears validation errors, and returns view to profile input.
   */
  const handleReset = () => {
    setProfile({ ...EMPTY_PROFILE });
    setValidationError(null);
    setResults(null);
    setCounts(null);
    showFeedback('Form and screening results reset');
    setTimeout(() => {
      document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Transient Action Feedback Toast */}
      {actionFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-xl border border-slate-700/60 dark:border-slate-200/60 text-xs font-semibold backdrop-blur-md transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-600 animate-pulse" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 1. Fixed Sticky Top Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Role<span className="text-indigo-600 dark:text-indigo-400">Fit</span>
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              SI26_P06
            </span>
          </div>

          {/* Smooth-scrolling in-page section navigation with active state */}
          <nav aria-label="Section Navigation" className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('profile-section')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === 'profile'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('roles-section')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === 'roles'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Roles
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('results-section')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSection === 'results'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Results
            </button>
          </nav>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
              Career Fair Eligibility Shortlist
            </span>

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

      {/* Main Single-Page Naturally Scrollable Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-28">
        
        {/* ========================================================================= */}
        {/* SECTION 1: Student Profile (Input)                                        */}
        {/* ========================================================================= */}
        <section id="profile-section" className="scroll-mt-24 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              01 · Input
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Profile</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1">
            Specify candidate academic parameters and verified competencies for screening.
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEvaluate();
              }}
              className="space-y-5"
            >
              <div>
                <label htmlFor="branch" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Branch / Department
                </label>
                <input
                  id="branch"
                  type="text"
                  value={profile.branch}
                  onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                  placeholder="e.g. CSE, IT, ECE"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="cgpa" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    CGPA (0.0 - 10.0)
                  </label>
                  <input
                    id="cgpa"
                    type="text"
                    value={profile.cgpa}
                    onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })}
                    placeholder="e.g. 8.1"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="gradYear" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Graduation Year
                  </label>
                  <input
                    id="gradYear"
                    type="text"
                    value={profile.graduationYear}
                    onChange={(e) => setProfile({ ...profile, graduationYear: e.target.value })}
                    placeholder="e.g. 2027"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="backlogs" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Active Backlogs
                </label>
                <input
                  id="backlogs"
                  type="text"
                  value={profile.activeBacklogs}
                  onChange={(e) => setProfile({ ...profile, activeBacklogs: e.target.value })}
                  placeholder="e.g. 0"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="skills" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Skills (Comma-separated)
                </label>
                <textarea
                  id="skills"
                  rows={3}
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  placeholder="e.g. Git, Python, SQL"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition-colors"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Skills are automatically trimmed, compared case-insensitively, and deduplicated during evaluation.
                </p>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleEvaluate()}
                  className="flex-1 min-w-[140px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  Evaluate Profile
                </button>
                <button
                  type="button"
                  onClick={handleSample}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Sample Defaults
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* ========================================================================= */}
        {/* SECTION 2: Career Fair Roles Reference (Context)                         */}
        {/* ========================================================================= */}
        <section id="roles-section" className="scroll-mt-24 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              02 · Reference
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Career Fair Roles Reference</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1">
            5 fixed requisitions used as the static eligibility baseline. Criteria are evaluated independently.
          </p>

          {/* Generous responsive grid of role cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FIXED_ROLES.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      {role.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Min {role.minCgpa.toFixed(1)} CGPA
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {role.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-400 dark:text-slate-500 shrink-0 font-medium">Branches:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{role.allowedBranches.join(', ')}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-400 dark:text-slate-500 shrink-0 font-medium">Years:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{role.allowedGraduationYears.join(', ')}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-400 dark:text-slate-500 shrink-0 font-medium">Max Backlogs:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{role.maxActiveBacklogs}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Required Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-slate-200 dark:border-slate-800" />

        {/* ========================================================================= */}
        {/* SECTION 3: Evaluation Results (Output)                                   */}
        {/* ========================================================================= */}
        <section id="results-section" className="scroll-mt-24 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              03 · Output
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Screening Results</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1">
            Automated multi-criteria evaluation outcome with detailed unmet criteria reports.
          </p>

          {/* Validation Message Area */}
          {validationError && (
            <div
              role="alert"
              className="bg-rose-50 dark:bg-rose-950/40 border-l-4 border-rose-500 p-5 rounded-r-2xl shadow-xs"
            >
              <div className="flex items-start">
                <div>
                  <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                    Validation Error: {validationError}
                  </h3>
                  <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    Please correct the highlighted input field before evaluating. All previously displayed results and counters have been cleared.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Counts Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Eligibility Status Summary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Summary of shortlisted vs ineligible roles</p>
            </div>

            <div className="flex items-center space-x-3">
              {counts ? (
                <>
                  <div className="flex items-center space-x-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-base font-bold">
                    <span>{counts.eligible}</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Eligible</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-base font-bold">
                    <span>{counts.ineligible}</span>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Ineligible</span>
                  </div>
                </>
              ) : (
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  — No evaluation active
                </div>
              )}
            </div>
          </div>

          {/* Role Results Panel (with View Mode Toggle) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Shortlisted Requisitions</h3>
                {results && (
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {results.length} Roles
                  </span>
                )}
              </div>

              {/* View Toggle Control */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>

            {!results ? (
              /* Spacious Standby Empty State */
              <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {validationError ? 'Input Correction Required' : 'Ready to Screen Candidate'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                  {validationError
                    ? 'Evaluation results were cleared due to invalid profile input. Correct the errors above and re-evaluate.'
                    : 'Configure candidate parameters above and click "Evaluate Profile" to see real-time eligibility status across all 5 requisitions.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleEvaluate()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Run Screening Now
                </button>
              </div>
            ) : viewMode === 'card' ? (
              <ResultsCardView results={results} />
            ) : (
              <ResultsListView results={results} />
            )}
          </div>
        </section>
      </main>

      {/* 2. Persistent Floating Action Bar (Anchored at bottom-center of viewport) */}
      <aside aria-label="Quick Actions" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-slate-200/90 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleEvaluate()}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Evaluate</span>
        </button>
        <button
          type="button"
          onClick={handleSample}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-full transition-colors cursor-pointer"
        >
          Sample
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-full transition-colors cursor-pointer"
        >
          Reset
        </button>
      </aside>
    </div>
  );
}

