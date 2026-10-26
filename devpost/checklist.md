---
doc: checklist
status: approved
---

# Build Checklist

Build mode: Fast mode

## Slices

- [x] **1. Scaffold and prove the deterministic review engine**
  Becomes usable: A local React/TypeScript/Vite app starts in Codespaces, and the three seeded outcomes produce tested definite, compatible, and potential results with exact requirement and proposal evidence.
  Why now: The evidence kernel is the greatest risk and must be runnable before interface work.
  PRD ref: `prd.md > Seeded Demo Project`, `prd.md > Definite Conflict Scenario`, `prd.md > Compatible Scenario`, `prd.md > Ambiguous Scenario`, `prd.md > Acceptance Criteria`
  Spec ref: `spec.md > Stack`, `spec.md > Review Engine Contract`, `spec.md > Fixture-First Rules`, `spec.md > Custom Proposal Rules`, `spec.md > Test Strategy`
  Build: Scaffold the Vite React TypeScript project and install Vitest; add immutable Northstar baseline and scenario fixtures; implement the stable evidence, finding, review-result, proposal, and review-version data models; define the parent-version relationship and immutable historical evidence; implement finding-level Accept/Reject status and revision creation semantics with no prior-evidence mutation; implement evidence extraction invariant, fixture-first engine, conservative custom rules, and Unable-to-assess fallback.
  Verify (mechanical): Run `npm test` and confirm fixture, evidence-integrity, classification-boundary, custom-fallback, and no-network tests pass; run `npm run build` and confirm compilation succeeds.
  Learner check: Run the engine through the test-supported scenarios or small scripts and confirm one definite result, one No conflicts result, and one potential result include exact evidence rather than generic output.
  Commit: `Scaffold app and establish deterministic review engine`

- [x] **2. Build the single-screen evidence workspace**
  Becomes usable: The local app displays the current project, persistent baseline, editable proposal scenarios, review loading/error states, and evidence-centered findings.
  Why now: It makes the kernel observable and verifies the one-minute demo layout before resolution behavior is added.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`, `prd.md > Proposal Scenarios and Input`, `prd.md > Review Findings`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > App Shell`, `spec.md > ProjectBaselinePanel`, `spec.md > ProposalWorkspace`, `spec.md > FindingsPanel`, `spec.md > Look and Feel`
  Build: Compose the responsive single-screen workspace with top bar, baseline panel, proposal input/scenario controls, loading and empty/error states, definite/potential/evidence cards, compatible state, and Unable-to-assess state.
  Verify (mechanical): Run Vitest component tests and `npm run build`; start the app and verify the three seeded scenarios render the correct visual classifications and exact citations.
  Learner check: Open the running app, try all three scenario buttons, edit one proposal, and confirm the baseline remains visible and the evidence is more prominent than commentary.
  Commit: `Build evidence review workspace`

- [x] **3. Deliver the complete end-to-end working flow**
  Becomes usable: The full core loop works from seeded proposal selection through evidence findings, finding-level Accept or Reject decisions, revision into a new review version, preserved comparison history, implementation guidance, and regression-test suggestions on one running screen.
  Why now: It completes the product decision path and is independently verifiable without adding storage infrastructure.
  PRD ref: `prd.md > Resolution Decisions`, `prd.md > Next Steps`, `prd.md > Review History and Comparison`, `prd.md > Product Decisions`
  Spec ref: `spec.md > ResolutionPanel`, `spec.md > NextStepsPanel`, `spec.md > ReviewHistory`, `spec.md > ProposalDraft and ReviewVersion`, `spec.md > Browser State`
  Build: Add finding decision state, persistent `Decision recorded` confirmation, revision editing/submission, immutable review versions, history selection/comparison, compatible next steps, session envelope storage with validated recovery fallbacks, and complete integration of every PRD core-journey behavior so the flow is usable end to end.
  Verify (mechanical): Run all Vitest state/UI tests plus `npm run build`; verify Accept/Reject semantics, revision isolation, refresh restoration or safe fallback, and evidence preservation.
  Learner check: Accept or reject a definite finding, revise the proposal, submit it, switch history entries, and confirm original evidence and decisions remain preserved without changing the baseline.
  Commit: `Complete decisions revisions and session history`

- [ ] **4. Test, harden, and prepare the complete demo**
  Becomes usable: The existing local demo passes its acceptance suite and is ready for recording from GitHub Codespaces.
  Why now: Final hardening catches integration gaps, storage edge cases, copy leaks, accessibility/responsive defects, and one-minute journey defects without expanding the product.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Acceptance Criteria`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Test Strategy`, `spec.md > Important Failure Modes`, `spec.md > Traceability Matrix`, `spec.md > Security and Privacy`
  Build: No new product features. Add only defect fixes, final accessibility and responsive checks, session fallback fixes if tests expose defects, no-external-network verification, and exact local demo/run documentation.
  Verify (mechanical): `npm test` passes all 53 tests; `npm run lint`, `npx tsc -b`, `npm run build`, and `git diff --check` pass. Automated tests cover evidence integrity, deterministic outcomes, revision/history, and simulated `sessionStorage` restoration. The Codespace dev server returned the app page and local SVG successfully on port 5174; Vite selected that port because 5173 was already in use. No browser executable or automation package is available here, so live interaction and actual viewport rendering were not verified.
  Learner check: Pending live browser exploration at desktop and narrow widths: run definite, compatible, ambiguous, revision/history, and refresh flows; check the header, proposal action, findings empty/populated states, and report any clipping or confusing copy.
  Commit: `Finalize SpecLock demo and verification`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after Slice 2 the learner tries the workspace and seeded scenarios. Completion is not recorded in the available checklist history.
- [ ] Final kick-the-tires exploration and feedback completed after Slice 4.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — plan-first familiar route connecting one approval criterion, review engine, and test
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown as a reference guide (not as a completed learner tour)

Activity and evidence: Created a reference-only guide from `src/App.tsx` (`runReview`, `FindingResult`, `ReviewHistory`, `ReviewComparisonPanel`), `src/state/reviewStore.ts` (`nextReviewVersion`), `src/review/reviewEngine.ts` (`reviewProposal`), and `src/review/evidence.ts` (`assertFindingEvidence`). Source paths were checked. No learner walkthrough or reflection was performed.
Route and stops: Reference route only; no interactive code-tour stops completed. See `app-map.html`.
Edit outcome: Not offered; no edit activity performed.
Reflection: Not offered; no learner response recorded.
Activity mode: Static source inspection and markup/link validation. The app map is a reference, not a completed learning activity.

## Revisions
- Slice 4 browser exploration remains pending because this environment has no browser executable or automation package; the app is serving on port 5174 for live learner review. No behavior or baseline changes were made.
- No changes were committed because the user explicitly requested that all work remain uncommitted.
