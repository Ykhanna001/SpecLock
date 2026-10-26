import { northstarBaseline, NORTHSTAR_BASELINE_ID } from '../data/northstarBaseline'
import { reviewProposal, type ScenarioId } from '../review/reviewEngine'
import type {
  FindingDecision,
  ReviewSession,
  ReviewVersion,
} from '../types/review'

export const SESSION_KEY = 'speclock.session.v1'

export type StorageIssue = 'unavailable' | 'read_failed' | 'write_failed' | 'corrupt'

export function createInitialSession(): ReviewSession {
  return {
    baselineId: NORTHSTAR_BASELINE_ID,
    baseline: [...northstarBaseline],
    proposalDraft: { text: '', scenarioId: 'custom' },
    reviewVersions: [],
    activeVersionId: null,
  }
}

export function nextReviewVersion(
  session: ReviewSession,
  proposalText: string,
  scenarioId: ScenarioId,
  parentVersionId?: string,
  now: string = new Date().toISOString(),
  idFactory: () => string = () => `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
): { session: ReviewSession; version: ReviewVersion } {
  if (parentVersionId !== undefined && !session.reviewVersions.some((version) => version.id === parentVersionId)) {
    throw new Error(`Cannot revise missing review version: ${parentVersionId}`)
  }
  const id = idFactory()
  if (!id || session.reviewVersions.some((version) => version.id === id)) {
    throw new Error(`Review version ID must be unique: ${id}`)
  }
  const result = reviewProposal(session.baseline, proposalText.trim(), scenarioId)
  const versionNumber = session.reviewVersions.length + 1
  const version: ReviewVersion = {
    id,
    version: versionNumber,
    proposalText: result.proposalText,
    parentVersionId,
    reviewedAt: now,
    result: {
      ...result,
      findings: result.findings.map((finding) => ({ ...finding, evidence: finding.evidence.map((item) => ({ ...item })) })),
      nextSteps: {
        implementationChecklist: [...result.nextSteps.implementationChecklist],
        regressionTests: [...result.nextSteps.regressionTests],
      },
    },
    decisions: [],
  }
  const nextSession = {
    ...session,
    proposalDraft: { text: proposalText.trim(), scenarioId },
    reviewVersions: [...session.reviewVersions, version],
    activeVersionId: version.id,
  }
  return { session: nextSession, version }
}

export function recordFindingDecision(
  session: ReviewSession,
  versionId: string,
  findingId: string,
  decision: FindingDecision,
  now: string = new Date().toISOString(),
): ReviewSession {
  return {
    ...session,
    reviewVersions: session.reviewVersions.map((version) => {
      if (version.id !== versionId) return version
      const findingExists = version.result.findings.some((finding) => finding.id === findingId)
      if (!findingExists) return version

      return {
        ...version,
        result: {
          ...version.result,
          findings: version.result.findings.map((finding) => finding.id === findingId
            ? { ...finding, status: decision === 'accepted' ? 'accepted' : 'rejected', decision, recordedAt: now }
            : finding,
          ),
        },
        decisions: [
          ...version.decisions.filter((item) => item.findingId !== findingId),
          { findingId, decision, recordedAt: now },
        ],
      }
    }),
  }
}

export function selectReviewVersion(session: ReviewSession, versionId: string): ReviewSession {
  if (!session.reviewVersions.some((version) => version.id === versionId)) return session
  return { ...session, activeVersionId: versionId }
}

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface StorageLoadResult {
  session: ReviewSession
  issue?: StorageIssue
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isReviewVersion(value: unknown, expectedVersion: number, earlierIds: Set<string>): value is ReviewVersion {
  if (!isRecord(value)) return false
  const version = value
  const resultValue = version.result
  if (!isRecord(resultValue)) return false
  const result = resultValue
  if (typeof version.id !== 'string' || !version.id || version.version !== expectedVersion) return false
  if (typeof version.proposalText !== 'string' || !version.proposalText || typeof version.reviewedAt !== 'string') return false
  if (version.parentVersionId !== undefined
    && (typeof version.parentVersionId !== 'string' || !earlierIds.has(version.parentVersionId))) return false
  if (result.proposalText !== version.proposalText
    || !['definite_conflict', 'potential_conflict', 'no_conflict', 'unable_to_assess'].includes(String(result.status))
    || !Array.isArray(result.findings)
    || !isRecord(result.nextSteps)
    || !isStringArray(result.nextSteps.implementationChecklist)
    || !isStringArray(result.nextSteps.regressionTests)
    || !Array.isArray(version.decisions)) return false
  if (result.unableToAssess !== undefined && typeof result.unableToAssess !== 'string') return false

  const findingIds = new Set<string>()
  for (const finding of result.findings) {
    if (!isRecord(finding)
      || typeof finding.id !== 'string' || !finding.id || findingIds.has(finding.id)
      || !['definite', 'potential'].includes(String(finding.classification))
      || !['unresolved', 'accepted', 'rejected'].includes(String(finding.status))
      || !Array.isArray(finding.evidence) || finding.evidence.length === 0
      || typeof finding.explanation !== 'string' || !finding.explanation
      || (finding.unresolvedQuestion !== undefined && typeof finding.unresolvedQuestion !== 'string')) return false
    findingIds.add(finding.id)

    for (const evidence of finding.evidence) {
      if (!isRecord(evidence) || typeof evidence.requirementId !== 'string'
        || typeof evidence.requirementText !== 'string' || typeof evidence.proposalExcerpt !== 'string'
        || !version.proposalText.includes(evidence.proposalExcerpt)
        || !northstarBaseline.some((requirement) =>
          requirement.id === evidence.requirementId && requirement.sourceText === evidence.requirementText)) return false
    }

    const resolved = finding.status === 'accepted' || finding.status === 'rejected'
    if (resolved
      ? finding.decision !== finding.status || typeof finding.recordedAt !== 'string'
      : finding.decision !== undefined || finding.recordedAt !== undefined) return false
  }

  const decisionIds = new Set<string>()
  for (const decision of version.decisions) {
    if (!isRecord(decision) || typeof decision.findingId !== 'string'
      || !findingIds.has(decision.findingId) || decisionIds.has(decision.findingId)
      || !['accepted', 'rejected'].includes(String(decision.decision))
      || typeof decision.recordedAt !== 'string') return false
    const finding = result.findings.find((item) => isRecord(item) && item.id === decision.findingId)
    if (!isRecord(finding) || finding.decision !== decision.decision || finding.recordedAt !== decision.recordedAt) return false
    decisionIds.add(decision.findingId)
  }
  return result.findings.every((finding) =>
    isRecord(finding) && (finding.status === 'unresolved') === !decisionIds.has(String(finding.id)),
  )
}

function isReviewSession(value: unknown): value is ReviewSession {
  if (!isRecord(value) || value.baselineId !== NORTHSTAR_BASELINE_ID
    || !Array.isArray(value.baseline) || value.baseline.length !== northstarBaseline.length
    || !isRecord(value.proposalDraft) || typeof value.proposalDraft.text !== 'string'
    || !['definite', 'compatible', 'ambiguous', 'custom'].includes(String(value.proposalDraft.scenarioId))
    || !Array.isArray(value.reviewVersions)) return false
  if (!value.baseline.every((item, index) => {
    const expected = northstarBaseline[index]
    return isRecord(item) && item.id === expected.id && item.category === expected.category
      && item.title === expected.title && item.sourceText === expected.sourceText && item.stable === true
  })) return false
  if (value.activeVersionId !== null && typeof value.activeVersionId !== 'string') return false

  const ids = new Set<string>()
  for (const [index, version] of value.reviewVersions.entries()) {
    if (!isReviewVersion(version, index + 1, ids) || ids.has(version.id)) return false
    ids.add(version.id)
  }
  return value.activeVersionId === null
    ? value.reviewVersions.length === 0
    : ids.has(value.activeVersionId)
}

export function hydrateReviewSession(storage: StorageAdapter | undefined): StorageLoadResult {
  if (!storage) return { session: createInitialSession(), issue: 'unavailable' }
  let raw: string | null
  try {
    raw = storage.getItem(SESSION_KEY)
  } catch {
    return { session: createInitialSession(), issue: 'read_failed' }
  }
  if (raw === null) return { session: createInitialSession() }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = null
  }
  if (isReviewSession(parsed)) {
    return {
      session: {
        ...parsed,
        baseline: [...northstarBaseline],
      },
    }
  }
  try {
    storage.removeItem(SESSION_KEY)
  } catch {
    return { session: createInitialSession(), issue: 'read_failed' }
  }
  return { session: createInitialSession(), issue: 'corrupt' }
}

export function persistReviewSession(storage: StorageAdapter | undefined, session: ReviewSession): StorageIssue | null {
  if (!storage) return 'unavailable'
  try {
    storage.setItem(SESSION_KEY, JSON.stringify({ ...session, baseline: [...northstarBaseline] }))
    return null
  } catch {
    return 'write_failed'
  }
}

export function storageIssueMessage(issue: StorageIssue | undefined): string {
  if (issue === 'unavailable') return 'Session storage unavailable. Changes remain in this tab only.'
  if (issue === 'read_failed') return 'Session history unavailable. The Northstar Notes baseline is unchanged.'
  if (issue === 'write_failed') return 'History could not be saved for refresh. Current-session evidence is preserved.'
  if (issue === 'corrupt') return 'Saved session could not be restored. The Northstar Notes baseline is unchanged.'
  return ''
}
