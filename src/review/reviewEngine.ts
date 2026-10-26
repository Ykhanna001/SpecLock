import type { BaselineRequirement, ReviewResult, ReviewStatus } from '../types/review'
import { assertFindingEvidence, extractProposalExcerpt } from './evidence'
import { createAmbiguousFixture, createCompatibleFixture, createDefiniteFixture } from './fixtures'

export type ScenarioId = 'definite' | 'compatible' | 'ambiguous' | 'custom'

export function reviewProposal(
  baseline: readonly BaselineRequirement[],
  proposalText: string,
  scenarioId: ScenarioId = 'custom',
): ReviewResult {
  if (!proposalText.trim()) {
    throw new Error('Enter a proposal before reviewing')
  }

  let result: ReviewResult

  if (scenarioId === 'definite') result = createDefiniteFixture(proposalText)
  else if (scenarioId === 'compatible') result = createCompatibleFixture(proposalText)
  else if (scenarioId === 'ambiguous') result = createAmbiguousFixture(proposalText)
  else result = reviewCustomProposal(baseline, proposalText)

  for (const finding of result.findings) {
    if (!assertFindingEvidence(finding, proposalText, baseline)) {
      return unableToAssess(proposalText, 'A finding could not be supported by exact baseline and proposal evidence.')
    }
  }

  return result
}

function reviewCustomProposal(
  baseline: readonly BaselineRequirement[],
  proposalText: string,
): ReviewResult {
  const lower = proposalText.toLowerCase()

  const externalTransmission = /(send|transmit|upload|export|sync|share)\b/.test(lower) && /(third.party|external|cloud|server|api|service|analytics)./.test(lower)
  const personalData = /(email address|user identity|account identifier|contact information|message content)/.test(lower)

  if (externalTransmission && personalData) {
    const matchedExternal = proposalText.match(/third[- ]party|external|send|transmit|upload|sync/i)?.[0] ?? proposalText.trim()
    const externalExcerpt = extractProposalExcerpt(proposalText, matchedExternal) ?? proposalText.trim()
    const requirementIds = ['SEC-001', 'PRIV-001', 'EXC-001']
    const findings = requirementIds.map((requirementId, index) => {
      const requirement = baseline.find((item) => item.id === requirementId)
      if (!requirement) throw new Error(`Missing baseline requirement ${requirementId}`)
      return {
        id: `finding-custom-${index + 1}`,
        classification: 'definite' as const,
        evidence: [{
          requirementId,
          requirementText: requirement.sourceText,
          proposalExcerpt: externalExcerpt,
        }],
        explanation: 'The proposal expressly combines external transmission or synchronization with identity or personal data, which conflicts with the recorded baseline.',
        status: 'unresolved' as const,
      }
    })

    return {
      status: 'definite_conflict',
      proposalText,
      findings,
      nextSteps: {
        implementationChecklist: ['Remove prohibited external transmission', 'Keep identity and contact data local', 'Re-review the revised proposal'],
        regressionTests: ['Verify no external request occurs', 'Verify personal data stays local', 'Verify core behavior remains offline'],
      },
    }
  }

  if (/(telemetry|analytics|synchronization|sync|cloud|api|server|dashboard service)/.test(lower) && !/no external|offline only|local only|in.memory/.test(lower)) {
    const requirement = baseline.find((item) => item.id === 'SEC-001')
    if (!requirement) throw new Error('Missing SEC-001')
    const excerpt = extractProposalExcerpt(proposalText, 'telemetry') ?? extractProposalExcerpt(proposalText, 'sync') ?? proposalText.trim()
    return {
      status: 'potential_conflict',
      proposalText,
      findings: [{
        id: 'finding-custom-potential',
        classification: 'potential',
        evidence: [{ requirementId: requirement.id, requirementText: requirement.sourceText, proposalExcerpt: excerpt }],
        explanation: 'The proposal is relevant to external transmission, but it does not establish whether data leaves the device.',
        unresolvedQuestion: 'Does this feature transmit data outside the current device?',
        status: 'unresolved',
      }],
      nextSteps: {
        implementationChecklist: ['Clarify the data destination', 'Identify whether identity or note content is involved', 'Re-review after revision'],
        regressionTests: ['Verify external network behavior explicitly', 'Verify local data remains local', 'Verify offline behavior'],
      },
    }
  }

  if (/keyboard shortcut|appearance|theme|in.memory|local only/.test(lower) && !/(network|persist|export|cloud|sync|server|analytics|telemetry|email|identity)/.test(lower)) {
    return {
      status: 'no_conflict',
      proposalText,
      findings: [],
      nextSteps: {
        implementationChecklist: ['Implement the local appearance change', 'Keep settings in memory only', 'Avoid adding persistence or network behavior'],
        regressionTests: ['Verify the shortcut changes appearance locally', 'Verify no network request occurs', 'Verify core note creation remains offline'],
      },
    }
  }

  return unableToAssess(proposalText, 'No supported rule can reliably establish a definite conflict, potential conflict, or compatible result for this proposal. Clarify the proposed data, storage, and network behavior.')
}

export function unableToAssess(proposalText: string, message: string): ReviewResult {
  return {
    status: 'unable_to_assess' satisfies ReviewStatus,
    proposalText,
    findings: [],
    nextSteps: {
      implementationChecklist: ['Clarify network behavior, data storage, and scope', 'Re-submit the proposal for re-review'],
      regressionTests: ['Verify clarified behavior against the existing baseline', 'Verify no undeclared external request occurs'],
    },
    unableToAssess: message,
  }
}
