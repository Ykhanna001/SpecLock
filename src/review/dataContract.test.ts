import { describe, expect, it } from 'vitest'
import type { ReviewVersion } from '../types/review'
import { seedScenarios } from '../data/seedScenarios'
import { reviewProposal } from './reviewEngine'
import { northstarBaseline } from '../data/northstarBaseline'

function createVersion(proposalText: string, parentVersionId?: string, version = 1): ReviewVersion {
  return {
    id: parentVersionId ? `${parentVersionId}-revision` : 'review-1',
    version,
    proposalText,
    parentVersionId,
    reviewedAt: '2026-10-26T00:00:00.000Z',
    result: reviewProposal(northstarBaseline, proposalText, parentVersionId ? 'custom' : 'definite'),
    decisions: [],
  }
}

describe('review version data contract', () => {
  it('preserves parent evidence when creating a revision without inherited decisions', () => {
    const original = createVersion(seedScenarios[0].text)
    original.result.findings[0].decision = 'accepted'
    original.result.findings[0].status = 'accepted'
    original.decisions.push({
      findingId: original.result.findings[0].id,
      decision: 'accepted',
      recordedAt: '2026-10-26T00:01:00.000Z',
    })

    const revised = createVersion('Use an explicitly local analytics implementation only.', original.id, 2)

    expect(revised.parentVersionId).toBe(original.id)
    expect(revised.decisions).toEqual([])
    expect(original.decisions).toHaveLength(1)
    expect(original.result.findings[0].evidence).toHaveLength(3)
    expect(original.result.findings[0].status).toBe('accepted')
  })

  it('models Accept and Reject only at the finding level', () => {
    const finding = reviewProposal(northstarBaseline, seedScenarios[0].text, 'definite').findings[0]
    expect(finding.status).toBe('unresolved')
    expect(finding.decision).toBeUndefined()
  })
})
