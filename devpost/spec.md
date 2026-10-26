---
doc: spec
status: approved
---

# SpecLock — Technical Specification

## How This Works, In Plain Language

SpecLock is a React application that runs entirely in the browser. The page shows one review workspace: a project baseline on the left, proposal input in the middle, and evidence-backed findings and decisions on the right.

The review logic is TypeScript code with no server dependency. Three named fixtures always return known, tested results, so the demo remains reliable without a network connection or model. For edited and custom proposals, a small rule engine scans for explicit evidence patterns. It may produce a definite finding only when the proposal quotes a direct contradiction. Relevant but incomplete evidence produces a potential finding. Text outside the engine's supported rules produces an Unable to assess result, never a false **No conflicts detected**.

The browser stores the current baseline, proposal versions, findings, decisions, and lightweight history for the current browser session. The baseline is immutable while the app is running.

Source:
- `scope.md > The Unique Kernel`
- `scope.md > The POC Boundary`
- `prd.md > The Core Journey`
- `prd.md > Review Findings`
- `prd.md > Resolution Decisions`

## The Core Journey Through the System

1. App startup loads the immutable Northstar Notes baseline fixture and the initial scenario into React state.
2. The developer selects a scenario or edits proposal text. This creates a draft proposal only; it does not modify the baseline.
3. Review Proposal calls a pure review engine with the draft text and baseline.
4. The engine first checks exact seeded-fixture IDs. Fixture matches return their pre-tested evidence objects.
5. Otherwise, the engine runs deterministic rule checks, returning definite findings, potential findings, no conflict, or Unable to assess.
6. The UI displays loading briefly, then maps findings into certainty/evidence cards or a **No conflicts detected** state.
7. Accept or Reject stores the selected decision on the finding. Revise opens editable text and preserves the previous proposal and result in history.
8. Submitting a revision creates a new review version and calls the engine again against the same baseline.
9. History and the current result remain in browser session state.

PRD ref: `prd.md > The Core Journey` and `prd.md > Features and Behavior`.

## Stack

- **React 18+ with TypeScript** — component-based interface for the single-screen workspace. React is selected because the app is interactive but otherwise small.
- **Vite** — fast local development and static production builds in GitHub Codespaces.
- **Vitest** — deterministic unit and component tests for review rules, fixtures, state transitions, and PRD acceptance criteria.
- **Lucide React** — familiar interface icons such as check, alert triangle, reject, and revision controls. This avoids hand-built iconography.
- **CSS Modules or plain CSS variables** — sufficient styling control for a single premium developer-tool screen without adding a component framework.
- **Browser APIs and `sessionStorage`** — lightweight session state and page-refresh continuity. No backend or database.

Documentation links should be added during the build from package manifests and verified package versions. The exact Node.js and package versions will be recorded during scaffolding rather than claimed here.

The main tradeoff is that React/Vite setup is more explicit than a single HTML file, but it gives TypeScript evidence objects, state transitions, and Vitest coverage without infrastructure.

## Where It Runs and How Someone Tries It

The MVP runs locally in the browser during a Codespaces session. There is no backend, API key, deployment, database, external service, or live AI call.

```bash
npm install
npm run dev
```

Open the forwarded Vite URL shown by Codespaces. The required demo uses the local app and a screen recording; deployment is deferred.

## Look and Feel

Implement `prd.md > Look and Feel` as a restrained developer workbench:

- Neutral light canvas with strong ink and border contrast; a small amber accent for potential findings and a strong red/burgundy accent only for definite conflicts.
- Definite findings use a crossed-out block or danger icon plus the text `DEFINITE CONFLICT`; potential findings use a question/dashed marker plus `POTENTIAL CONFLICT`.
- Source quotations use monospace typography, stable requirement IDs use compact badges, and proposal excerpts use a highlighted source quotation block.
- Dense but readable three-area desktop layout; narrow viewports stack proposal, baseline, and findings rather than introducing another navigation mode.
- Copy stays direct and non-conversational: status, evidence, uncertainty, and action.

Color alone never communicates certainty.

## Components

### App Shell

Owns the top bar, project identity, compact review status, and responsive three-area layout.

PRD ref: `prd.md > Screens and Layout` and `prd.md > Look and Feel`.

### ProjectBaselinePanel

Renders the immutable Northstar Notes baseline, grouped by requirements, constraints, exclusions, and acceptance criteria. Each item has a stable ID and exact source text.

PRD ref: `prd.md > Seeded Demo Project` and `prd.md > Screens and Layout`.

### ProposalWorkspace

Provides scenario buttons for definite, compatible, and ambiguous fixtures, an editable textarea, review action, loading state, and empty-input handling.

PRD ref: `prd.md > Proposal Scenarios and Input`.

### FindingsPanel

Renders finding cards, classification, requirement ID and exact source text, proposal excerpt, explanation, unresolved ambiguity text, and resolution controls. It also renders the exactly phrased compatible and Unable to assess states.

PRD ref: `prd.md > Review Findings`, `prd.md > Definite Conflict Scenario`, and `prd.md > Ambiguous Scenario`.

### ResolutionPanel

Explicitly invokes Accept, Reject, or Revise. Accept and Reject preserve evidence, mark the finding resolved, and render persistent `Decision recorded` copy. Revise switches the proposal workspace into editing mode with its original text.

PRD ref: `prd.md > Resolution Decisions` and `prd.md > Next Steps`.

### NextStepsPanel

Displays the implementation checklist and regression-test suggestions for a reviewed or compatible result. It labels suggestions as guidance and never displays them as executed.

PRD ref: `prd.md > Next Steps`.

### ReviewHistory

Stores lightweight session entries and supports selecting a prior version, viewing its original evidence, and navigating between it and the revised proposal.

PRD ref: `prd.md > Review History and Comparison`.

### Review Engine

Pure TypeScript module exposed through scenario fixtures and rule functions. It has no UI dependencies and no network or AI calls. It returns evidence objects and `status` values only from deterministic logic.

PRD ref: `prd.md > Proposal Scenarios and Input`, `prd.md > Review Findings`, and the MVP hybrid-review constraints supplied for `4-spec`.

## Review Engine Contract

### Result Types

```ts
type FindingClassification = "definite" | "potential";

type FindingStatus = "unresolved" | "accepted" | "rejected";

type ReviewStatus =
  | "definite_conflict"
  | "potential_conflict"
  | "no_conflict"
  | "unable_to_assess";

interface EvidenceQuote {
  requirementId: string;
  requirementText: string;
  proposalExcerpt: string;
}

interface Finding {
  id: string;
  classification: FindingClassification;
  evidence: EvidenceQuote[];
  explanation: string;
  unresolvedQuestion?: string;
  status: FindingStatus;
  decision?: "accepted" | "rejected";
}

interface ReviewResult {
  status: ReviewStatus;
  proposalText: string;
  findings: Finding[];
  nextSteps: {
    implementationChecklist: string[];
    regressionTests: string[];
  };
  unableToAssess?: string;
}
```

The data model uses exact source strings, not inferred paraphrases, for `requirementText` and exact excerpts copied from the proposal.

### Decision Rules

The engine must use the following mutually exclusive policy:

- **Definite conflict:** emit only when the proposal contains explicit evidence that directly contradicts the exact text of at least one real, stable baseline requirement ID. Both sides of the contradiction must be source-verifiable. If one side requires inference or an ambiguous implementation assumption, do not emit definite.
- **Potential conflict:** emit when a relevant baseline requirement is implicated but complete direct evidence is absent, the proposal's data or network behavior is unclear, or interpretation is required to determine the contradiction. The finding must name the unresolved question and show exact baseline text plus the exact proposal excerpt that triggered review.
- **No conflicts detected:** emit only when a supported rule or tested fixture establishes that the proposal does not contradict the checked requirements. This is not the default for unknown text and never means “universally safe” or “comprehensively analyzed.” For a custom proposal, no-conflict requires explicit evidence that the proposition is local, contains no prohibited side effect, and falls wholly within reviewed rule coverage.
- **Unable to assess:** emit when relevant requirements cannot be matched reliably, required proposal facts are missing, or no supported rule can establish a result. This state must show an explicit limitation and clarification request. It must not display findings or **No conflicts detected**.

No text match, absence of keywords, engine error, or unsupported rule may be converted into `no_conflict`. Incomplete coverage always produces potential conflict or unable-to-assess according to whether a relevant requirement was identified.

### Fixture-First Rules

The review engine checks scenario fixture IDs before text rules:

- **Definite fixture:** proposal contains direct third-party transmission and includes a user email. It returns a definite finding against `SEC-001`, `PRIV-001`, and `EXC-001`, quoting the exact proposal sentence and exact baseline source text.
- **Compatible fixture:** the local appearance shortcut contains no network, persistence, personal-data, synchronization, account, or export behavior. It returns `no_conflict` with no finding-resolution controls.
- **Ambiguous fixture:** external telemetry or synchronization behavior is mentioned without stating whether data leaves the device. It returns a `potential` finding against the relevant requirement and names the missing fact.

Fixtures are protected by Vitest tests with exact expected IDs, statuses, quotations, and next-step expectations.

### Custom Proposal Rules

The UI must expose the engine result as one of four states: Definite conflict, Potential conflict, No conflicts detected, or Unable to assess. It must not expose a generic empty-result or model-error state as compatible.


Only deterministic phrase and negation patterns are in scope:

- If text expressly describes external transmission to a third party, direct contradiction rules evaluate `SEC-001` and relevant privacy/collection requirements.
- If text expressly mentions personal data being sent, exported, synchronized, or uploaded, it evaluates `PRIV-001` and `EXC-001` alongside `SEC-001`.
- If text mentions external transmission, synchronization, cloud storage, or APIs but does not establish data leaves the device, return a potential finding naming what is missing.
- If text clearly describes only local appearance, device state, or shortcut behavior with no prohibited side effect, return no conflict only when all unsupported terms are absent from the proposal and the fixture or local-only rule explicitly supports that result. The conservative path is preferred.
- If relevant constraints cannot be matched to direct evidence or supported rule patterns, or required proposal facts are missing, return `unable_to_assess` with a clarification request.
- If relevant baseline text is identified but the contradiction depends on interpretation, return `potential_conflict` instead of unable-to-assess or definite.

Unable-to-assess is not a compatible result. It never displays **No conflicts detected** or implies successful comprehensive analysis.

### Evidence Extraction

For every finding:

1. Locate the exact baseline source string by stable requirement ID.
2. Locate a contiguous or precise quotation of the proposal text that supports the finding.
3. Copy the proposal excerpt directly from user input, trimming only whitespace around its boundaries.
4. Store the source positions or normalized sentence boundary in the review object for UI highlighting.
5. Explain the contradiction from evidence rather than inferred intent.

Every finding must contain at least one real baseline requirement from the immutable Northstar Notes fixture, exact `sourceText`, an exact non-empty `proposalExcerpt` copied from the submitted proposal, and an evidence-based explanation. If those invariants cannot be satisfied, generate no finding and return `potential_conflict` only when relevant uncertainty can still be shown, otherwise return `unable_to_assess`. Never infer a requirement ID or fabricate proposal evidence.

### Modularity

The review engine exposes `reviewProposal(baseline, proposal, fixtureMatch?)`. Rule implementations can later be replaced or augmented by an adapter that returns the same `ReviewResult` contract. AI interpretation is not allowed to bypass evidence extraction or certainty rules and may not change Accept, Reject, or Revise semantics.

## Data Model

### BaselineRequirement

```ts
interface BaselineRequirement {
  id: string;
  category: "requirement" | "constraint" | "exclusion" | "acceptance";
  title: string;
  sourceText: string;
  stable: true;
}
```

The baseline fixture is immutable in app code. `stable` means a requirement cannot be edited or replaced by review actions.

### ProposalDraft and ReviewVersion

```ts
interface ProposalDraft {
  text: string;
  scenarioId: "definite" | "compatible" | "ambiguous" | "custom";
}

interface ReviewVersion {
  id: string;
  version: number;
  proposalText: string;
  parentVersionId?: string;
  reviewedAt: string;
  result: ReviewResult;
  decisions: {
    findingId: string;
    decision: "accepted" | "rejected";
    recordedAt: string;
  }[];
}
```

Each review creates a new immutable-in-result version. The first version has no parent. Revision creates a child version containing the revised proposal, a fresh `ReviewResult`, and no inherited finding decisions. A child may refer to its parent only for comparison; it does not copy unresolved findings or decisions and does not alter them. The original version remains in history with its exact proposal, evidence, resolution status, and finding-level decisions.

Accept records `{ findingId, decision: "accepted" }` only on the active finding. Reject records `{ findingId, decision: "rejected" }` only on that finding. Neither object means feature approval, implementation approval, implementation, or test execution.

### Browser State

Use React state for active UI data and `sessionStorage` under one versioned session envelope for refresh continuity:

- `speclock.session.v1` — `{ baselineId, baseline, proposalDraft, reviewVersions, activeVersionId }`
- Baseline is a read-only copy initialized once from the immutable Northstar fixture.
- Proposal drafts exist separately from submitted review versions.
- Review versions are append-only during the session; revision never overwrites a parent result.
- Decisions are persisted inside the relevant finding and version, not in a separate mutable approval record.

Before hydration, validate IDs against the immutable fixture, verify every finding's requirement ID, exact baseline text, exact proposal excerpt, and review-version relationships, then parse the envelope with a runtime schema. Storage behavior:

- **Unavailable:** keep working with React in-memory state for the current page; show no claim that refresh persistence is available.
- **Read failure:** restore the seed baseline and empty current history, while displaying `Session history unavailable`; do not fabricate prior findings.
- **Write/quota failure:** preserve the current React session, mark the history entry `session only`, and show `History could not be saved for refresh`; never silently discard or rewrite earlier in-memory evidence.
- **Corrupt envelope or schema mismatch:** discard only the invalid persisted envelope, restore the seed baseline and empty history, and display a retryable `Saved session could not be restored` state.
- **Storage cleared externally:** React state remains unchanged until the next hydration or review action; no baseline change occurs.

The original project baseline is always loaded from code and cannot be mutated by proposal text, review rules, decisions, revisions, or storage recovery.

## File Structure

```text
spec-lock/
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   └── spec.md
├── src/
│   ├── app/
│   │   └── App.tsx                 # Workspace composition
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── ProjectBaselinePanel.tsx
│   │   ├── ProposalWorkspace.tsx
│   │   ├── FindingsPanel.tsx
│   │   ├── ResolutionPanel.tsx
│   │   ├── NextStepsPanel.tsx
│   │   └── ReviewHistory.tsx
│   ├── data/
│   │   ├── northstarBaseline.ts
│   │   └── seedScenarios.ts
│   ├── review/
│   │   ├── reviewEngine.ts
│   │   ├── rules.ts
│   │   ├── evidence.ts
│   │   └── fixtures.ts
│   ├── state/
│   │   └── reviewStore.ts          # React state plus sessionStorage
│   ├── styles/
│   │   └── app.css
│   ├── types/
│   │   └── review.ts
│   └── main.tsx
├── src/**/*.test.ts                # Review-engine unit tests
├── src/**/*.test.tsx               # Component behavior tests
├── package.json
├── vite.config.ts
└── README.md
```

Generated dependency directories are not enumerated.

## Test Strategy

### Deterministic Engine Tests

Vitest fixture tests must verify:

- The definite fixture returns definite certainty only with `SEC-001`, `PRIV-001`, and `EXC-001` evidence relevant to the direct contradiction.
- Every definite finding contains a requirement ID, exact baseline source text, proposal excerpt, and explanation.
- The ambiguous fixture returns potential certainty and names what must be clarified.
- The compatible keyboard shortcut returns `no_conflict`, not a finding, Unable to assess, or universal-safety claim.
- Custom external-transmission prose returns definite certainty only for direct contradiction patterns with direct proposal evidence.
- Unsupported custom text returns unable-to-assess, not potential conflict when no relevant requirement uncertainty exists and not no-conflict under any condition.
- Relevant ambiguous custom text returns potential finding rather than definite, unable-to-assess, or no-conflict when the rule identifies relevant requirement uncertainty.
- Keyword absence, unknown text, engine exceptions, and unsupported custom rules never return no-conflict.
- The compatible fixture returns no-conflict through an explicit supported-rule test, not via an empty findings list from an unknown engine state.
- Every finding invariant is tested: real baseline ID, exact baseline source, exact proposal excerpt present in the original proposal, and non-empty evidence explanation.
- Tests cover positive evidence, missing baseline text, missing proposal text, empty quote, fabricated ID, and mismatched proposal excerpt.

### UI Behavior Tests

Vitest and React DOM test utilities verify:

- Empty and whitespace-only submission shows an error and creates no review version.
- Loading status blocks duplicate submission and review-state mutation.
- SessionStorage unavailable, read failure, write/quota failure, corrupt data, and externally cleared storage follow the documented fallback behavior.
- History remains accessible and decisions remain visible when switching between review versions.
- Compatible and Unable to assess states have no Accept, Reject, or Revise controls.
- Definite and potential findings show text and symbolic distinctions.
- Accept records acknowledged status and persistent confirmation; Reject records dismissal status and persistent confirmation.
- Neither Accept nor Reject claims implementation or testing or decides whether the proposed feature is approved.
- Revise opens the original proposal text, preserves the parent evidence and decisions, and creates a new review version after re-review; the child has no inherited finding decisions.
- Accept and Reject record only finding-level status and confirmation; UI copy never treats either as proposal approval, implementation, or test completion.
- Refresh can restore a valid session envelope or falls back without corrupting the seeded baseline.
- A no-external-network test fails the build or relevant test suite if any core dependency or review path initiates an HTTP request, fetch call, live model request, or service integration.

### Traceability Matrix

| PRD Requirement | Implementation | Tests |
|---|---|---|
| `Screens and Layout > Single Review Workspace` | App Shell, panel components, responsive CSS | Workspace render and viewport smoke tests |
| `Seeded Demo Project` | Immutable Northstar baseline fixture with stable IDs | Stable-ID, exact-source, and baseline-integrity tests |
| `Definite Conflict Scenario` | Fixture-first result and evidence extractor | Definite fixture, direct-evidence, ID, quote, and explanation tests |
| `Compatible Scenario` | Supported compatible fixture and explicit no-finding renderer | Compatible fixture, no-finding, hidden-controls, and guidance tests |
| `Ambiguous Scenario` | Ambiguous fixture and potential-result renderer | Potential status, unresolved-question, and evidence tests |
| `Review Findings` | Finding card and evidence-quote invariant | Real-ID, exact-source, exact-proposal-quote, and explanation assertions |
| `Resolution Decisions` | Finding-level Accept, Reject, and Revise state transitions | Decision semantics, confirmation, and feature-approval-copy tests |
| `Review History and Comparison` | Append-only review versions and session envelope | Parent preservation, child isolation, decision history, and version comparison tests |
| `Next Steps` | Grounded checklist and regression suggestions | Suggestion-grounding and not-executed-copy tests |
| `States and Boundaries` | Review status union, UI fallback components, and storage handling | Empty, loading, error, Unable to assess, compatible, storage-failure, and evidence-integrity tests |
| `Acceptance Criteria` | Unit and component acceptance suites | Vitest command and named acceptance test suite |
| No external network dependency | Browser-only review engine and static assets | Request/fetch/live-call assertion and build output check |

## External Services and Dependencies

None are required for core behavior:

- No backend or database.
- No API key or paid model.
- No external network service.
- No live AI call.
- npm packages and browser assets are build-time dependencies only; external package CDN loading is not used by the app.

This is the fallback for a disconnected demo. AI interpretation may be integrated later behind the existing review engine adapter but is not available in the MVP.

## Important Failure Modes

- **Empty proposal:** no review object is created; show `Enter a proposal before reviewing`.
- **Unsupported custom prose:** show Unable to assess with the relationship that could not be established and a clarification request; do not show a finding or No conflicts detected.
- **Review rule ambiguity:** classify as Potential conflict, not Definite, and name the missing fact.
- **Storage unavailable or corrupt:** keep an in-memory review usable, preserve evidence already loaded, and label persistence limitations without changing the baseline or verdict.

- **Invalid session state:** restore the seeded baseline and preserve usable empty history rather than loading stale findings.
- **Duplicate review submission:** loading status disables submission until the current synchronous review finishes.

## Security and Privacy

- Proposal text remains in browser session state unless the developer intentionally exports or publishes it in a future feature.
- No network requests are sent by the core review engine or UI.
- The demo baseline and proposals contain fictional data only.
- Avoid logging proposal text, findings, or decisions to external analytics.
- `sessionStorage` is not a security boundary; no sensitive data belongs in it for the MVP.
- Do not use model-generated text that cannot cite exact fixture or proposal evidence.
- Use text escaping in React rather than rendering user content as HTML.

## What Was Simplified and Why

- **Fixtures instead of live inference:** the three demo outcomes are the same every time and prove certainty, evidence, and actions without network availability. Arbitrary custom text receives only supported deterministic rules.
- **`sessionStorage` instead of a database:** it preserves enough history for the one-minute demo without accounts, infrastructure, or backend code.
- **Synchronous local review instead of a service:** the user sees a short loading state, but evidence generation is immediate and reproducible.
- **React/Vite instead of a backend framework:** the approved one-screen workflow does not require a server.
- **Rule patterns instead of NLP dependencies:** small and explainable, with an explicit Unable to assess result when coverage is insufficient.

## Decisions and Open Issues

### Agreed Decisions

- React, TypeScript, and Vite provide the smallest familiar browser build for this team and environment.
- Vitest validates fixtures, engine rules, evidence extraction, and UI resolution states.
- Custom proposals use conservative deterministic rules; unsupported text cannot become a compatible result.
- Definite findings require explicit direct contradiction evidence.
- Potential findings require relevant baseline uncertainty and exact evidence excerpts.
- Unable-to-assess requires explicit lack of reliable evidence or rule coverage and never displays No conflicts detected.
- Session storage is the current-session persistence mechanism; storage failure must not delete or rewrite loaded in-memory review history.
- Potential findings identify relevant but incomplete evidence.
- Browser session state stores baseline references, proposal versions, findings, and review decisions.
- Deployment is deferred; local Codespaces plus a recorded demo is the MVP delivery path.

### Genuine Unknown Clarified

The custom-proposal engine's NLP coverage is intentionally bounded because the project has no live model requirement and no need to pretend arbitrary prose is comprehensively understood. A proposal is definite, potential, compatible, or unable to assess based on direct deterministic evidence. The implementation will verify this boundary through explicit engine tests rather than add a separate learning exercise.

### Open Issues

- None block specification approval.
- Package versions and documentation links will be verified during build scaffolding.
- Optional deployment remains deferred and may be reconsidered after core acceptance criteria pass.
