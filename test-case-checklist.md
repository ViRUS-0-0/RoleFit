# Acceptance Test Case Checklist — Career Fair Eligibility Shortlist (`RoleFit`)

This document defines the formal, numbered acceptance test suite formatted in Given/When/Then style. These test cases represent the contractual baseline for Phase 2's automated test implementation.

---

### TC01: Baseline Evaluation of Built-in Profile
- **Given:** The default built-in profile:
  - Branch: `"CSE"`
  - CGPA: `8.1`
  - Graduation Year: `2027`
  - Active Backlogs: `1`
  - Skills: `"Git, Python, SQL"`
- **When:** The profile is evaluated against all 5 fixed roles.
- **Then:**
  - `CF01` and `CF02` are marked `ELIGIBLE`.
  - `CF03`, `CF04`, and `CF05` are marked `INELIGIBLE`.
  - Roles are ordered: `CF01`, `CF02`, `CF03`, `CF04`, `CF05`.
  - Aggregate counts are `{ eligible: 2, ineligible: 3 }`.

---

### TC02: CF03 Ineligible Failure Reasons Isolation
- **Given:** The built-in student profile (`CSE`, `8.1`, `2027`, `1`, `"Git, Python, SQL"`).
- **When:** Evaluated against `CF03` (Embedded Systems Intern: allowed branches `ECE, EEE`, min CGPA `7.5`, grad year `2027`, max backlogs `1`, required skill `"Git"`).
- **Then:**
  - Status is `INELIGIBLE`.
  - Failure reasons list contains exactly one entry: `["BRANCH_NOT_ALLOWED"]`.
  - All other 4 criteria pass without failure reasons.

---

### TC03: CF04 Ineligible Failure Reasons Isolation
- **Given:** The built-in student profile (`CSE`, `8.1`, `2027`, `1`, `"Git, Python, SQL"`).
- **When:** Evaluated against `CF04` (Machine Learning Intern: allowed branches `CSE, IT`, min CGPA `8.5`, grad year `2027`, max backlogs `1`, required skill `"Python"`).
- **Then:**
  - Status is `INELIGIBLE`.
  - Failure reasons list contains exactly one entry: `["CGPA_BELOW_MINIMUM"]`.
  - All other 4 criteria pass without failure reasons.

---

### TC04: CF05 Multi-Failure Evaluation & Strict Ordering
- **Given:** The built-in student profile (`CSE`, `8.1`, `2027`, `1`, `"Git, Python, SQL"`).
- **When:** Evaluated against `CF05` (Platform Engineering Intern: allowed branches `CSE, ECE`, min CGPA `7.0`, grad year `2026`, max backlogs `0`, required skills `"Docker, Git"`).
- **Then:**
  - Status is `INELIGIBLE`.
  - Failure reasons list contains exactly 3 entries in this exact order:
    1. `"GRADUATION_YEAR_NOT_ALLOWED"`
    2. `"TOO_MANY_ACTIVE_BACKLOGS"`
    3. `"MISSING_SKILL: Docker"`
  - Criteria `BRANCH_NOT_ALLOWED` and `CGPA_BELOW_MINIMUM` are NOT present.

---

### TC05: Boundary CGPA Update to 8.5 (Role Flip & Sorting Verification)
- **Given:** The built-in student profile with CGPA modified to `8.5` (all other fields unchanged).
- **When:** The profile is evaluated.
- **Then:**
  - `CF04` transitions from `INELIGIBLE` to `ELIGIBLE`.
  - Eligible roles are `CF01`, `CF04`, `CF02`.
  - Sorted order for the eligible group is:
    1. `CF01` (Data Operations Intern)
    2. `CF04` (Machine Learning Intern)
    3. `CF02` (QA Automation Intern)
  - Ineligible roles remain `CF03` followed by `CF05`.
  - Aggregate counts become `{ eligible: 3, ineligible: 2 }`.

---

### TC06: CGPA Validation Error Handling & Result Invalidation
- **Given:** The built-in student profile has been evaluated successfully (TC01 state active).
- **When:** CGPA is modified to `10.5` and evaluation is triggered.
- **Then:**
  - Profile validation fails with error code `INVALID_CGPA`.
  - All previously rendered role results are cleared (0 role results visible).
  - Aggregate counts are cleared / reset.
  - A validation error message displaying `INVALID_CGPA` is presented.

---

### TC07: CGPA Boundary Values & Inclusive Matching
- **Given:** A student profile with CGPA at boundaries:
  - Subcase A: CGPA = `0.0` $\to$ Profile is valid.
  - Subcase B: CGPA = `10.0` $\to$ Profile is valid.
  - Subcase C: CGPA = `-0.01` or `10.01` $\to$ `INVALID_CGPA`.
  - Subcase D: Student CGPA exactly matches role's min CGPA (e.g., CGPA = `7.0` against `CF02` min CGPA `7.0`) $\to$ CGPA check passes (inclusive comparison $\ge$).

---

### TC08: Graduation Year Range & Type Boundaries
- **Given:** A student profile with Graduation Year values:
  - Subcase A: Year = `2000` $\to$ Profile is valid (lower inclusive bound).
  - Subcase B: Year = `2100` $\to$ Profile is valid (upper inclusive bound).
  - Subcase C: Year = `1999` or `2101` $\to$ Fails validation with `INVALID_GRADUATION_YEAR`.
  - Subcase D: Year = `2026.5` or non-integer string $\to$ Fails validation with `INVALID_GRADUATION_YEAR`.

---

### TC09: Active Backlog Count Boundaries & Inclusive Matching
- **Given:** A student profile with Active Backlogs values:
  - Subcase A: Backlogs = `0` $\to$ Profile is valid.
  - Subcase B: Backlogs = `-1` $\to$ Fails validation with `INVALID_BACKLOG_COUNT`.
  - Subcase C: Backlogs = `1.5` $\to$ Fails validation with `INVALID_BACKLOG_COUNT`.
  - Subcase D: Student Backlogs = `1` against `CF01` max backlogs `1` $\to$ Backlog check passes (inclusive comparison $\le$).
  - Subcase E: Student Backlogs = `0` against `CF05` max backlogs `0` $\to$ Backlog check passes.

---

### TC10: Branch Input Normalization & Error Handling
- **Given:** A student profile with Branch input:
  - Subcase A: Branch = `""` or `"   "` (blank / whitespace-only) $\to$ Fails validation with `INVALID_BRANCH`.
  - Subcase B: Branch = `"  cse  "` $\to$ Validated successfully; matches `"CSE"` in `CF01`, `CF02`, `CF04`, `CF05`.
  - Subcase C: Branch = `"CS"` $\to$ Valid profile, but fails role branch criteria with `BRANCH_NOT_ALLOWED` (no aliases).

---

### TC11: Skill Whitespace Trimming & Case-Insensitive Matching
- **Given:** Student skills entered as `"   python  ,   GIT  ,  SqL  "`.
- **When:** Evaluated against `CF01` (requires `"Python"`, `"SQL"`).
- **Then:**
  - Trimming and case-normalization resolve all required skills.
  - Skill check passes with zero missing skill reasons.

---

### TC12: Duplicate Skill Tokens Collapse & Empty Piece Filtering
- **Given:** Student skills entered as `"Python, python, , PYTHON, Git,, SQL, "`.
- **When:** Evaluated against any role.
- **Then:**
  - Empty chunks between commas and trailing commas are discarded.
  - Duplicate case-insensitive tokens collapse into unique skills `{"python", "git", "sql"}`.
  - Evaluation outcome is identical to TC01.

---

### TC13: Multiple Missing Skills Case-Insensitive Alphabetical Order
- **Given:** A student profile with branch `"CSE"`, CGPA `9.0`, grad year `2026`, `0` backlogs, and skills `""` (no skills).
- **When:** Evaluated against `CF05` (requires `"Docker"`, `"Git"`).
- **Then:**
  - Both skills are missing.
  - Failure reasons include:
    - `"MISSING_SKILL: Docker"`
    - `"MISSING_SKILL: Git"`
  - Sorted alphabetically: `Docker` precedes `Git`.

---

### TC14: Title and ID Sorting Tiebreaker Verification
- **Given:** Two roles in the same eligibility group:
  - Role A: Title `"Alpha Intern"`, ID `"CF09"`
  - Role B: Title `"Alpha Intern"`, ID `"CF02"`
- **When:** The list is sorted.
- **Then:**
  - Since titles match (case-insensitive), tiebreaker places `CF02` before `CF09` ascending by ID.

---

### TC15: Action Invariance of "Sample" and "Reset"
- **Given:** The form currently contains a customized invalid profile (e.g. Branch `"MECH"`, CGPA `12.0`).
- **When:** User clicks "Sample" or "Reset".
- **Then:**
  - Form fields immediately reset to default values (`CSE`, `8.1`, `2027`, `1`, `"Git, Python, SQL"`).
  - Validation passes without errors.
  - Evaluation executes immediately, returning the exact TC01 result (CF01, CF02 eligible; CF03, CF04, CF05 ineligible; counts 2/3).
