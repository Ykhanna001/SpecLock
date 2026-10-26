---
doc: scope
status: approved
---

<!-- Scope is the broad overview of the proof of concept, not a detailed PRD. -->

# SpecLock

One line: SpecLock is an evidence-backed developer review tool that checks proposed changes against explicit project requirements and shows exactly when and how certain a conflict is.

## The Unique Kernel
The defining behavior is **evidence-backed conflict detection with calibrated certainty**. During a review, SpecLock links each finding to the exact requirement or constraint involved, quotes the relevant proposal evidence, explains the conflict, and classifies the result as a definite conflict or a potential conflict requiring human judgment. A definite conflict requires direct evidence that an explicit project requirement contradicts the proposed change; incomplete evidence or interpretation required by the reader produces a potential conflict instead. Each baseline requirement has a stable ID, and every finding cites the applicable ID plus exact source text. The developer sees why a finding exists and how much confidence the conclusion deserves, rather than receiving an unqualified AI criticism.

## Who It's For
Individual developers and small teams who build software with AI coding agents and need to catch requirement drift before generated changes become implementation decisions. It is especially useful to someone reviewing a feature request or implementation proposal after project decisions have already been recorded.

## The Core Loop
The developer opens a seeded project or loads a small project specification, submits a natural-language feature request or implementation change, and runs a SpecLock review. The review is presented as a requirement traceability view with findings linked to exact evidence on both sides. For each definite or potential conflict, the developer can accept, reject, or revise the finding and carry the decision into an implementation checklist and regression-test suggestions. The repeatable unit is one proposal reviewed against one explicit project baseline.

## Inspiration & Identity
SpecLock takes its identity from the learner's experience maintaining consistency across requirements, implementation decisions, and later AI-assisted changes. It should feel like a serious developer workbench: dense but readable, calm rather than conversational, and visually oriented around evidence, certainty, and decision flow. Familiar developer-tool patterns, strong hierarchy, and clear visual states matter more than decorative AI language.

## Why This Matters to the Learner
It addresses a recurring weakness in AI-assisted development: generated changes can silently contradict recorded decisions because the project context is spread across chats, documents, and memory. SpecLock is also a way to practice a systematic plan-first workflow, traceability, assumption-challenging, and testable verification.

## What "Working" Looks
A judge opens the app and sees a realistic seeded project with explicit requirements, constraints, exclusions, and acceptance criteria. The same screen offers conflicting and compatible example requests. Selecting or submitting the deliberately conflicting request produces a reliable definite finding, such as a proposed third-party request that transmits user data despite an explicit prohibition on external network requests, with exact quoted evidence on both sides and a clear explanation. The judge can inspect an ambiguous proposal and see it classified as a potential conflict instead of a definite violation. Switching to the compatible request produces no finding for the prohibited behavior. The developer then sees the decision tools and concise implementation and regression guidance derived from the review.

## The POC Boundary
The MVP includes:

- A seeded project baseline with stable-ID requirements, constraints, exclusions, and acceptance criteria.
- Natural-language entry for a proposed feature or implementation change.
- Review against the seeded project context.
- Definite conflict and potential-conflict classifications.
- Direct evidence quotes from the project baseline and proposal.
- An explanation for each finding.
- Developer accept, reject, or revise actions that record a clear review decision and produce appropriate next steps.
- Accept records the finding as accepted; reject records the finding as rejected; revise records the revised proposal or resolution decision.
- Generated implementation checklist and regression-test suggestions support the review outcome without silently changing the original project baseline.
- A small implementation checklist and regression-test suggestions generated from the accepted review context.
- A visually polished evidence-and-certainty view that works end to end in the browser.

## Later
- Editable project baselines for arbitrary projects.
- Pasted diff inspection.
- GitHub and repository integration.
- Shared team workspaces, comments, and review history.
- Continuous checking in an IDE or coding-agent workflow.
- Arbitrary repository parsing and codebase-aware analysis.
- More advanced requirement management, integrations, and automated policy enforcement.

## Explicitly Cut
- **Generic AI chatbot interface:** Chat does not demonstrate traceability or calibrated evidence better than a focused review workbench.
- **Claims of guaranteed code correctness:** The product reports evidence-backed findings and uncertainty; it does not certify that a change is safe or correct.
- **GitHub integration and repository parsing:** Both would consume the short deadline without directly proving evidence-backed conflict detection.
- **Pasted diff analysis:** Useful later, but text proposals are the smallest input that can prove the core comparison workflow.
- **Large project-management feature set:** Editing, collaboration, dashboards, histories, and integrations distract from one reliable end-to-end review.
- **Broad model benchmarking or automatic code generation:** The proof depends on trustworthy findings, not producing or deploying generated application code.
