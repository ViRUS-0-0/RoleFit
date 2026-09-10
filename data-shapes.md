# Data Shapes & Type Contracts — Career Fair Eligibility Shortlist (`RoleFit`)

This document defines the core data contracts and type shapes for the Career Fair Eligibility Shortlist system. In accordance with `/ponytail`, all definitions favor standard JavaScript/TypeScript primitives, zero bloat, and no unnecessary abstraction layers.

---

## 1. Domain Entities & Plain Language Summary

1. **`RawProfileInput`**: Represents the raw, controlled string values bound to user input fields in the frontend form before validation or parsing.
2. **`StudentProfile`**: The validated and parsed profile with strongly typed primitives (numbers for CGPA, graduation year, and backlogs; normalized string array for skills).
3. **`Role`**: The immutable data contract representing a career fair job opportunity, matching `roles.json`.
4. **`ValidationErrorCode`**: A strict union of the 4 allowable input validation error tokens.
5. **`ProfileValidationResult`**: The outcome of checking a student profile before running role evaluation.
6. **`FailureReason`**: Deterministic reason strings explaining why a student profile failed a role's requirements.
7. **`EvaluationResult`**: The evaluation verdict for an individual role, containing its eligibility status and any failure reasons.
8. **`EligibilityCounts`**: Simple aggregate counts of eligible versus ineligible roles.
9. **`ShortlistEvaluationReport`**: The complete top-level state containing all evaluated roles and counters.

---

## 2. TypeScript Contract Sketches

```typescript
/**
 * Raw string inputs from the presentation form fields.
 */
export interface RawProfileInput {
  branch: string;
  cgpa: string;
  graduationYear: string;
  activeBacklogs: string;
  skills: string; // Comma-separated user input (e.g. "Git, Python, SQL")
}

/**
 * Validated, parsed, and normalized student profile.
 */
export interface StudentProfile {
  branch: string;           // Trimmed, normalized branch code
  cgpa: number;             // Finite float in [0.0, 10.0]
  graduationYear: number;   // Whole integer in [2000, 2100]
  activeBacklogs: number;   // Whole integer >= 0
  skills: string[];         // Trimmed, case-insensitive deduplicated array
}

/**
 * Static career fair role requirements contract (Single Source of Truth).
 */
export interface Role {
  id: string;                         // e.g. "CF01"
  title: string;                      // e.g. "Data Operations Intern"
  allowedBranches: string[];          // e.g. ["CSE", "IT"]
  minCgpa: number;                    // e.g. 7.5
  allowedGraduationYears: number[];   // e.g. [2027]
  maxActiveBacklogs: number;          // e.g. 1
  requiredSkills: string[];           // e.g. ["Python", "SQL"]
}

/**
 * Contractual validation error codes for input fields.
 */
export type ValidationErrorCode =
  | 'INVALID_BRANCH'
  | 'INVALID_CGPA'
  | 'INVALID_GRADUATION_YEAR'
  | 'INVALID_BACKLOG_COUNT';

/**
 * Output of profile validation.
 */
export type ProfileValidationResult =
  | { isValid: true; profile: StudentProfile }
  | { isValid: false; errorCode: ValidationErrorCode };

/**
 * Contractual failure reason strings for ineligible roles.
 */
export type StandardFailureReason =
  | 'BRANCH_NOT_ALLOWED'
  | 'CGPA_BELOW_MINIMUM'
  | 'GRADUATION_YEAR_NOT_ALLOWED'
  | 'TOO_MANY_ACTIVE_BACKLOGS';

export type MissingSkillReason = `MISSING_SKILL: ${string}`;

export type FailureReason = StandardFailureReason | MissingSkillReason;

/**
 * Status verdict for a role evaluation.
 */
export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE';

/**
 * Evaluation output for a single role.
 */
export interface EvaluationResult {
  roleId: string;
  roleTitle: string;
  status: EligibilityStatus;
  failureReasons: FailureReason[]; // Empty array if ELIGIBLE; ordered per spec if INELIGIBLE
}

/**
 * Aggregate summary counters.
 */
export interface EligibilityCounts {
  eligible: number;
  ineligible: number;
}

/**
 * Top-level application evaluation state.
 */
export interface ShortlistEvaluationReport {
  results: EvaluationResult[]; // Sorted: ELIGIBLE first, then title A-Z, then role ID
  counts: EligibilityCounts;
}
```

---

## 3. Adherence to Bloat-Free Guidelines (`/ponytail`)

- **Standard Library Primitives:** Relies on standard TypeScript/JavaScript primitives (`string`, `number`, `string[]`) rather than complex schema classes.
- **Zero Third-Party Type Wrappers:** No runtime schema libraries (`zod`, `yup`, `io-ts`) required for domain evaluation.
- **Immutable Constant Matching:** Directly maps 1:1 to [`roles.json`](./roles.json) without intermediate translation layers.
