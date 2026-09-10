# AI Prompts Used Across Phases 0–4 (`RoleFit`)

This document records the chronological sequence of prompts and prompting strategies used to guide the implementation of the **Career Fair Eligibility Shortlist (`RoleFit`)** system.

---

## 1. Project Initialization & Governance Setup

### Prompt Summary
> "Take a look at ROADMAP.md and generate a AGENTS.md FILE for this project. Also don't forget to mention that the agent should use /ponytail for proper better bloat-free approach for implementing any task provided by the user. And use /find-docs for latest docs for all the technology stack we will be using for this project."

### Strategy & Rationale
- **Objective:** Establish clear ground rules, subagent delegation responsibilities, and bloat-free execution constraints (`/ponytail`) before code generation.
- **Outcome:** Generated [`AGENTS.md`](./AGENTS.md) defining the pure-function core architecture, subagent roles, and the 5-phase delivery roadmap.

---

## 2. Phase 0 — Contract Lock-In & Specification

### Prompt Summary
> "You are implementing Phase 0 of the 'Career Fair Eligibility Shortlist' (EligiCheck) project. Do NOT write any application code, UI code, or evaluation logic in this phase. This phase is purely about locking down the specification and producing planning artifacts. Treat this as a gate — do not proceed to Phase 1 until the outputs exist and are internally consistent: spec-summary.md, assumptions.md, roles.json, test-case-checklist.md, and data-shapes.md."

### Strategy & Rationale
- **Objective:** Prevent premature coding by forcing contract alignment, boundary definitions, and data shape specifications upfront.
- **Outcome:** Locked all 5 fixed career fair roles, validation codes, and deterministic sorting rules into immutable artifacts before writing any TypeScript logic.

---

## 3. Phase 1 — Pure Evaluation Core

### Prompt Summary
> "You are implementing Phase 1 of the 'Career Fair Eligibility Shortlist' (EligiCheck) project. Phase 0 is complete. Build ONLY the pure evaluation logic. No UI, no DOM, no React components, no rendering, no user input handling. Everything must be plain functions that take data in and return data out, runnable from a script or test file with zero framework dependency: validateProfile, normalizeSkills, evaluateRole, evaluateAll, getCounts."

### Strategy & Rationale
- **Objective:** Isolate business logic completely from framework/DOM noise, guaranteeing 100% testability and eliminating edge-case regressions.
- **Outcome:** Implemented [`src/core/evaluator.ts`](./src/core/evaluator.ts) with full validation, normalization, and evaluation functions.

---

## 4. Phase 2 — Acceptance Unit Test Suite

### Prompt Summary
> "You are implementing Phase 2 of the 'Career Fair Eligibility Shortlist' (EligiCheck) project. Read test-case-checklist.md and the Phase 1 module before writing anything. Turn the Given/When/Then case list from Phase 0 into an executable, automated test suite against the Phase 1 functions. Do not modify Phase 1 logic in this phase."

### Strategy & Rationale
- **Objective:** Automate all acceptance criteria, reason ordering constraints, boundary inclusions, and case-insensitivity tests before touching UI code.
- **Outcome:** Created [`tests/evaluator.test.ts`](./tests/evaluator.test.ts) utilizing Node's native `node:test` framework (33 tests, 8 suites, 100% passing).

---

## 5. Phase 3 — Single-File React + Tailwind UI

### Prompt Summary
> "You are implementing Phase 3 of the 'Career Fair Eligibility Shortlist' (EligiCheck) project. Hard Rule: Do NOT modify, duplicate, or re-derive any evaluation logic inside UI components. The UI layer is a thin, dumb wiring layer over the already-tested core functions from Phase 1. Stack: Single-file React component styled with Tailwind CSS, client-side only."

### Strategy & Rationale
- **Objective:** Create a clean, responsive single-file user interface that imports the evaluation engine without duplicating logic.
- **Outcome:** Implemented [`src/App.tsx`](./src/App.tsx) featuring the editable student profile form, fixed roles reference table, action buttons (Evaluate, Sample, Reset), and clear validation banners.

---

## 6. Phase 4 — Compact Role-Card View Toggle

### Prompt Summary
> "You are implementing Phase 4 of the 'Career Fair Eligibility Shortlist' (EligiCheck) project. Hard Rule: This phase adds a PRESENTATION-ONLY alternate view. Do NOT introduce any new evaluation logic, new state derivation, new sorting, or new filtering. The card view must render from the exact same results state and counts state already produced by the Phase 3 flow."

### Strategy & Rationale
- **Objective:** Provide a compact card grid layout toggle without introducing data forks or duplicate state.
- **Outcome:** Added `viewMode` toggle and `ResultsCardView` in [`src/App.tsx`](./src/App.tsx), verified all 6 manual scenarios, and recorded findings in [`phase4-notes.md`](./phase4-notes.md).
