import type { Finding, ReviewResult } from '../types/review'
import { northstarBaseline } from '../data/northstarBaseline'

const exactProposal = (text: string, phrase: string): string => {
  const index = text.toLowerCase().indexOf(phrase.toLowerCase())
  return index >= 0 ? text.slice(index, index + phrase.length) : text.trim()
}

export function createDefiniteFixture(proposalText: string): ReviewResult {
  const baselineById = new Map(northstarBaseline.map((item) => [item.id, item]))
  const externalExcerpt = exactProposal(proposalText, 'third-party analytics integration')
  const identityExcerpt = exactProposal(proposalText, 'user email address and account identifier')
  const requirementIds = ['SEC-001', 'PRIV-001', 'EXC-001']

  const evidence = requirementIds.map((id) => {
    const requirement = baselineById.get(id)
    if (!requirement) throw new Error(`Missing seeded baseline requirement ${id}`)
    return {
      requirementId: id,
      requirementText: requirement.sourceText,
      proposalExcerpt: id === 'SEC-001' ? externalExcerpt : identityExcerpt,
    }
  })

  const finding: Finding = {
    id: 'finding-definite-analytics',
    classification: 'definite',
    evidence,
    explanation: 'The proposal explicitly sends third-party analytics and user identity data outside the device, directly contradicting the network, privacy, and scope exclusions.',
    status: 'unresolved',
  }

  return {
    status: 'definite_conflict',
    proposalText,
    findings: [finding],
    nextSteps: {
      implementationChecklist: ['Remove third-party transmission from the proposal', 'Keep analytics limited to local product usage counters', 'Re-review the revised proposal against the unchanged baseline'],
      regressionTests: ['Verify no external network request is initiated', 'Verify no user identity or contact data is included in analytics', 'Verify core note creation remains offline'],
    },
  }
}

export function createCompatibleFixture(proposalText: string): ReviewResult {
  return {
    status: 'no_conflict',
    proposalText,
    findings: [],
    nextSteps: {
      implementationChecklist: ['Implement the local keyboard shortcut', 'Keep theme settings in memory only', 'Do not introduce network or persistent-storage behavior without a new review'],
      regressionTests: ['Verify the shortcut changes appearance locally', 'Verify no network request occurs', 'Verify core note behavior remains offline'],
    },
  }
}

export function createAmbiguousFixture(proposalText: string): ReviewResult {
  const requirement = northstarBaseline.find((item) => item.id === 'SEC-001')
  if (!requirement) throw new Error('Missing SEC-001')
  const excerpt = exactProposal(proposalText, 'telemetry synchronization')

  const finding: Finding = {
    id: 'finding-potential-telemetry',
    classification: 'potential',
    evidence: [{
      requirementId: requirement.id,
      requirementText: requirement.sourceText,
      proposalExcerpt: excerpt,
    }],
    explanation: 'The proposal mentions telemetry synchronization, but it does not establish whether data leaves the device or what data is transmitted.',
    unresolvedQuestion: 'Does telemetry synchronize note data or personal data outside the current device?',
    status: 'unresolved',
  }

  return {
    status: 'potential_conflict',
    proposalText,
    findings: [finding],
    nextSteps: {
      implementationChecklist: ['Clarify whether telemetry leaves the device', 'Clarify which fields, if any, are transmitted', 'Revise the proposal and run a new review'],
      regressionTests: ['Verify whether any external request occurs', 'Verify note data remains local', 'Verify identity fields are excluded from any telemetry'],
    },
  }
}
