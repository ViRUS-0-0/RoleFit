# Documented Assumptions — Career Fair Eligibility Shortlist (`RoleFit`)

This document captures all interpretations, operational choices, and baseline assumptions made to resolve ambiguities in the specification.

---

### Assumption 1: Equivalence of "Sample" and "Reset" Actions
- **Assumption:** The "Sample" button and the "Reset" button perform identical state transitions: both load the single built-in student profile (`CSE`, `8.1` CGPA, `2027` grad year, `1` backlog, `Git, Python, SQL`) into the form inputs and trigger evaluation.
- **Rationale:** The system only specifies one baseline student profile. In a client-only single-page application with no persistent database or user accounts, resetting the interface is functionally equivalent to loading the reference sample profile.
- **Risk if wrong:** If the product intent was for "Sample" to load a prefilled profile while "Reset" cleared all fields to blank inputs, users expecting an empty form on reset will be confused.

---

### Assumption 2: Automatic Evaluation on Sample and Reset
- **Assumption:** Triggering either "Sample" or "Reset" immediately executes input validation and role evaluation in one step without requiring a second click on "Evaluate".
- **Rationale:** The acceptance criteria explicitly state: *"Load the built-in profile in one action and show CF01 and CF02 as ELIGIBLE..."*. Requiring an extra "Evaluate" click would make loading a multi-action workflow rather than "one action".
- **Risk if wrong:** If evaluation was intended to strictly occur only upon clicking the "Evaluate" button, auto-evaluating on Sample/Reset would violate manual-evaluation lifecycle expectations.

---

### Assumption 3: Missing Skill String Representation and Casing
- **Assumption:** Missing skill failure reasons are formatted as `MISSING_SKILL: <skill>` using the exact casing defined in the role's `requiredSkills` list (e.g., `MISSING_SKILL: Docker`), and sorted case-insensitively alphabetically when multiple skills are missing.
- **Rationale:** Preserving the role definition's casing avoids ambiguous transformations (such as converting all skills to lowercase or uppercase) and matches the exact spec example: `MISSING_SKILL: Docker`.
- **Risk if wrong:** Automated unit tests expecting lowercased identifiers (e.g., `MISSING_SKILL: docker`) or a different separator syntax would fail assertion checks.

---

### Assumption 4: Single Prioritized Validation Error Banner
- **Assumption:** When the student profile contains multiple invalid fields simultaneously, the UI displays the error code of the first failing field in canonical validation order (`INVALID_BRANCH` $\to$ `INVALID_CGPA` $\to$ `INVALID_GRADUATION_YEAR` $\to$ `INVALID_BACKLOG_COUNT`), wipes previously rendered role results and counters, and displays a prominent error banner.
- **Rationale:** Contract 6 specifies discrete error codes and Contract 10 dictates that any invalid field clears results. Displaying the first failing field's code maintains a clean, single-banner UI without multi-line clutter.
- **Risk if wrong:** If the UI was expected to display an array of error messages or field-specific inline error text next to each input simultaneously, single error code reporting would need expansion.

---

### Assumption 5: Comma-Only Skill Delimiter
- **Assumption:** Skills are parsed exclusively by splitting on commas (`,`). Characters such as newlines, tabs, semicolons, or pipes within an entry are treated as literal parts of a skill string unless bounded by commas.
- **Rationale:** Contract 2 states: *"Split entered skill list on commas, ignore empty pieces, collapse duplicates (case-insensitively)."* Sticking strictly to commas prevents unexpected splitting of technology names.
- **Risk if wrong:** If a user pastes a multiline or space-separated list of skills, tokens wouldn't split into distinct skills unless commas are present.

---

### Assumption 6: Fixed Roles Immutability
- **Assumption:** The 5 roles (`CF01` through `CF05`) are completely static, immutable constants hardcoded in the client application, with no runtime addition, editing, or deletion.
- **Rationale:** Explicitly stated in the specification: *"Fixed Roles (never mutated at runtime — hardcode as a constant)"*.
- **Risk if wrong:** Negligible; confirmed by explicit specification.

---

### Assumption 7: Branch Code Equality Semantics
- **Assumption:** Branch matching is strict equality after trimming whitespace and converting to lowercase. No fuzzy matching, abbreviation expansion, or alias mapping is performed (e.g., `"CS"` does not match `"CSE"`, `"Electrical"` does not match `"EEE"`).
- **Rationale:** Contract 1 specifies: *"Do not infer branch aliases or related skills."*
- **Risk if wrong:** Users typing common aliases or long-form department names will see `BRANCH_NOT_ALLOWED`.
