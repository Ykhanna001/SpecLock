import { describe, expect, it } from 'vitest'
import { northstarBaseline } from '../data/northstarBaseline'
import { seedScenarios } from '../data/seedScenarios'
import { reviewProposal } from './reviewEngine'
import { assertFindingEvidence } from './evidence'

describe('deterministic review engine', () => {
  it('returns a definite fixture with exact evidence for every finding', () => {
    const scenario = seedScenarios.find((item) => item.id === 'definite')!
    const result = reviewProposal(northstarBaseline, scenario.text, 'definite')
    expect(result.status).toBe('definite_conflict')
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].classification).toBe('definite')
    expect(result.findings[0].evidence.map((item) => item.requirementId)).toEqual(['SEC-001', 'PRIV-001', 'EXC-001'])
    expect(result.findings.every((finding) => assertFindingEvidence(finding, scenario.text, northstarBaseline))).toBe(true)
  })

  it('returns an explicit compatible fixture with no findings', () => {
    const scenario = seedScenarios.find((item) => item.id === 'compatible')!
    const result = reviewProposal(northstarBaseline, scenario.text, 'compatible')
    expect(result.status).toBe('no_conflict')
    expect(result.findings).toEqual([])
  })

  it('returns a potential fixture when external behavior is ambiguous', () => {
    const scenario = seedScenarios.find((item) => item.id === 'ambiguous')!
    const result = reviewProposal(northstarBaseline, scenario.text, 'ambiguous')
    expect(result.status).toBe('potential_conflict')
    expect(result.findings[0].classification).toBe('potential')
    expect(result.findings[0].unresolvedQuestion).toContain('outside the current device')
    expect(assertFindingEvidence(result.findings[0], scenario.text, northstarBaseline)).toBe(true)
  })

  it('does not convert unsupported custom text into no-conflict', () => {
    const result = reviewProposal(northstarBaseline, 'Add a new document export workflow.', 'custom')
    expect(result.status).toBe('unable_to_assess')
    expect(result.findings).toEqual([])
  })

  it('returns no finding for supported local appearance text only', () => {
    const result = reviewProposal(northstarBaseline, 'Add a keyboard shortcut that changes the editor appearance using a local theme setting.', 'custom')
    expect(result.status).toBe('no_conflict')
    expect(result.findings).toEqual([])
  })

  it('classifies an explicit external transmission of identity data as a definite conflict', () => {
    const proposal = "Add a third-party analytics integration that sends each user's email address and account identifier to an external service."
    const result = reviewProposal(northstarBaseline, proposal, 'custom')

    expect(result.status).toBe('definite_conflict')
    expect(result.findings.map((finding) => finding.evidence[0].requirementId)).toEqual(['SEC-001', 'PRIV-001', 'EXC-001'])
    expect(result.findings.every((finding) => finding.evidence[0].proposalExcerpt === proposal)).toBe(true)
  })

  it('rejects evidence with a fabricated requirement ID or mismatched proposal quote', () => {
    const result = reviewProposal(northstarBaseline, seedScenarios[0].text, 'definite')
    const finding = result.findings[0]
    expect(assertFindingEvidence(finding, seedScenarios[0].text, northstarBaseline)).toBe(true)
    expect(assertFindingEvidence({ ...finding, evidence: [{ ...finding.evidence[0], requirementId: 'FAKE-001' }] }, seedScenarios[0].text, northstarBaseline)).toBe(false)
    expect(assertFindingEvidence({ ...finding, evidence: [{ ...finding.evidence[0], proposalExcerpt: 'not in this proposal' }] }, seedScenarios[0].text, northstarBaseline)).toBe(false)
  })

  it('throws a clear error for an empty proposal', () => {
    expect(() => reviewProposal(northstarBaseline, '   ', 'custom')).toThrow('Enter a proposal before reviewing')
  })
})
