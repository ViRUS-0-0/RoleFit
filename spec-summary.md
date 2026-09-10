# Specification Summary — Career Fair Eligibility Shortlist (`RoleFit`)

A one-page distilled specification checklist of all operational rules, contracts, and criteria for the Career Fair Eligibility Shortlist system.

---

## 1. System Scope & Boundaries
- [ ] **Client-Side Only:** Pure browser execution, zero backend endpoints, no external database or auth.
- [ ] **State Model:** In-memory state only. No local storage, cookies, or session persistence across reloads.
- [ ] **Functional Objective:** Evaluate one editable student profile against 5 fixed roles, displaying `ELIGIBLE` or `INELIGIBLE` status with all failed criteria per role.
- [ ] **No Application Tracking or Ranking:** Does not rank candidates, accept submissions, or store history.

---

## 2. Built-in Student Profile Baseline
- [ ] **Branch:** `CSE`
- [ ] **CGPA:** `8.1`
- [ ] **Graduation Year:** `2027`
- [ ] **Active Backlogs:** `1`
- [ ] **Skills:** `Git, Python, SQL`

---

## 3. Input Normalization & Validation Rules
- [ ] **Branch Trimming & Comparison:** Leading/trailing whitespace trimmed; comparison against allowed branches is case-insensitive (e.g., `" cse "` equals `"CSE"`). No alias inference (e.g., `"CS"` does not match `"CSE"`).
- [ ] **Skill Normalization:** Comma-delimited list; each entry is trimmed; empty strings/tokens are discarded; duplicate skills are collapsed case-insensitively (e.g., `"Python, python, PYTHON"` becomes a single `"python"` skill).
- [ ] **Field Validation Checks & Error Codes:**
  - [ ] Blank / whitespace-only branch $\to$ `INVALID_BRANCH`
  - [ ] CGPA not a finite number OR outside $[0.0, 10.0]$ $\to$ `INVALID_CGPA`
  - [ ] Graduation year not a whole integer OR outside $[2000, 2100]$ $\to$ `INVALID_GRADUATION_YEAR`
  - [ ] Active backlogs not a whole integer OR $< 0$ $\to$ `INVALID_BACKLOG_COUNT`
- [ ] **Invalid Field Invalidation Effect:** Any validation error clears all displayed role evaluation results and aggregate counts (`{ eligible, ineligible }`); no stale results remain visible alongside an error.

---

## 4. Role Eligibility & Evaluation Rules
- [ ] **Role Eligibility Criteria:** A role receives `ELIGIBLE` status if and only if **ALL 5** conditions pass:
  1. Student branch is in role's allowed branches set (case-insensitive).
  2. Student CGPA $\ge$ role's minimum CGPA.
  3. Student graduation year is in role's allowed graduation years set.
  4. Student active backlogs $\le$ role's maximum active backlogs.
  5. Every required skill in the role exists in student's normalized skills set (case-insensitive).
- [ ] **Independent Evaluation (No Short-Circuit):** All 5 rule categories are evaluated for every role, even after previous rules fail.
- [ ] **Failure Reason Sequence:** An ineligible role must list all failure reasons exactly once in this deterministic sequence:
  1. `BRANCH_NOT_ALLOWED`
  2. `CGPA_BELOW_MINIMUM`
  3. `GRADUATION_YEAR_NOT_ALLOWED`
  4. `TOO_MANY_ACTIVE_BACKLOGS`
  5. `MISSING_SKILL: <skill>` (one entry per missing skill, sorted case-insensitively alphabetically; preserves role-defined casing)
- [ ] **Eligible Role Output:** Eligible roles produce zero failure reasons.

---

## 5. Result Grouping & Deterministic Ordering
- [ ] **Primary Sort:** `ELIGIBLE` roles group first, followed by `INELIGIBLE` roles group.
- [ ] **Secondary Sort:** Within each group, sort alphabetically by Role Title ascending (case-insensitive).
- [ ] **Tertiary Sort (Tiebreak):** Within each group, sort by Role ID ascending (e.g., `CF01` before `CF04`).

---

## 6. Actions & UI State Contracts
- [ ] **Evaluate:** Runs validation on the current profile input. If valid, runs evaluation against all 5 fixed roles and renders results + count summary. If invalid, renders validation error message and wipes previous results.
- [ ] **Sample:** Overwrites the current form with the built-in profile (`CSE`, `8.1`, `2027`, `1`, `Git, Python, SQL`) and automatically executes evaluation.
- [ ] **Reset:** Restores form to the built-in profile, clears validation errors, and automatically executes evaluation to return to baseline state.
- [ ] **Summary Counters:** Renders total counts of `{ eligible: number, ineligible: number }` derived strictly from evaluation results.
