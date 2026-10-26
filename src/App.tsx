import { useState } from 'react'
import { AlertTriangle, Check, CircleDashed, FileWarning, GitBranch, History, LockKeyhole, PencilLine, Play, X } from 'lucide-react'
import './App.css'
import { northstarBaseline } from './data/northstarBaseline'
import { seedScenarios, type SeedScenario } from './data/seedScenarios'
import { compareReviewVersion, type FindingComparisonField } from './review/compareVersions'
import type { ScenarioId } from './review/reviewEngine'
import type { Finding, FindingDecision, ReviewResult, ReviewSession, ReviewVersion } from './types/review'
import {
  createInitialSession,
  hydrateReviewSession,
  nextReviewVersion,
  persistReviewSession,
  recordFindingDecision,
  selectReviewVersion,
  storageIssueMessage,
  type StorageIssue,
} from './state/reviewStore'

interface AppStartup {
  session: ReviewSession
  scenarioId: ScenarioId
  proposalText: string
  result: ReviewResult | null
  storageIssue?: StorageIssue
}

function loadAppStartup(): AppStartup {
  const initial = createInitialSession()
  try {
    const loaded = hydrateReviewSession(window.sessionStorage)
    const active = loaded.session.reviewVersions.find((version) => version.id === loaded.session.activeVersionId)
    const proposalText = loaded.session.proposalDraft.text
    return {
      session: loaded.session,
      scenarioId: loaded.session.proposalDraft.scenarioId,
      proposalText,
      result: active && active.proposalText === proposalText
        ? active.result
        : null,
      storageIssue: loaded.issue,
    }
  } catch {
    return {
      session: initial,
      scenarioId: 'custom',
      proposalText: '',
      result: null,
      storageIssue: 'unavailable',
    }
  }
}

function App() {
  const [startup] = useState(loadAppStartup)
  const [scenarioId, setScenarioId] = useState<ScenarioId>(startup.scenarioId)
  const [proposalText, setProposalText] = useState(startup.proposalText)
  const [result, setResult] = useState<ReviewResult | null>(startup.result)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<ReviewSession>(startup.session)
  const [storageIssue, setStorageIssue] = useState<StorageIssue | undefined>(startup.storageIssue)
  const [revisingVersionId, setRevisingVersionId] = useState<string | null>(null)

  const saveSession = (next: ReviewSession) => {
    setSession(next)
    try {
      const issue = persistReviewSession(window.sessionStorage, next)
      setStorageIssue(issue ?? undefined)
    } catch {
      setStorageIssue('unavailable')
    }
  }

  const updateDraft = (text: string, draftScenarioId: ScenarioId) => {
    setScenarioId(draftScenarioId)
    setProposalText(text)
    saveSession({
      ...session,
      proposalDraft: { text, scenarioId: draftScenarioId },
    })
  }

  const selectScenario = (scenario: SeedScenario) => {
    updateDraft(proposalText, scenario.id)
    setResult(null)
    setError('')
  }

  const runReview = () => {
    if (!proposalText.trim()) {
      setError('Enter a proposal before reviewing.')
      setResult(null)
      return
    }

    setError('')
    setIsLoading(true)
    window.setTimeout(() => {
      try {
        const newReview = nextReviewVersion(
          session,
          proposalText,
          scenarioId,
          revisingVersionId ?? undefined,
        )
        saveSession(newReview.session)
        setResult(newReview.version.result)
      } catch (reviewError) {
        setError(reviewError instanceof Error ? reviewError.message : 'Review could not be completed. Please try again.')
        setResult(null)
      }
      setRevisingVersionId(null)
      setIsLoading(false)
    }, 180)
  }

  const activeVersionId = session.activeVersionId
  const activeVersion = session.reviewVersions.find((version) => version.id === activeVersionId) ?? null

  const decideFinding = (versionId: string, findingId: string, decision: FindingDecision) => {
    const updated = recordFindingDecision(session, versionId, findingId, decision)
    saveSession(updated)
    const active = updated.reviewVersions.find((version) => version.id === versionId)
    if (active) setResult(active.result)
  }

  const reviseFinding = (versionId: string, proposal: string) => {
    setRevisingVersionId(versionId)
    updateDraft(proposal, 'custom')
    setResult(null)
    setError('')
    requestAnimationFrame(() => document.getElementById('proposal-text')?.focus())
  }

  const chooseVersion = (versionId: string) => {
    const selected = selectReviewVersion(session, versionId)
    const version = selected.reviewVersions.find((item) => item.id === versionId)
    if (version) {
      setResult(version.result)
      const scenario = seedScenarios.find((item) => item.text === version.proposalText)
      const selectedScenarioId = scenario?.id ?? 'custom'
      setScenarioId(selectedScenarioId)
      setProposalText(version.proposalText)
      saveSession({
        ...selected,
        proposalDraft: { text: version.proposalText, scenarioId: selectedScenarioId },
      })
      setRevisingVersionId(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <img src="/speclock-mark.svg" alt="" />
          </div>
          <div className="brand-copy">
            <span className="brand-name">SpecLock</span>
            <span className="brand-descriptor">Evidence-backed change review</span>
          </div>
          <span className="topbar-divider" aria-hidden="true" />
          <div className="project-context">
            <span className="context-label">Active project</span>
            <span className="project-name">Northstar Notes</span>
          </div>
        </div>
        {storageIssue && <div className="storage-warning" role="status">{storageIssueMessage(storageIssue)}</div>}
        <div className="topbar-context">
          <span className="local-badge">Local review</span>
          <div className={`review-status ${result ? result.status : 'idle'}`} aria-live="polite">
            {result ? <OutcomeIcon status={result.status} /> : <span className="status-dot" aria-hidden="true" />}
            <span>{result ? statusLabel(result.status) : 'Ready to review'}</span>
          </div>
        </div>
      </header>

      <section className="workspace-intro" aria-label="Review workspace">
        <div>
          <p className="eyebrow">Northstar Notes <span aria-hidden="true">/</span> Change review</p>
          <h1>Review a proposed change</h1>
          <p>Check the proposal against the project baseline. Findings include the source evidence behind each result.</p>
        </div>
        <span className="baseline-context"><LockKeyhole size={14} /> Immutable baseline</span>
      </section>

      <div className="workspace-grid">
        <section className="proposal-panel" aria-labelledby="proposal-heading">
          <div className="panel-heading proposal-heading">
            <div className="step-heading">
              <span className="step-number">01</span>
              <div>
                <p className="eyebrow">Your input</p>
                <h2 id="proposal-heading">Describe the change</h2>
              </div>
            </div>
            <span className="scenario-count">{seedScenarios.length} test categories</span>
          </div>

          <div className="scenario-tabs" role="group" aria-label="Seeded scenarios">
            {seedScenarios.map((scenario) => (
              <button
                className={`scenario-tab ${scenarioId === scenario.id ? 'active' : ''}`}
                key={scenario.id}
                type="button"
                onClick={() => selectScenario(scenario)}
                aria-pressed={scenarioId === scenario.id}
              >
                <span className={`scenario-icon ${scenario.id}`} />
                {scenario.label}
              </button>
            ))}
          </div>

          <label className="proposal-label" htmlFor="proposal-text">Natural-language proposal</label>
          <textarea
            id="proposal-text"
            value={proposalText}
            onChange={(event) => {
              updateDraft(event.target.value, scenarioId)
              setResult(null)
              setError('')
            }}
            placeholder="Describe the product change you want to review..."
            spellCheck="true"
          />
          <p className="editor-hint">Choose a test category if helpful; it will not supply example text. Enter your proposal here.</p>

          {error && <p className="input-error" role="alert">{error}</p>}

          <button className="review-button" type="button" onClick={runReview} disabled={isLoading}>
            {isLoading ? <CircleDashed size={16} /> : <Play size={15} fill="currentColor" />}
            {isLoading ? 'Reviewing...' : 'Review proposal'}
          </button>
          <p className="review-local-note">Reviewed locally against the unchanged baseline</p>
        </section>

        <aside className="baseline-panel" aria-label="Project baseline">
          <div className="panel-heading">
            <div className="step-heading">
              <span className="step-number">02</span>
              <div>
                <p className="eyebrow">Reference</p>
                <h2>Project baseline</h2>
              </div>
            </div>
            <span className="immutable-badge">Immutable</span>
          </div>

          <div className="baseline-list">
            {northstarBaseline.map((requirement) => (
              <article className="baseline-item" key={requirement.id}>
                <div className="baseline-meta">
                  <code>{requirement.id}</code>
                  <span>{requirement.category}</span>
                </div>
                <p>{requirement.sourceText}</p>
              </article>
            ))}
          </div>
        </aside>

        <section className="findings-panel" aria-labelledby="findings-heading">
          <div className="panel-heading findings-heading">
            <div className="step-heading">
              <span className="step-number">03</span>
              <div>
                <p className="eyebrow">Review outcome</p>
                <h2 id="findings-heading">Evidence &amp; findings</h2>
              </div>
            </div>
            {result && <span className="finding-count">{result.findings.length} {result.findings.length === 1 ? 'finding' : 'findings'}</span>}
          </div>

          {result && !isLoading && <OutcomeBanner result={result} />}

          {isLoading
            ? <LoadingResult />
            : result && activeVersion
              ? <FindingResult
                  result={result}
                  onDecision={(findingId, decision) => decideFinding(activeVersion.id, findingId, decision)}
                  onRevise={(proposal) => reviseFinding(activeVersion.id, proposal)}
                />
              : result
                ? <FindingResult result={result} />
                : <EmptyResult />}

          {session.reviewVersions.length > 0 && (
            <>
              <ReviewHistory
                versions={session.reviewVersions}
                activeVersionId={session.activeVersionId}
                sessionOnlyVersionId={storageIssue === 'write_failed' ? session.activeVersionId : null}
                onSelect={chooseVersion}
              />
              {activeVersion && <ReviewComparisonPanel selected={activeVersion} versions={session.reviewVersions} />}
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function statusLabel(status: ReviewResult['status']): string {
  if (status === 'definite_conflict') return 'Definite conflict'
  if (status === 'potential_conflict') return 'Potential conflict'
  if (status === 'no_conflict') return 'No conflicts detected'
  return 'Unable to assess'
}

function OutcomeIcon({ status }: { status: ReviewResult['status'] }) {
  if (status === 'definite_conflict') return <AlertTriangle size={15} aria-hidden="true" />
  if (status === 'potential_conflict') return <CircleDashed size={15} aria-hidden="true" />
  if (status === 'no_conflict') return <Check size={15} aria-hidden="true" />
  return <FileWarning size={15} aria-hidden="true" />
}

function OutcomeBanner({ result }: { result: ReviewResult }) {
  return (
    <div className={`outcome-banner ${result.status}`} aria-label="Review outcome" aria-live="polite">
      <OutcomeIcon status={result.status} />
      <span>{statusLabel(result.status)}</span>
    </div>
  )
}

function FindingResult({
  result,
  onDecision,
  onRevise,
}: {
  result: ReviewResult
  onDecision?: (findingId: string, decision: FindingDecision) => void
  onRevise?: (proposal: string) => void
}) {
  if (result.status === 'no_conflict') {
    return (
      <div className="result-state compatible">
        <div className="state-icon success"><Check size={18} /></div>
        <div>
          <p className="state-kicker">Supported review result</p>
          <h3>No conflicts detected</h3>
          <p>No conflict with the recorded baseline was identified. This does not claim universal safety or correctness.</p>
        </div>
        <NextSteps result={result} />
      </div>
    )
  }

  if (result.status === 'unable_to_assess') {
    return (
      <div className="result-state limitation">
        <div className="state-icon limitation"><CircleDashed size={18} /></div>
        <div>
          <p className="state-kicker">Assessment limited</p>
          <h3>Unable to assess</h3>
          <p>{result.unableToAssess}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="findings-list">
      {result.findings.map((finding) => (
        <FindingCard
          key={finding.id}
          finding={finding}
          onDecision={onDecision ? (decision) => onDecision(finding.id, decision) : undefined}
          onRevise={onRevise ? () => onRevise(result.proposalText) : undefined}
        />
      ))}
      <NextSteps result={result} />
    </div>
  )
}

function FindingCard({
  finding,
  onDecision,
  onRevise,
}: {
  finding: Finding
  onDecision?: (decision: FindingDecision) => void
  onRevise?: () => void
}) {
  const definite = finding.classification === 'definite'
  return (
    <article className={`finding-card ${finding.classification}`}>
      <div className="finding-header">
        <div className={`finding-label ${finding.classification}`}>
          {definite ? <AlertTriangle size={15} /> : <CircleDashed size={15} />}
          {definite ? 'DEFINITE CONFLICT' : 'POTENTIAL CONFLICT'}
        </div>
        <span className="finding-status">{definite ? 'Direct contradiction' : 'Human judgment needed'}</span>
      </div>

      {finding.evidence.map((evidence, index) => (
        <div className="evidence-row" key={`${evidence.requirementId}-${index}`}>
          <div className="evidence-column">
            <span className="evidence-label">Baseline · {evidence.requirementId}</span>
            <blockquote>“{evidence.requirementText}”</blockquote>
          </div>
          <div className="evidence-column">
            <span className="evidence-label">Proposal excerpt</span>
            <blockquote className="proposal-quote">“{evidence.proposalExcerpt}”</blockquote>
          </div>
        </div>
      ))}

      <div className="finding-explanation">
        <span>Why this finding</span>
        <p>{finding.explanation}</p>
        {finding.unresolvedQuestion && <p className="unresolved">Unresolved: {finding.unresolvedQuestion}</p>}
      </div>
      {(finding.status === 'unresolved' && onDecision || onRevise) && (
        <div className="finding-action-group">
          <p className="finding-action-note">These actions record a decision about this finding only; they do not approve the proposal.</p>
          <div className="finding-actions" aria-label="Finding resolution actions">
            {finding.status === 'unresolved' && onDecision && (
              <>
                <button type="button" className="decision-button accept" title="Accept this finding as a valid concern" onClick={() => onDecision('accepted')}>
                  <Check size={14} aria-hidden="true" />Accept finding
                </button>
                <button type="button" className="decision-button reject" title="Dismiss this finding as incorrect or inapplicable" onClick={() => onDecision('rejected')}>
                  <X size={14} aria-hidden="true" />Reject finding
                </button>
              </>
            )}
            {onRevise && (
              <button type="button" className="decision-button revise" title="Edit this proposal and submit a new review version" onClick={onRevise}>
                <PencilLine size={14} aria-hidden="true" />Revise proposal
              </button>
            )}
          </div>
        </div>
      )}
      {finding.status !== 'unresolved' && (
        <div className="decision-confirmation" role="status">
          Decision recorded — {finding.status === 'accepted' ? 'Accepted' : 'Rejected'}
        </div>
      )}
    </article>
  )
}

function ReviewHistory({
  versions,
  activeVersionId,
  sessionOnlyVersionId,
  onSelect,
}: {
  versions: ReviewVersion[]
  activeVersionId: string | null
  sessionOnlyVersionId: string | null
  onSelect: (versionId: string) => void
}) {
  return (
    <nav className="review-history" aria-label="Review history">
      <div className="history-heading"><History size={13} /><span>Review history</span></div>
      <p className="history-description">Independent reviews start a new thread. Revisions link to the review they changed.</p>
      <ol>
        {[...versions].reverse().map((version) => (
          <li key={version.id}>
            <button
              type="button"
              className={activeVersionId === version.id ? 'active' : ''}
              onClick={() => onSelect(version.id)}
              aria-current={activeVersionId === version.id ? 'true' : undefined}
              aria-label={`v${version.version}, ${statusLabel(version.result.status)}, ${version.parentVersionId
                ? `Revision of v${versions.find((parent) => parent.id === version.parentVersionId)?.version ?? 'unknown'}`
                : 'Original review, independent review'}`}
            >
              <span className="history-version">v{version.version}</span>
              <span className="history-status">{statusLabel(version.result.status)}</span>
              <span className="history-relation">
                {version.parentVersionId
                  ? <><GitBranch size={12} aria-hidden="true" />Revision of v{versions.find((parent) => parent.id === version.parentVersionId)?.version ?? 'unknown'}</>
                  : 'Original review · independent'}
              </span>
              {version.id === sessionOnlyVersionId && <small className="history-session-only">Session only</small>}
              {activeVersionId === version.id && <span className="history-selected">Selected</span>}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

const comparisonFieldLabels: Record<FindingComparisonField, string> = {
  classification: 'Classification',
  requirements: 'Linked requirements',
  evidence: 'Evidence excerpts',
  explanation: 'Explanation',
  decision: 'Decision state',
}

const comparisonFields: FindingComparisonField[] = [
  'classification',
  'requirements',
  'evidence',
  'explanation',
  'decision',
]

function comparisonFieldValue(finding: Finding | undefined, field: FindingComparisonField): string {
  if (!finding) return 'Not present'
  if (field === 'classification') return finding.classification
  if (field === 'requirements') return [...new Set(finding.evidence.map((item) => item.requirementId))].sort().join(', ') || 'None'
  if (field === 'evidence') {
    return finding.evidence.map((item) => `${item.requirementId}: “${item.proposalExcerpt}”`).join('\n') || 'None'
  }
  if (field === 'explanation') return finding.explanation
  return finding.decision
    ? `${finding.status === 'accepted' ? 'Accepted' : 'Rejected'} (${finding.decision})`
    : finding.status === 'unresolved' ? 'Unresolved' : finding.status
}

function ReviewComparisonPanel({
  selected,
  versions,
}: {
  selected: ReviewVersion
  versions: ReviewVersion[]
}) {
  const comparison = compareReviewVersion(selected, versions)
  if (comparison.kind === 'initial') {
    return (
      <section className="review-comparison" aria-label="Review comparison">
        <h3>Review comparison</h3>
        <p className="comparison-state">
          <GitBranch size={14} aria-hidden="true" />
          <span>This is the original review, an independent review; there is no parent version to compare.</span>
        </p>
      </section>
    )
  }
  if (comparison.kind === 'missing-parent') {
    return (
      <section className="review-comparison" aria-label="Review comparison">
        <h3>Review comparison</h3>
        <p className="comparison-state missing-parent">
          <FileWarning size={15} aria-hidden="true" />
          <span>Parent version is unavailable. No comparison was inferred.</span>
        </p>
        <code className="missing-parent-id">{comparison.parentVersionId}</code>
      </section>
    )
  }

  const { parent, findings } = comparison
  return (
    <section className="review-comparison" aria-label="Review comparison">
      <div className="comparison-heading">
        <div>
          <p className="eyebrow">Version comparison</p>
          <h3>v{selected.version} compared with parent v{parent.version}</h3>
        </div>
        <span>Stored findings · no review rerun</span>
      </div>
      <div className="proposal-comparison">
        <strong>{selected.proposalText === parent.proposalText ? 'Proposal text unchanged' : 'Proposal text changed'}</strong>
        <div>
          <p><span>Parent v{parent.version}</span>{parent.proposalText}</p>
          <p><span>Selected v{selected.version}</span>{selected.proposalText}</p>
        </div>
      </div>
      {findings.length === 0
        ? <p className="comparison-empty"><Check size={14} aria-hidden="true" />No findings in either review.</p>
        : (
          <div className="comparison-findings">
            {findings.map((item) => (
              <article className={`comparison-finding ${item.kind}`} key={item.findingId}>
                <header>
                  <code>{item.findingId}</code>
                  <span className={`comparison-kind ${item.kind}`}>
                    <ComparisonKindIcon kind={item.kind} />
                    {item.kind === 'added' ? 'Added finding' : item.kind === 'removed' ? 'Removed finding' : item.kind === 'changed' ? 'Changed finding' : 'Unchanged'}
                  </span>
                </header>
                {item.kind === 'changed' && (
                  <p className="comparison-change-labels">
                    Changed: {item.changedFields.map((field) => comparisonFieldLabels[field]).join(', ')}
                  </p>
                )}
                <div className="comparison-detail-headings">
                  <span>Parent v{parent.version}</span>
                  <span>Selected v{selected.version}</span>
                </div>
                {comparisonFields.map((field) => (
                  <div className="comparison-detail-row" key={field}>
                    <strong>{comparisonFieldLabels[field]}</strong>
                    <p>
                      <span className="comparison-mobile-label">Parent v{parent.version}</span>
                      {comparisonFieldValue(item.parentFinding, field)}
                    </p>
                    <p>
                      <span className="comparison-mobile-label">Selected v{selected.version}</span>
                      {comparisonFieldValue(item.selectedFinding, field)}
                    </p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}
    </section>
  )
}

function ComparisonKindIcon({ kind }: { kind: 'added' | 'removed' | 'changed' | 'unchanged' }) {
  if (kind === 'added') return <Check size={13} aria-hidden="true" />
  if (kind === 'removed') return <X size={13} aria-hidden="true" />
  if (kind === 'changed') return <PencilLine size={13} aria-hidden="true" />
  return <span className="comparison-unchanged-mark" aria-hidden="true">=</span>
}

function NextSteps({ result }: { result: ReviewResult }) {
  return (
    <div className="next-steps">
      <div className="next-step-column">
        <h4>Implementation checklist</h4>
        <ul>{result.nextSteps.implementationChecklist.map((item) => <li key={item}><Check size={13} />{item}</li>)}</ul>
      </div>
      <div className="next-step-column">
        <h4>Regression suggestions</h4>
        <ul>{result.nextSteps.regressionTests.map((item) => <li key={item}><FileWarning size={13} />{item}</li>)}</ul>
      </div>
      <p className="guidance-note">Guidance only. These suggestions are not executed tests or implemented code.</p>
    </div>
  )
}

function LoadingResult() {
  return (
    <div className="result-state loading-result" aria-live="polite">
      <div className="loading-ring" />
      <div><p className="state-kicker">Reviewing</p><h3>Comparing evidence</h3><p>Checking the proposal against the immutable Northstar baseline.</p></div>
    </div>
  )
}

function EmptyResult() {
  return (
    <div className="result-state empty-result">
      <div className="state-icon empty"><CircleDashed size={18} /></div>
      <div>
        <p className="state-kicker">No review yet</p>
        <h3>Write a proposal to begin</h3>
        <p>Enter your proposal, then run a review to see linked baseline requirements, exact proposal evidence, and the explanation behind each finding.</p>
      </div>
    </div>
  )
}

export default App
