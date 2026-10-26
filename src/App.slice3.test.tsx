import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.useFakeTimers()

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

function reviewDefinite() {
  const proposal = screen.getByLabelText(/natural-language proposal/i) as HTMLTextAreaElement
  if (!proposal.value) {
    fireEvent.click(screen.getByRole('button', { name: 'Definite conflict' }))
    fireEvent.change(proposal, {
      target: {
        value: "Add a third-party analytics integration that sends each user's email address and account identifier to an external service.",
      },
    })
  }
  fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
  act(() => vi.advanceTimersByTime(181))
}

describe('Slice 3 end-to-end review flow', () => {
  it('records an finding-level Accept decision and shows persistent confirmation', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.click(screen.getByRole('button', { name: 'Accept finding' }))
    expect(screen.getByRole('status').textContent).toContain('Decision recorded — Accepted')
    expect(screen.getByText(/decision about this finding only; they do not approve the proposal/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Accept finding' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reject finding' })).toBeNull()
  })

  it('records Reject without implying feature approval', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.click(screen.getByRole('button', { name: 'Reject finding' }))
    expect(screen.getByText(/Decision recorded — Rejected/i)).toBeTruthy()
  })

  it('creates a revision and preserves the original evidence and decision in history', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.click(screen.getByRole('button', { name: 'Accept finding' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revise proposal' }))

    const proposal = screen.getByLabelText(/natural-language proposal/i)
    expect((proposal as HTMLTextAreaElement).value).toContain('third-party analytics')
    fireEvent.change(proposal, { target: { value: 'Keep analytics local and send no identity data.' } })
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    act(() => vi.advanceTimersByTime(181))

    const history = screen.getByRole('navigation', { name: 'Review history' })
    expect(screen.getByRole('heading', { name: 'v2 compared with parent v1' })).toBeTruthy()
    expect(screen.getByText('Proposal text changed')).toBeTruthy()
    expect(screen.getByText('Removed finding')).toBeTruthy()
    expect(screen.getByText('Added finding')).toBeTruthy()
    expect(screen.getAllByText('Parent v1').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Selected v2').length).toBeGreaterThan(1)
    expect(within(history).getByText('v1')).toBeTruthy()
    expect(within(history).getByText('v2')).toBeTruthy()
    fireEvent.click(within(history).getByRole('button', { name: /^v1/i }))
    expect(screen.getByText(/This is the original review/)).toBeTruthy()
    expect(screen.getByText(/Decision recorded — Accepted/i)).toBeTruthy()
    expect(screen.getByText('SEC-001')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Revise proposal' }))
    fireEvent.change(screen.getByLabelText(/natural-language proposal/i), { target: { value: 'Keep the revised analytics local.' } })
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    act(() => vi.advanceTimersByTime(181))
    expect(within(history).getByRole('button', { name: /^v3/i }).textContent).toContain('Revision of v1')
    expect(screen.getByRole('heading', { name: 'v3 compared with parent v1' })).toBeTruthy()
  })

  it('keeps independent reviews parentless and compares an explicit revision with its actual parent after restore', () => {
    render(<App />)
    const proposal = screen.getByLabelText(/natural-language proposal/i)
    fireEvent.change(proposal, { target: { value: 'Improve the app experience.' } })
    reviewDefinite()

    expect(screen.getByRole('heading', { name: 'Unable to assess' })).toBeTruthy()
    expect(screen.getByText(/original review, an independent review; there is no parent version to compare/i)).toBeTruthy()

    fireEvent.change(proposal, {
      target: {
        value: "Add a third-party analytics integration that sends each user's email address and account identifier to an external service.",
      },
    })
    reviewDefinite()

    expect(screen.getAllByText('DEFINITE CONFLICT')).toHaveLength(3)
    expect(screen.getByText(/original review, an independent review; there is no parent version to compare/i)).toBeTruthy()
    const history = screen.getByRole('navigation', { name: 'Review history' })
    expect(within(history).getByRole('button', { name: /^v1.*Original review/s })).toBeTruthy()
    expect(within(history).getByRole('button', { name: /^v2.*Original review/s })).toBeTruthy()

    const secondFindingEvidence = screen.getAllByText(/Add a third-party analytics integration/, { selector: 'blockquote' })[0].textContent
    fireEvent.click(screen.getAllByRole('button', { name: 'Reject finding' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: 'Revise proposal' })[0])
    fireEvent.change(proposal, { target: { value: 'Remove analytics and keep account data local only.' } })
    reviewDefinite()

    expect(screen.getByRole('heading', { name: 'v3 compared with parent v2' })).toBeTruthy()
    const revisionEntry = within(history).getByRole('button', { name: /^v3.*Revision of v2/s })
    expect(revisionEntry).toBeTruthy()
    expect(revisionEntry.getAttribute('aria-current')).toBe('true')
    expect(within(history).getByText(/Independent reviews start a new thread/)).toBeTruthy()

    fireEvent.click(within(history).getByRole('button', { name: /^v2/i }))
    expect(screen.getByText('Decision recorded — Rejected')).toBeTruthy()
    expect(screen.getAllByText(secondFindingEvidence ?? '', { selector: 'blockquote' })).toHaveLength(3)
    fireEvent.click(within(history).getByRole('button', { name: /^v1/i }))
    expect(screen.getByRole('heading', { name: 'Unable to assess' })).toBeTruthy()
    expect(screen.getByText(/original review, an independent review; there is no parent version to compare/i)).toBeTruthy()
    fireEvent.click(within(history).getByRole('button', { name: /^v3/i }))
    expect(screen.getByRole('heading', { name: 'v3 compared with parent v2' })).toBeTruthy()

    cleanup()
    render(<App />)
    const restoredHistory = screen.getByRole('navigation', { name: 'Review history' })
    expect(within(restoredHistory).getByRole('button', { name: /^v3.*Revision of v2/s })).toBeTruthy()
    expect(within(restoredHistory).getByRole('button', { name: /^v2.*Original review/s })).toBeTruthy()
    expect(within(restoredHistory).getByRole('button', { name: /^v1.*Original review/s })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'v3 compared with parent v2' })).toBeTruthy()
    fireEvent.click(within(restoredHistory).getByRole('button', { name: /^v2/i }))
    expect(screen.getByText('Decision recorded — Rejected')).toBeTruthy()
    expect(screen.getAllByText(secondFindingEvidence ?? '', { selector: 'blockquote' })).toHaveLength(3)
  })

  it('keeps the review in memory and marks its history when session storage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    render(<App />)
    reviewDefinite()
    expect(screen.getByText(/History could not be saved for refresh/)).toBeTruthy()
    expect(screen.getByText('Session only')).toBeTruthy()
    expect(screen.getByText('SEC-001')).toBeTruthy()
  })

  it('shows a session-history warning after storage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    render(<App />)
    expect(screen.getByText(/Session history unavailable/)).toBeTruthy()
    expect(screen.getByText('Ready to review')).toBeTruthy()
  })

  it('continues in memory when the browser does not expose session storage', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get: () => { throw new Error('storage unavailable') },
    })
    try {
      render(<App />)
      expect(screen.getByText(/Session storage unavailable/)).toBeTruthy()
      reviewDefinite()
      expect(screen.getByText('DEFINITE CONFLICT')).toBeTruthy()
    } finally {
      cleanup()
      if (descriptor) Object.defineProperty(window, 'sessionStorage', descriptor)
      else Reflect.deleteProperty(window, 'sessionStorage')
    }
  })

  it('discards a malformed stored envelope and keeps the seeded baseline', () => {
    sessionStorage.setItem('speclock.session.v1', '{invalid json')
    render(<StrictMode><App /></StrictMode>)
    expect(screen.getByText(/Saved session could not be restored/)).toBeTruthy()
    expect(screen.getByText('SEC-001')).toBeTruthy()
    expect(sessionStorage.getItem('speclock.session.v1')).toBeNull()
  })

  it('restores an edited, unsubmitted proposal draft from session storage', () => {
    render(<App />)
    const proposal = screen.getByLabelText(/natural-language proposal/i)
    fireEvent.change(proposal, { target: { value: 'Keep this proposal draft for later.' } })
    expect(sessionStorage.getItem('speclock.session.v1')).toContain('Keep this proposal draft for later.')

    cleanup()
    render(<App />)
    expect((screen.getByLabelText(/natural-language proposal/i) as HTMLTextAreaElement).value)
      .toBe('Keep this proposal draft for later.')
  })

  it('does not restore a stale review result when the saved proposal draft is empty', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.change(screen.getByLabelText(/natural-language proposal/i), { target: { value: '' } })

    cleanup()
    render(<App />)

    expect((screen.getByLabelText(/natural-language proposal/i) as HTMLTextAreaElement).value).toBe('')
    expect(screen.getByRole('heading', { name: 'Write a proposal to begin' })).toBeTruthy()
    expect(screen.queryByLabelText('Review outcome')).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Review history' })).toBeTruthy()
  })

  it('keeps compatible results free of finding resolution controls', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /compatible change/i }))
    fireEvent.change(screen.getByLabelText(/natural-language proposal/i), {
      target: { value: 'Add a local keyboard shortcut that changes the editor appearance using only in-memory theme settings.' },
    })
    reviewDefinite()
    expect(screen.queryByRole('button', { name: 'Accept finding' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reject finding' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Revise proposal' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'No conflicts detected' })).toBeTruthy()
  })
})
