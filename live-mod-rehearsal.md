# Live-Modification Rehearsal (`RoleFit`)

This document records the end-to-end rehearsal of an on-the-spot live requirements change performed in Phase 5 to prove that the architecture, build environment, and workflow are fast, predictable, and safe for live demonstration.

---

## 1. Rehearsal Scenario

- **Simulated Client Request:** "The company wants to expand the Machine Learning Intern candidate pool. Lower CF04's minimum CGPA requirement from 8.5 to 8.0."
- **Target File:** [`roles.json`](./roles.json) (Single Source of Truth)

```diff
   {
     "id": "CF04",
     "title": "Machine Learning Intern",
     "allowedBranches": ["CSE", "IT"],
-    "minCgpa": 8.5,
+    "minCgpa": 8.0,
     "allowedGraduationYears": [2027],
     "maxActiveBacklogs": 1,
     "requiredSkills": ["Python"]
   }
```

---

## 2. Timing & Execution Workflow

| Step | Action Taken | Duration | Status |
|---|---|---|---|
| **1. Change Specification** | Located `minCgpa` field for `CF04` in [`roles.json`](./roles.json) | 5s | Done |
| **2. Code Modification** | Edited `8.5` to `8.0` via precise single-line edit | 10s | Done |
| **3. Production Compilation** | Executed `npm run build` (`vite build`) | 180ms | Clean build |
| **4. End-to-End Evaluation** | Evaluated built-in candidate profile (`CGPA: 8.1`) | 10s | Verified |
| **5. Clean Revert** | Restored baseline via `git checkout roles.json` | 5s | Reverted |
| **Total Elapsed Time** | **Prompt to Verified Result & Clean Revert** | **~35 seconds** | **PASS** |

---

## 3. Observed Behavior During Rehearsal

With the built-in profile inputs unchanged (`Branch: CSE`, `CGPA: 8.1`, `Graduation Year: 2027`, `Active Backlogs: 1`, `Skills: Git, Python, SQL`):

1. **Eligibility Summary Count:**
   - Automatically shifted from **2 Eligible / 3 Ineligible** to **3 Eligible / 2 Ineligible**.
2. **Status Transition:**
   - `CF04` (Machine Learning Intern) transitioned from `INELIGIBLE` (`CGPA_BELOW_MINIMUM`) to `ELIGIBLE`.
3. **Deterministic Ordering:**
   - The eligible group updated automatically to alphabetical sorting by Title:
     1. `CF01` Data Operations Intern (`ELIGIBLE`)
     2. `CF04` Machine Learning Intern (`ELIGIBLE`)
     3. `CF02` QA Automation Intern (`ELIGIBLE`)
   - Followed by the ineligible group:
     4. `CF03` Embedded Systems Intern (`INELIGIBLE`)
     5. `CF05` Platform Engineering Intern (`INELIGIBLE`)
4. **Zero Ripple Effects:**
   - Neither the pure evaluation functions in `src/core/evaluator.ts` nor the React UI components in `src/App.tsx` required any code changes.
   - The UI reference card dynamically rendered `Min CGPA: 8.0` directly from the single source of truth.

---

## 4. Revert Verification

- **Command Executed:** `git checkout roles.json`
- **Verification Results:**
  - `git status` confirms `roles.json` is clean and untracked changes remain zero for logic files.
  - `npm test` runs all 33 acceptance unit tests with **33/33 PASSING**.
  - `npm run build` compiles production bundle cleanly in 219ms.
  - Codebase is 100% restored to baseline state.
