import { describe, expect, it } from 'vitest'
import type { Finding, ReviewVersion } from '../types/review'
import { compareReviewVersion } from './compareVersions'

function finding(overrides: Partial<Finding> & Pick<Finding, 'id'>): Finding {
  return {
    classification: 'definite',
    evidence: [{
      requirementId: 'SEC-001',
      requirementText: 'Keep data local.',
      proposalExcerpt: 'Send data externally.',
    }],
    explanation: 'The proposal contradicts the baseline.',
    status: 'unresolved',
    ...overrides,
  }
}

function version(
  id: string,
  versionNumber: number,
  findings: Finding[],
  parentVersionId?: string,
): ReviewVersion {
  return {
    id,
    version: versionNumber,
    proposalText: `Proposal ${id}`,
    parentVersionId,
    reviewedAt: '2026-10-26T00:00:00.000Z',
    result: {
      status: 'definite_conflict',
      proposalText: `Proposal ${id}`,
      findings,
      nextSteps: { implementationChecklist: [], regressionTests: [] },
    },
    decisions: [],
  }
}

describe('review version comparison', () => {
  it('reports added, removed, changed, and unchanged findings by stable ID', () => {
    const parent = version('review-1', 1, [
      finding({ id: 'finding-removed' }),
      finding({ id: 'finding-changed' }),
      finding({ id: 'finding-unchanged' }),
    ])
    const selected = version('review-2', 2, [
      finding({ id: 'finding-added' }),
      finding({
        id: 'finding-changed',
        classification: 'potential',
        evidence: [{
          requirementId: 'PRIV-001',
          requirementText: 'Keep data local.',
          proposalExcerpt: 'Maybe transmit data.',
        }],
        explanation: 'The destination is unclear.',
      }),
      finding({ id: 'finding-unchanged' }),
    ], parent.id)

    const result = compareReviewVersion(selected, [parent, selected])
    expect(result.kind).toBe('comparison')
    if (result.kind !== 'comparison') return
    expect(result.findings.map(({ findingId, kind }) => [findingId, kind])).toEqual([
      ['finding-added', 'added'],
      ['finding-changed', 'changed'],
      ['finding-removed', 'removed'],
      ['finding-unchanged', 'unchanged'],
    ])
    expect(result.findings.find((item) => item.findingId === 'finding-changed')?.changedFields)
      .toEqual(['classification', 'requirements', 'evidence', 'explanation'])
  })

  it('reports changes in finding decision state', () => {
    const parent = version('review-1', 1, [finding({ id: 'finding-decision' })])
    const selected = version('review-2', 2, [
      finding({ id: 'finding-decision', status: 'accepted', decision: 'accepted', recordedAt: '2026-10-26T00:01:00Z' }),
    ], parent.id)

    const result = compareReviewVersion(selected, [parent, selected])
    expect(result.kind).toBe('comparison')
    if (result.kind !== 'comparison') return
    expect(result.findings[0].kind).toBe('changed')
    expect(result.findings[0].changedFields).toEqual(['decision'])
  })

  it('handles an initial review and a missing parent without inventing a comparison', () => {
    const initial = version('review-1', 1, [finding({ id: 'finding-1' })])
    expect(compareReviewVersion(initial, [initial])).toEqual({ kind: 'initial' })

    const orphan = version('review-3', 3, [finding({ id: 'finding-1' })], 'review-missing')
    expect(compareReviewVersion(orphan, [initial, orphan])).toEqual({
      kind: 'missing-parent',
      parentVersionId: 'review-missing',
    })
  })

  it('returns unchanged findings when two reviews contain identical findings', () => {
    const originalFinding = finding({ id: 'finding-same' })
    const parent = version('review-1', 1, [originalFinding])
    const selected = version('review-2', 2, [finding({ id: 'finding-same' })], parent.id)
    const result = compareReviewVersion(selected, [parent, selected])

    expect(result.kind).toBe('comparison')
    if (result.kind !== 'comparison') return
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].kind).toBe('unchanged')
    expect(result.findings[0].changedFields).toEqual([])
  })

  it('handles a comparison where neither version contains findings', () => {
    const parent = version('review-1', 1, [])
    const selected = version('review-2', 2, [], parent.id)
    const result = compareReviewVersion(selected, [parent, selected])

    expect(result.kind).toBe('comparison')
    if (result.kind !== 'comparison') return
    expect(result.findings).toEqual([])
  })
})
