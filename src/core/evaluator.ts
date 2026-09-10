import rolesData from '../../roles.json' with { type: 'json' };

/**
 * Raw string representation of user inputs from the presentation layer.
 */
export interface RawProfileInput {
  branch: string;
  cgpa: string;
  graduationYear: string;
  activeBacklogs: string;
  skills: string;
}

/**
 * Validated and normalized student profile.
 */
export interface StudentProfile {
  branch: string;
  cgpa: number;
  graduationYear: number;
  activeBacklogs: number;
  skills: string[];
}

/**
 * Fixed career fair role requirement contract (Single Source of Truth).
 */
export interface Role {
  id: string;
  title: string;
  allowedBranches: string[];
  minCgpa: number;
  allowedGraduationYears: number[];
  maxActiveBacklogs: number;
  requiredSkills: string[];
}

/**
 * Contractual validation error codes for student profile fields.
 */
export type ValidationErrorCode =
  | 'INVALID_BRANCH'
  | 'INVALID_CGPA'
  | 'INVALID_GRADUATION_YEAR'
  | 'INVALID_BACKLOG_COUNT';

/**
 * Result shape of profile validation.
 */
export type ProfileValidationResult =
  | { isValid: true; profile: StudentProfile }
  | { isValid: false; errorCode: ValidationErrorCode };

/**
 * Standard failure reason tokens for ineligible roles.
 */
export type StandardFailureReason =
  | 'BRANCH_NOT_ALLOWED'
  | 'CGPA_BELOW_MINIMUM'
  | 'GRADUATION_YEAR_NOT_ALLOWED'
  | 'TOO_MANY_ACTIVE_BACKLOGS';

export type MissingSkillReason = `MISSING_SKILL: ${string}`;

export type FailureReason = StandardFailureReason | MissingSkillReason;

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE';

/**
 * Outcome of evaluating a student profile against a single role.
 */
export interface EvaluationResult {
  roleId: string;
  roleTitle: string;
  status: EligibilityStatus;
  failureReasons: FailureReason[];
}

/**
 * Summary counter aggregation.
 */
export interface EligibilityCounts {
  eligible: number;
  ineligible: number;
}

/**
 * Top-level evaluation output report.
 */
export interface ShortlistEvaluationReport {
  results: EvaluationResult[];
  counts: EligibilityCounts;
}

/**
 * Static constant of all 5 career fair roles loaded from roles.json.
 */
export const FIXED_ROLES: Role[] = rolesData as Role[];

/**
 * Normalizes a raw comma-delimited skill string into an array of unique tokens.
 * Trims whitespace from each piece, drops empty pieces, and collapses duplicates case-insensitively.
 *
 * // ponytail: We normalize skills to lowercase tokens for O(1) case-insensitive lookup.
 */
export function normalizeSkills(rawSkillString: string): string[] {
  if (!rawSkillString || typeof rawSkillString !== 'string') {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const piece of rawSkillString.split(',')) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      normalized.push(lower);
    }
  }

  return normalized;
}

/**
 * Validates a student profile against contractual constraints in canonical order:
 * 1. Branch: blank / whitespace-only -> INVALID_BRANCH
 * 2. CGPA: finite number in [0.0, 10.0] -> INVALID_CGPA
 * 3. Graduation Year: whole integer in [2000, 2100] -> INVALID_GRADUATION_YEAR
 * 4. Active Backlogs: whole integer >= 0 -> INVALID_BACKLOG_COUNT
 *
 * Returns the first encountered ValidationErrorCode, or null if completely valid.
 */
export function validateProfile(
  profile: RawProfileInput | StudentProfile | Record<string, any>
): ValidationErrorCode | null {
  if (!profile || typeof profile !== 'object') {
    return 'INVALID_BRANCH';
  }

  // 1. Branch check (trimmed, non-empty)
  if (typeof profile.branch !== 'string' || profile.branch.trim() === '') {
    return 'INVALID_BRANCH';
  }

  // 2. CGPA check (finite number in [0, 10])
  if (
    profile.cgpa === null ||
    profile.cgpa === undefined ||
    (typeof profile.cgpa !== 'number' && typeof profile.cgpa !== 'string')
  ) {
    return 'INVALID_CGPA';
  }
  const cgpaTrimmed = typeof profile.cgpa === 'string' ? profile.cgpa.trim() : profile.cgpa;
  if (cgpaTrimmed === '') {
    return 'INVALID_CGPA';
  }
  const cgpaNum = typeof cgpaTrimmed === 'number' ? cgpaTrimmed : Number(cgpaTrimmed);
  if (!Number.isFinite(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
    return 'INVALID_CGPA';
  }

  // 3. Graduation Year check (whole integer in [2000, 2100])
  if (
    profile.graduationYear === null ||
    profile.graduationYear === undefined ||
    (typeof profile.graduationYear !== 'number' && typeof profile.graduationYear !== 'string')
  ) {
    return 'INVALID_GRADUATION_YEAR';
  }
  const gradYearTrimmed =
    typeof profile.graduationYear === 'string'
      ? profile.graduationYear.trim()
      : profile.graduationYear;
  if (gradYearTrimmed === '') {
    return 'INVALID_GRADUATION_YEAR';
  }
  const gradYearNum =
    typeof gradYearTrimmed === 'number'
      ? gradYearTrimmed
      : Number(gradYearTrimmed);
  if (!Number.isInteger(gradYearNum) || gradYearNum < 2000 || gradYearNum > 2100) {
    return 'INVALID_GRADUATION_YEAR';
  }

  // 4. Active Backlogs check (whole integer >= 0)
  if (
    profile.activeBacklogs === null ||
    profile.activeBacklogs === undefined ||
    (typeof profile.activeBacklogs !== 'number' && typeof profile.activeBacklogs !== 'string')
  ) {
    return 'INVALID_BACKLOG_COUNT';
  }
  const backlogsTrimmed =
    typeof profile.activeBacklogs === 'string'
      ? profile.activeBacklogs.trim()
      : profile.activeBacklogs;
  if (backlogsTrimmed === '') {
    return 'INVALID_BACKLOG_COUNT';
  }
  const backlogsNum =
    typeof backlogsTrimmed === 'number'
      ? backlogsTrimmed
      : Number(backlogsTrimmed);
  if (!Number.isInteger(backlogsNum) || backlogsNum < 0) {
    return 'INVALID_BACKLOG_COUNT';
  }

  return null;
}

/**
 * Evaluates a student profile against a single role.
 *
 * CRITICAL CONTRACT REQUIREMENT:
 * ALL 5 rule categories MUST be evaluated INDEPENDENTLY.
 * DO NOT short-circuit or return early on the first failure.
 * Failure reasons MUST be emitted in this exact fixed order:
 * 1. BRANCH_NOT_ALLOWED
 * 2. CGPA_BELOW_MINIMUM
 * 3. GRADUATION_YEAR_NOT_ALLOWED
 * 4. TOO_MANY_ACTIVE_BACKLOGS
 * 5. MISSING_SKILL: <skill> (sorted alphabetically case-insensitive, preserving role casing)
 */
export function evaluateRole(
  profile: StudentProfile | RawProfileInput,
  role: Role
): EvaluationResult {
  const failureReasons: FailureReason[] = [];

  // Parse numeric values safely
  const studentCgpa = typeof profile.cgpa === 'number' ? profile.cgpa : Number(profile.cgpa);
  const studentGradYear =
    typeof profile.graduationYear === 'number'
      ? profile.graduationYear
      : Number(profile.graduationYear);
  const studentBacklogs =
    typeof profile.activeBacklogs === 'number'
      ? profile.activeBacklogs
      : Number(profile.activeBacklogs);

  // Normalize student skills for fast case-insensitive lookup
  const studentSkillSet = new Set<string>();
  if (Array.isArray(profile.skills)) {
    for (const skill of profile.skills) {
      if (typeof skill === 'string' && skill.trim()) {
        studentSkillSet.add(skill.trim().toLowerCase());
      }
    }
  } else if (typeof profile.skills === 'string') {
    for (const skill of normalizeSkills(profile.skills)) {
      studentSkillSet.add(skill);
    }
  }

  // Rule 1: Branch check (trimmed, case-insensitive match against allowedBranches)
  // NON-SHORT-CIRCUITING: We evaluate this and continue regardless of pass/fail.
  const studentBranchTrimmed = (profile.branch || '').trim().toLowerCase();
  const allowedBranchesLower = role.allowedBranches.map((b) => b.trim().toLowerCase());
  if (!allowedBranchesLower.includes(studentBranchTrimmed)) {
    failureReasons.push('BRANCH_NOT_ALLOWED');
  }

  // Rule 2: CGPA check (student CGPA >= role minimum CGPA)
  // NON-SHORT-CIRCUITING: Always evaluate independently.
  if (studentCgpa < role.minCgpa) {
    failureReasons.push('CGPA_BELOW_MINIMUM');
  }

  // Rule 3: Graduation Year check (student year in role allowedGraduationYears)
  // NON-SHORT-CIRCUITING: Always evaluate independently.
  if (!role.allowedGraduationYears.includes(studentGradYear)) {
    failureReasons.push('GRADUATION_YEAR_NOT_ALLOWED');
  }

  // Rule 4: Active Backlogs check (student backlogs <= role maximum active backlogs)
  // NON-SHORT-CIRCUITING: Always evaluate independently.
  if (studentBacklogs > role.maxActiveBacklogs) {
    failureReasons.push('TOO_MANY_ACTIVE_BACKLOGS');
  }

  // Rule 5: Required Skills check (every required skill must be in student skills)
  // NON-SHORT-CIRCUITING: Collect all missing skills, sort them alphabetically case-insensitive,
  // and append formatted as 'MISSING_SKILL: <skill>' preserving the role definition's casing.
  const missingSkills: string[] = [];
  for (const requiredSkill of role.requiredSkills) {
    const reqTrimmedLower = requiredSkill.trim().toLowerCase();
    if (!studentSkillSet.has(reqTrimmedLower)) {
      missingSkills.push(requiredSkill.trim());
    }
  }

  if (missingSkills.length > 0) {
    // Sort missing skills case-insensitively alphabetically
    missingSkills.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    for (const missing of missingSkills) {
      failureReasons.push(`MISSING_SKILL: ${missing}` as MissingSkillReason);
    }
  }

  const status: EligibilityStatus = failureReasons.length === 0 ? 'ELIGIBLE' : 'INELIGIBLE';

  return {
    roleId: role.id,
    roleTitle: role.title,
    status,
    failureReasons,
  };
}

/**
 * Evaluates a student profile against all roles.
 * Sorts results:
 * 1. Primary: ELIGIBLE group first, INELIGIBLE group second.
 * 2. Secondary: Role Title case-insensitive ascending (A-Z).
 * 3. Tertiary (tiebreak): Role ID ascending (e.g. CF01 before CF04).
 */
export function evaluateAll(
  profile: StudentProfile | RawProfileInput,
  roles: Role[] = FIXED_ROLES
): EvaluationResult[] {
  const evaluated = roles.map((role) => evaluateRole(profile, role));

  return evaluated.sort((a, b) => {
    // 1. ELIGIBLE before INELIGIBLE
    if (a.status !== b.status) {
      return a.status === 'ELIGIBLE' ? -1 : 1;
    }
    // 2. Role title case-insensitive ascending
    const titleComparison = a.roleTitle.localeCompare(b.roleTitle, undefined, {
      sensitivity: 'base',
    });
    if (titleComparison !== 0) {
      return titleComparison;
    }
    // 3. Role ID ascending tiebreak
    return a.roleId.localeCompare(b.roleId);
  });
}

/**
 * Computes aggregate summary counts of eligible and ineligible roles.
 */
export function getCounts(results: EvaluationResult[]): EligibilityCounts {
  let eligible = 0;
  let ineligible = 0;
  for (const res of results) {
    if (res.status === 'ELIGIBLE') {
      eligible++;
    } else {
      ineligible++;
    }
  }
  return { eligible, ineligible };
}

/**
 * Formats a raw evaluation failure reason code into a clear, candidate-facing
 * sentence from the user's perspective, optionally enriched with role requirements.
 */
export function formatFailureReason(reason: string, role?: Role): string {
  if (reason.startsWith('MISSING_SKILL:')) {
    const skill = reason.replace('MISSING_SKILL:', '').trim();
    return `You are missing the required skill: ${skill}`;
  }

  switch (reason) {
    case 'BRANCH_NOT_ALLOWED':
      return role && role.allowedBranches?.length
        ? `Your branch is not eligible for this role (allowed: ${role.allowedBranches.join(', ')})`
        : 'Your branch is not eligible for this role';
    case 'CGPA_BELOW_MINIMUM':
      return role && typeof role.minCgpa === 'number'
        ? `Your CGPA is below the minimum required cutoff of ${role.minCgpa.toFixed(1)}`
        : 'Your CGPA is below the minimum required cutoff';
    case 'GRADUATION_YEAR_NOT_ALLOWED':
      return role && role.allowedGraduationYears?.length
        ? `Your graduation year is not eligible for this role (allowed batches: ${role.allowedGraduationYears.join(', ')})`
        : 'Your graduation year is not eligible for this role';
    case 'TOO_MANY_ACTIVE_BACKLOGS':
      return role && typeof role.maxActiveBacklogs === 'number'
        ? `Your active backlogs exceed the maximum permitted limit (${role.maxActiveBacklogs} allowed)`
        : 'Your active backlogs exceed the maximum permitted limit for this role';
    default:
      return reason;
  }
}

