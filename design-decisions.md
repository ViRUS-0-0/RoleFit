# Design Decisions — Career Fair Eligibility Shortlist (`RoleFit`)

This document records the architectural decisions, trade-offs, and design rationale across all development phases of the **RoleFit / EligiCheck** project.

---

## 1. Pure, Framework-Agnostic Evaluation Core First

- **Decision:** Implemented all evaluation logic (`validateProfile`, `evaluateRole`, `evaluateAll`, `getCounts`, and normalization helpers) as pure TypeScript functions with zero DOM, browser, or React dependencies in Phase 1 before building any UI.
- **Rationale:**
  - **Exhaustive Automated Verification:** Allowed running 33 unit tests directly via Node's native test runner (`node:test`) in under 300ms without DOM mocking or jsdom bloat.
  - **Zero Duplication across Views:** Guarantees that both the List View (Phase 3) and Card View (Phase 4) consume the exact same evaluated state without re-implementing rules or sort logic.
  - **Separation of Concerns:** Business logic remains completely isolated from layout and rendering state.

---

## 2. Explicit "Evaluate" Action vs Live / Reactive Keystroke Validation

- **Decision:** Validation and evaluation are triggered strictly on user actions (**Evaluate**, **Sample**, or **Reset**), never on keystrokes (`onChange`).
- **Rationale:**
  - **Specification Alignment:** Matches the prompt and spec wording specifying an explicit "Evaluate action".
  - **Eliminates Validation Noise:** Validating mid-keystroke produces disruptive false positives (e.g., typing "8." triggers `INVALID_CGPA` before the user finishes entering "8.5").
  - **Clear Failure Semantics:** When validation fails on an explicit run, results and counts are cleared cleanly until the candidate corrects the input and clicks Evaluate again.

---

## 3. Sample and Reset Semantics

- **Decision:** Both "Sample" and "Reset" populate the form with the built-in baseline profile (`CSE`, `8.1`, `2027`, `1`, `Git, Python, SQL`) and immediately execute an evaluation run.
- **Rationale:**
  - **Phase 0 Contract Consistency:** Formally locked in [`assumptions.md`](./assumptions.md).
  - **Frictionless UX:** Resetting the candidate form immediately displays the baseline outcome (2 Eligible / 3 Ineligible) rather than requiring a second redundant click on "Evaluate".

---

## 4. Single-File React + Tailwind CSS Stack

- **Decision:** Built the UI as a single-file React component in [`src/App.tsx`](./src/App.tsx) styled via Tailwind CSS v4 utility classes.
- **Rationale:**
  - **Adherence to `/ponytail`:** The project has a fixed, client-side scope (no backend, no routing, no database). A single-file component keeps state flow transparent and eliminates file hop.
  - **Zero State Overhead:** Plain React `useState` cleanly tracks `profile`, `validationError`, `results`, `counts`, and `viewMode` without external state management dependencies (no Redux, Zustand, or Context).
  - **Modern Tailwind v4 Pipeline:** Vite with `@tailwindcss/vite` compiles instantly (<200ms) with zero postcss config files.

---

## 5. AI Suggestions & Architectural Trade-offs Log

| Phase | Proposal / Suggestion | Decision & Action Taken | Rationale |
|---|---|---|---|
| **Phase 0** | Introduce candidate ranking score / match percentages | **Rejected** | The specification strictly defined a binary `ELIGIBLE`/`INELIGIBLE` output. Ranking scores violate YAGNI and specification constraints. |
| **Phase 1** | Short-circuit evaluation upon the first failed criterion | **Rejected** | Evaluator must collect *all* failure reasons in the exact 5-category order specified. Short-circuiting would hide subsequent unmet criteria (e.g. CF05). |
| **Phase 2** | Install Jest or Vitest for testing | **Modified / Rejected** | Replaced with native Node test runner (`node:test` + `node:assert/strict`). Zero extra packages, zero configuration, 33/33 tests run in <300ms. |
| **Phase 3** | Use a headless UI modal or complex tab component | **Rejected** | Replaced with semantic native HTML elements (`<button>`, `<form>`, `<section>`) and standard Tailwind classes (`/ponytail` principle). |
| **Phase 4** | Separate results data model or filter hooks for Card View | **Rejected** | Both `ResultsListView` and `ResultsCardView` take `{ results: EvaluationResult[] }` directly from the single evaluation state. |
