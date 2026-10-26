import type { BaselineRequirement, EvidenceQuote, Finding } from '../types/review'

export function findBaselineRequirement(
  baseline: readonly BaselineRequirement[],
  requirementId: string,
): BaselineRequirement | undefined {
  const requirement = baseline.find((item) => item.id === requirementId)
  return requirement?.stable === true ? requirement : undefined
}

export function extractProposalExcerpt(proposalText: string, phrase: string): string | null {
  const normalizedProposal = proposalText.trim()
  const normalizedPhrase = phrase.trim()
  if (!normalizedProposal || !normalizedPhrase) return null

  const index = normalizedProposal.toLowerCase().indexOf(normalizedPhrase.toLowerCase())
  if (index < 0) return null
  return normalizedProposal.slice(index, index + normalizedPhrase.length)
}

export function assertFindingEvidence(
  finding: Finding,
  proposalText: string,
  baseline: readonly BaselineRequirement[],
): finding is Finding {
  if (!finding.explanation.trim() || finding.evidence.length === 0) return false

  return finding.evidence.every((evidence: EvidenceQuote) => {
    const requirement = findBaselineRequirement(baseline, evidence.requirementId)
    if (!requirement || requirement.sourceText !== evidence.requirementText) return false
    if (!evidence.proposalExcerpt.trim()) return false
    return proposalText.includes(evidence.proposalExcerpt)
  })
}
