export interface SeedScenario {
  id: 'definite' | 'compatible' | 'ambiguous'
  label: string
  text: string
}

export const seedScenarios: readonly SeedScenario[] = Object.freeze([
  Object.freeze({
    id: 'definite',
    label: 'Definite conflict',
    text: 'Add a third-party analytics integration that sends each user email address and account identifier to an external service.',
  }),
  Object.freeze({
    id: 'compatible',
    label: 'Compatible change',
    text: 'Add a local keyboard shortcut that changes the editor appearance using only in-memory theme settings.',
  }),
  Object.freeze({
    id: 'ambiguous',
    label: 'Potential conflict',
    text: 'Add optional telemetry synchronization so usage activity can be shared with a dashboard service.',
  }),
])
