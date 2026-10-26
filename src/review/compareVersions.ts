import type { Finding, ReviewVersion } from '../types/review'

export type FindingComparisonField =
  | 'classification'
  | 'requirements'
  | 'evidence'
  | 'explanation'
  | 'decision'

export interface FindingComparison {
  findingId: string
  kind: 'added' | 'removed' | 'changed' | 'unchanged'
  changedFields: FindingComparisonField[]
  parentFinding?: Finding
  selectedFinding?: Finding
}

export type ReviewComparison =
  | { kind: 'initial' }
  | { kind: 'missing-parent'; parentVersionId: string }
  | { kind: 'comparison'; parent: ReviewVersion; findings: FindingComparison[] }

function requirements(finding: Finding): string[] {
  return [...new Set(finding.evidence.map((item) => item.requirementId))].sort()
}

function evidenceExcerpts(finding: Finding): string[] {
  return finding.evidence
    .map((item) => `${item.requirementId}\u0000${item.proposalExcerpt}`)
    .sort()
}

function decisionState(finding: Finding): string {
  return `${finding.status}:${finding.decision ?? 'none'}`
}

function changedFields(parent: Finding, selected: Finding): FindingComparisonField[] {
  const fields: FindingComparisonField[] = []
  if (parent.classification !== selected.classification) fields.push('classification')
  if (JSON.stringify(requirements(parent)) !== JSON.stringify(requirements(selected))) fields.push('requirements')
  if (JSON.stringify(evidenceExcerpts(parent)) !== JSON.stringify(evidenceExcerpts(selected))) fields.push('evidence')
  if (parent.explanation !== selected.explanation) fields.push('explanation')
  if (decisionState(parent) !== decisionState(selected)) fields.push('decision')
  return fields
}

export function compareReviewVersion(
  selected: ReviewVersion,
  versions: readonly ReviewVersion[],
): ReviewComparison {
  if (selected.parentVersionId === undefined) return { kind: 'initial' }
  const parent = versions.find((version) => version.id === selected.parentVersionId)
  if (!parent) return { kind: 'missing-parent', parentVersionId: selected.parentVersionId }

  const parentFindings = new Map(parent.result.findings.map((finding) => [finding.id, finding]))
  const selectedFindings = new Map(selected.result.findings.map((finding) => [finding.id, finding]))
  const ids = [...new Set([...parentFindings.keys(), ...selectedFindings.keys()])].sort()
  const findings = ids.map((findingId): FindingComparison => {
    const parentFinding = parentFindings.get(findingId)
    const selectedFinding = selectedFindings.get(findingId)
    if (!parentFinding) {
      return { findingId, kind: 'added', changedFields: [], selectedFinding }
    }
    if (!selectedFinding) {
      return { findingId, kind: 'removed', changedFields: [], parentFinding }
    }
    const fields = changedFields(parentFinding, selectedFinding)
    return {
      findingId,
      kind: fields.length > 0 ? 'changed' : 'unchanged',
      changedFields: fields,
      parentFinding,
      selectedFinding,
    }
  })

  return { kind: 'comparison', parent, findings }
}
