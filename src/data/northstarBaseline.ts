import type { BaselineRequirement } from '../types/review'

export const NORTHSTAR_BASELINE_ID = 'northstar-notes' as const

export const northstarBaseline: readonly BaselineRequirement[] = Object.freeze([
  Object.freeze({
    id: 'SEC-001',
    category: 'constraint',
    title: 'External network',
    sourceText: 'The application must make no external network requests. All note data must remain on the current device.',
    stable: true,
  }),
  Object.freeze({
    id: 'PRIV-001',
    category: 'requirement',
    title: 'Personal data',
    sourceText: 'Analytics events may collect product usage counters only and must not include user identity, message content, or contact information.',
    stable: true,
  }),
  Object.freeze({
    id: 'AC-001',
    category: 'acceptance',
    title: 'Offline compatibility',
    sourceText: 'Core note creation must work offline and must remain usable after browser storage is unavailable.',
    stable: true,
  }),
  Object.freeze({
    id: 'EXC-001',
    category: 'exclusion',
    title: 'Scope exclusion',
    sourceText: 'The product does not include cloud synchronization, account systems, or third-party data exports.',
    stable: true,
  }),
])
