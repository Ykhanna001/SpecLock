export type FindingClassification = 'definite' | 'potential'
export type FindingStatus = 'unresolved' | 'accepted' | 'rejected'
export type FindingDecision = 'accepted' | 'rejected'
export type ReviewStatus =
  | 'definite_conflict'
  | 'potential_conflict'
  | 'no_conflict'
  | 'unable_to_assess'

export interface BaselineRequirement {
  id: string
  category: 'requirement' | 'constraint' | 'exclusion' | 'acceptance'
  title: string
  sourceText: string
  stable: true
}

export interface EvidenceQuote {
  requirementId: string
  requirementText: string
  proposalExcerpt: string
}

export interface Finding {
  id: string
  classification: FindingClassification
  evidence: EvidenceQuote[]
  explanation: string
  unresolvedQuestion?: string
  status: FindingStatus
  decision?: FindingDecision
  recordedAt?: string
}

export interface ReviewResult {
  status: ReviewStatus
  proposalText: string
  findings: Finding[]
  nextSteps: {
    implementationChecklist: string[]
    regressionTests: string[]
  }
  unableToAssess?: string
}

export interface ProposalDraft {
  text: string
  scenarioId: 'definite' | 'compatible' | 'ambiguous' | 'custom'
}

export interface FindingDecisionRecord {
  findingId: string
  decision: FindingDecision
  recordedAt: string
}

export interface ReviewVersion {
  id: string
  version: number
  proposalText: string
  parentVersionId?: string
  reviewedAt: string
  result: ReviewResult
  decisions: FindingDecisionRecord[]
}

export interface ReviewSession {
  baselineId: 'northstar-notes'
  baseline: BaselineRequirement[]
  proposalDraft: ProposalDraft
  reviewVersions: ReviewVersion[]
  activeVersionId: string | null
}
