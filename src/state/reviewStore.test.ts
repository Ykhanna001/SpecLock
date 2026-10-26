import { describe, expect, it } from 'vitest'
import { createInitialSession, hydrateReviewSession, nextReviewVersion, persistReviewSession, recordFindingDecision, selectReviewVersion, type StorageAdapter } from './reviewStore'

const memoryStorage = (): StorageAdapter => {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

describe('review session store', () => {
  it('records Accept and Reject on individual findings only', () => {
    let session = createInitialSession()
    const first = nextReviewVersion(session, 'Add third-party analytics with user email data to an external service.', 'definite', undefined, '2026-10-26T00:00:00Z', () => 'review-1')
    session = first.session
    const findingId = session.reviewVersions[0].result.findings[0].id

    session = recordFindingDecision(session, 'review-1', findingId, 'accepted', '2026-10-26T00:01:00Z')
    expect(session.reviewVersions[0].result.findings[0].status).toBe('accepted')
    expect(session.reviewVersions[0].result.findings[0].decision).toBe('accepted')
    expect(session.reviewVersions[0].decisions[0].findingId).toBe(findingId)

    session = recordFindingDecision(session, 'review-1', findingId, 'rejected', '2026-10-26T00:02:00Z')
    expect(session.reviewVersions[0].result.findings[0].status).toBe('rejected')
    expect(session.reviewVersions[0].decisions[0].decision).toBe('rejected')
  })

  it('creates a child revision without inheriting decisions or mutating the parent', () => {
    let session = createInitialSession()
    const first = nextReviewVersion(session, 'Add third-party analytics with user email data to an external service.', 'definite', undefined, '2026-10-26T00:00:00Z', () => 'review-1')
    session = first.session
    const finding = session.reviewVersions[0].result.findings[0]
    session = recordFindingDecision(session, 'review-1', finding.id, 'accepted', '2026-10-26T00:01:00Z')
    const parentEvidence = JSON.stringify(session.reviewVersions[0].result.findings[0].evidence)

    const second = nextReviewVersion(session, 'Keep analytics local only.', 'compatible', 'review-1', '2026-10-26T00:03:00Z', () => 'review-2')
    session = second.session

    expect(session.reviewVersions).toHaveLength(2)
    expect(session.reviewVersions[1].parentVersionId).toBe('review-1')
    expect(session.reviewVersions[1].decisions).toEqual([])
    expect(session.reviewVersions[1].result.findings).toEqual([])
    expect(session.reviewVersions[0].result.findings[0].status).toBe('accepted')
    expect(JSON.stringify(session.reviewVersions[0].result.findings[0].evidence)).toBe(parentEvidence)
    expect(() => nextReviewVersion(session, 'Revise missing parent.', 'custom', 'missing', undefined, () => 'review-3')).toThrow('Cannot revise missing review version')
  })

  it('restores a valid persisted session and preserves current decisions', () => {
    const storage = memoryStorage()
    let session = createInitialSession()
    const first = nextReviewVersion(session, 'Add third-party analytics with user email data to an external service.', 'definite', undefined, '2026-10-26T00:00:00Z', () => 'review-1')
    session = first.session
    const findingId = session.reviewVersions[0].result.findings[0].id
    session = recordFindingDecision(session, 'review-1', findingId, 'rejected', '2026-10-26T00:01:00Z')
    expect(persistReviewSession(storage, session)).toBeNull()

    const hydrated = hydrateReviewSession(storage)
    expect(hydrated.issue).toBeUndefined()
    expect(hydrated.session.reviewVersions[0].result.findings[0].decision).toBe('rejected')
  })

  it('reports unavailable and write-failure storage without mutating the session', () => {
    const original = createInitialSession()
    expect(hydrateReviewSession(undefined).issue).toBe('unavailable')

    const failingStorage: StorageAdapter = {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
      removeItem: () => undefined,
    }
    expect(persistReviewSession(failingStorage, original)).toBe('write_failed')
    expect(original.reviewVersions).toEqual([])
  })

  it('removes corrupt stored envelopes and restores the initial session', () => {
    let stored = '{bad json'
    const storage: StorageAdapter = {
      getItem: () => stored,
      setItem: () => undefined,
      removeItem: () => { stored = '' },
    }
    const result = hydrateReviewSession(storage)
    expect(result.issue).toBe('corrupt')
    expect(result.session.reviewVersions).toEqual([])
    expect(stored).toBe('')
  })

  it('rejects a session with an invalid parent-version link', () => {
    const storage = memoryStorage()
    const first = nextReviewVersion(createInitialSession(), 'Add third-party analytics with user email data to an external service.', 'definite', undefined, '2026-10-26T00:00:00Z', () => 'review-1')
    const malformed = {
      ...first.session,
      reviewVersions: [{ ...first.version, parentVersionId: 'review-1' }],
    }
    persistReviewSession(storage, malformed)
    expect(hydrateReviewSession(storage).issue).toBe('corrupt')
  })

  it('reports storage read failures separately from corrupt data', () => {
    const storage: StorageAdapter = {
      getItem: () => { throw new Error('denied') },
      setItem: () => undefined,
      removeItem: () => undefined,
    }
    expect(hydrateReviewSession(storage).issue).toBe('read_failed')
  })

  it('selects only existing review versions', () => {
    let session = createInitialSession()
    session = nextReviewVersion(session, 'Add third-party analytics with user email data to an external service.', 'definite', undefined, '2026-10-26T00:00:00Z', () => 'review-1').session
    session = selectReviewVersion(session, 'missing')
    expect(session.activeVersionId).toBe('review-1')
  })
})
