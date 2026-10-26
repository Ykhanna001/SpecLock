---
doc: prd
status: approved
---

# SpecLock — Product Requirements

One line: SpecLock is a single-screen developer review workspace that compares natural-language proposals against explicit project decisions and presents evidence-backed findings with calibrated certainty.

Source: `scope.md > The Unique Kernel`, `The Core Loop`, `What "Working" Looks Like`, and `The POC Boundary`.

## The Core Journey

1. The developer opens SpecLock and sees a current seeded project in the top bar.
2. The developer sees the project baseline, proposal workspace, findings, and next steps on one review surface.
3. The developer selects a seeded conflicting, compatible, or ambiguous proposal, or edits any proposal in natural language.
4. The developer submits the proposal for review.
5. SpecLock compares the proposal only with the unchanged project baseline and presents a loading state, then either a finding list or **No conflicts detected**.
6. For each conflict, the developer inspects the certainty label, requirement citation, proposal quote, and explanation.
7. The developer explicitly Accepts, Rejects, or Revises the finding.
8. SpecLock records the decision, shows persistent confirmation and next steps, and preserves the original evidence and proposal in review history.
9. When Revising, the developer edits the original text and submits it as a new review version against the same baseline.
10. The developer can compare review versions and open an implementation checklist and regression-test suggestions for the current decision or compatible result.

Success means a developer can complete this full path, with a seeded finding, in roughly one minute.

## Screens and Layout

### Single Review Workspace

The workspace has four persistent areas:

- **Top bar:** SpecLock branding, the current project name, and a compact review status indicator.
- **Project baseline panel:** Requirements, constraints, exclusions, and acceptance criteria remain visible while proposals are reviewed.
- **Proposal workspace:** Editable natural-language proposal text, three seeded scenario selectors, and a Review Proposal action.
- **Findings and resolution panel:** The visual centerpiece for findings, certainty, evidence, decisions, checklist, test suggestions, and review history.

On narrower screens, the areas stack without hiding the project baseline from access. Findings remain prioritized above decorative or secondary content.

## Seeded Demo Project

### Project: Northstar Notes

A fictional local-first notes application is seeded for reliable demonstration.

The baseline includes stable IDs and exact source text:

- **SEC-001 — External network:** “The application must make no external network requests. All note data must remain on the current device.”
- **PRIV-001 — Personal data:** “Analytics events may collect product usage counters only and must not include user identity, message content, or contact information.”
- **AC-001 — Compatibility:** “Core note creation must work offline and must remain usable after browser storage is unavailable.”
- **EXC-001 — Scope exclusion:** “The product does not include cloud synchronization, account systems, or third-party data exports.”

Every finding links to one or more applicable IDs and repeats the exact source text for that requirement.

## Look and Feel

The interface should feel like a premium developer workbench rather than a chat product: restrained neutral surfaces, strong information hierarchy, legible source-code-style text, careful spacing, and compact status indicators.

Definite and potential findings must be distinguished by both labels and visual symbols or structure, not color alone. Evidence should use clear quotation treatment and readable proposal excerpts. AI language should remain secondary to citations, explanations, and decisions.

## Features and Behavior

### Proposal Scenarios and Input

- The proposal workspace opens with an empty proposal text area and a helpful placeholder.
- The three scenario selectors choose a test category only; they never populate or overwrite proposal text.
- The developer must enter and may edit or clear proposal text before review. Empty or whitespace-only submissions are blocked with an accessible validation message.
- The developer may edit any seeded or custom proposal before review.
- An empty or whitespace-only proposal is not submitted and shows a concise error with the needed correction.
- Review begins immediately only after Review Proposal is activated.

### Definite Conflict Scenario

A deliberately conflicting proposal must add a third-party analytics integration that transmits a user's email address to an external service.

- The review produces a definite conflict only when the proposal directly contradicts explicit baseline text.
- The finding cites `SEC-001`, `PRIV-001`, and `EXC-001` when all are directly contradicted or relevant to the demonstrated contradiction.
- Each cited requirement includes its exact source text.
- The finding quotes the relevant proposal text, explains why the contradiction is direct, and labels it **Definite conflict**.
- Potential interpretation does not upgrade a finding to definite certainty.

### Compatible Scenario

A proposal to add a local-only keyboard shortcut that changes the editor's appearance is compatible with every seeded baseline requirement.

- The result displays **No conflicts detected**.
- The result explains: “No conflict with the recorded baseline was identified.”
- The result does not claim universal safety, correctness, or implementation readiness.
- Accept, Reject, and Revise controls are hidden because no finding exists.
- The result displays a relevant implementation checklist and regression-test suggestions without changing or expanding the baseline.
- This proposal does not access the network, persist or collect user data, change core note creation or offline behavior, add cloud synchronization, or introduce a third-party export or account system.
- The review result is preserved in in-app history.

### Ambiguous Scenario

An ambiguous proposal may mention telemetry, server synchronization, or an external service without stating whether data leaves the device or whether personal data is involved.

- The system shows a **Potential conflict** finding when interpretation, missing evidence, or missing implementation detail is required.
- A potential finding does not assert a definite contradiction.
- It cites the potentially relevant stable-ID requirement and exact source text.
- It quotes the ambiguous proposal text and names the unresolved question.
- Accept, Reject, or Revise may resolve a potential finding using the same explicit review decision behavior.

### Review Findings

- Each finding includes certainty classification, stable requirement ID, exact requirement quote, relevant proposal quote, and a concise conflict explanation.
- Findings are grouped and readable without closing access to the baseline or proposal workspace.
- Re-running or editing does not silently rewrite an existing review result.

### Resolution Decisions

**Accept, Reject, and Revise each require a separate explicit developer action.**

- **Accept:** acknowledges the finding as a valid concern, marks the finding resolved as Accepted, preserves the finding and evidence, and displays a persistent **Decision recorded — Accepted** confirmation. Acknowledgement does not approve the proposed feature for implementation or claim that it was implemented or tested.
- **Reject:** dismisses the finding as incorrect or inapplicable, marks the finding resolved as Rejected, preserves the finding and evidence, and displays a persistent **Decision recorded — Rejected** confirmation. Dismissal does not approve the proposed feature for implementation or claim that it was implemented or tested.
- **Revise:** preserves the current proposal and findings in history, opens the current proposal text for editing, and creates a new proposal version for re-review only when the developer submits the revised text. Revising does not approve the original or revised proposal for implementation.
- Accepting or rejecting does not imply implementation, testing, or code correctness.
- Rejecting does not alter the project baseline.
- Revising never modifies the baseline.

### Next Steps

After a finding is resolved, or for a compatible no-conflict result, the workspace shows concise next steps:

- An implementation checklist grounded in the proposal, cited baseline evidence, and recorded decision.
- Regression-test suggestions grounded in the review's acceptance criteria and constraints.
- A clear statement that the checklist is guidance and generated tests are suggestions, not executed results.

The developer may not interpret next-step suggestions as completed implementation or test execution.

### Review History and Comparison

- The MVP stores lightweight review history in the current application session.
- Each history entry identifies the review version, original or revised proposal text, findings, evidence, status, and recorded decision.
- Revisions create a new review version while preserving the original proposal and its findings.
- Each review re-runs against the unchanged baseline.
- The developer can compare revised findings with original findings on one screen, with changes or additions called out without hiding prior evidence.
- Compatible and potential results are also retained as history entries.

## States and Boundaries

- **Empty proposal:** no review occurs; explain that proposal text is required.
- **Loading:** show a compact review status and disable duplicate submission without hiding the baseline or current proposal.
- **Definite result:** display direct evidence and actionable resolution controls.
- **Potential result:** display uncertainty, unresolved evidence, and applicable requirement text without overstating a contradiction.
- **Compatible result:** display **No conflicts detected**, hide finding resolution controls, and show next steps.
- **Review error:** preserve entered text and show a retryable, non-chat error state; do not show findings or no-conflict language as though a review completed.
- **Recorded decision:** finding remains visible, marked resolved, and confirmed as Accepted or Rejected.
- **Revision:** original version remains in history and becomes an editable new proposal draft before re-review.
- **Session persistence:** history may remain while the app is open; no account, database-backed audit log, or cross-session guarantee is required.

## Acceptance Criteria

### Core Review
- [ ] Opening the app displays the seeded Northstar Notes project, its baseline, proposal workspace, and review surface in one screen.
- [ ] Selecting or editing a proposal is possible before review without changing the baseline.
- [ ] Submitting an empty proposal does not produce findings and shows a concise input error.
- [ ] Every completed review preserves the proposal text and a review version in in-app history.

### Definite and Potential Findings
- [ ] The conflicting scenario produces a definite conflict for direct contradictions of `SEC-001`, `PRIV-001`, or `EXC-001`.
- [ ] No definite finding may omit its requirement ID, exact source text, exact proposal excerpt, or explanation.
- [ ] A definite finding is shown only when the proposal and baseline explicitly establish a contradiction.
- [ ] The ambiguous scenario produces a potential finding rather than a definite finding or no-conflict result.
- [ ] A potential finding identifies the missing fact or interpretation that prevents definite certainty.
- [ ] Definite and potential findings are visually and textually distinguishable without relying on color.

### Compatible Proposal
- [ ] The compatible scenario displays exactly **No conflicts detected** when submitted.
- [ ] The result states that no conflict with the recorded baseline was identified without claiming universal safety or correctness.
- [ ] Accept, Reject, and Revise controls are absent for the compatible result.
- [ ] The compatible result includes an implementation checklist and regression-test suggestions relevant to the proposal.
- [ ] The compatible review result appears in in-app history.

### Decisions and Revision
- [ ] Accept and Reject require explicit action and do not occur automatically.
- [ ] Accept acknowledges the finding as valid without approving the proposal for implementation or claiming implementation or test completion.
- [ ] Reject dismisses the finding as incorrect or inapplicable without approving the proposal for implementation or claiming implementation or test completion.
- [ ] Revise preserves the original and creates a new proposal version for re-review, without approving implementation or changing the baseline.
- [ ] After Accept or Reject, the finding remains visible, evidence remains visible, and a persistent **Decision recorded — Accepted** or **Decision recorded — Rejected** confirmation appears.
- [ ] Revise preserves the original proposal and findings in history and opens editable proposal text prefilling the original proposal.
- [ ] Submitting a revision creates a new version and re-runs review against an unchanged baseline.
- [ ] The developer can compare a revised review version with its original findings and proposal.
- [ ] Accepting a finding does not state that implementation or tests were completed.

### States and Next Steps
- [ ] Loading status prevents duplicate submissions and does not replace the baseline, proposal, or prior evidence.
- [ ] A review error preserves proposal text and does not present findings or a no-conflict result.
- [ ] Recorded decisions remain clear after switching between history entries.
- [ ] Checklist items and test suggestions are labeled as guidance, not executed implementation or test results.

## Product Decisions

- A single-screen review workspace was chosen over dashboard or chat surfaces to optimize the one-minute demo and keep evidence visible.
- Stable requirement IDs and exact source quotations are mandatory because they are the core traceability mechanism.
- Definite certainty requires direct contradiction of explicit source text; missing evidence produces potential certainty.
- Revision creates a new review version rather than overwriting the original.
- Accept and Reject record only review decisions: Accept acknowledges the finding, Reject dismisses it as incorrect or inapplicable, and neither claims implementation or verification.
- Compatible results need guidance and history but no finding-resolution controls.
- A reliable seeded fixture and deterministic demo examples take priority over arbitrary project editing or repository integration.
- Accept means acknowledgement of the finding, Reject means dismissal as incorrect or inapplicable, and Revise means creating a new proposal version for re-review; none authorizes implementation or testing.
- The compatible seeded scenario changes editor appearance with a local-only shortcut and has no network, persistence, data collection, synchronization, account, or third-party export behavior.

## What We're Building

- Current-project top bar and compact review status
- Persistent project baseline with stable IDs and source text
- Seeded scenario selection and editable proposal input
- Definite, potential, compatible, loading, error, and empty states
- Evidence-linked findings with proposal quotations and explanations
- Explicit Accept, Reject, and Revise actions
- Persistent recorded-decision confirmation
- Implementation checklist and regression-test suggestions
- Lightweight in-app review history and version comparison
- The complete one-screen demo workflow

## Deferred From the POC

- Arbitrary project editing or importing
- Pasted diff analysis
- GitHub and repository integration
- Team collaboration, accounts, comments, and cloud history
- Continuous IDE or agent enforcement
- Execution of suggested tests or implementation of code
- Database-backed audit history

## Possible Later Enhancements

- Import baseline documents
- Compare broader review histories
- Connect findings to repository locations
- Integrate with AI coding agents
- Export review decisions and next steps

## Non-Goals

- This product does not guarantee code correctness, requirement completeness, or universal proposal safety.
- This product does not claim that a decision equals implementation or testing.
- It does not present uncertain evidence as definite.
- It is not a general chatbot, repository analyzer, diff-reviewer, project-management system, or team collaboration product.

## Open Questions

None that block PRD approval. Technical choices, including data storage mechanics, framework, review computation, and test strategy, are explicitly reserved for `4-spec`.
