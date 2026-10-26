# SpecLock

SpecLock is a local, single-screen review workspace. It compares proposal text with the seeded Northstar Notes baseline and shows evidence-backed definite, potential, compatible, or Unable to assess results. Reviews and decisions stay in browser session storage; the core workflow makes no external network requests.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (in Codespaces, open its forwarded port). No API key, backend, database, or deployment is required.

## Demo sequence (about 2 minutes)

1. Point out the immutable Northstar Notes baseline and the empty proposal workspace. Explain that category buttons do not supply proposal text.
2. Select **Definite conflict**, enter a proposal such as “Add a third-party analytics integration that sends each user's email address and account identifier to an external service,” then review it. Show its exact requirement and proposal evidence, then choose **Accept**.
3. Choose **Revise**, keep the updated behavior local, and re-review. Select the original in history to show its preserved decision and evidence; select the revision to compare findings with the actual parent.
4. Select **Compatible change**, enter “Add a local keyboard shortcut that changes the editor appearance using only in-memory theme settings,” and review to show **No conflicts detected**, checklist guidance, and regression suggestions.
5. Select **Potential conflict**, enter “Add optional telemetry synchronization so usage activity can be shared with a dashboard service,” and review to show the ambiguity and unresolved question; choose **Reject** to demonstrate a finding-level decision.
6. Enter a proposal outside the supported rules and review it to show **Unable to assess**, not a false compatible result.

## Verify

```bash
npm test
npm run lint
npx tsc -b
npm run build
```
