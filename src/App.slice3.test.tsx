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
  fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
  act(() => vi.advanceTimersByTime(181))
}

describe('Slice 3 end-to-end review flow', () => {
  it('records an finding-level Accept decision and shows persistent confirmation', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(screen.getByRole('status').textContent).toContain('Decision recorded — Accepted')
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull()
  })

  it('records Reject without implying feature approval', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(screen.getByText(/Decision recorded — Rejected/i)).toBeTruthy()
  })

  it('creates a revision and preserves the original evidence and decision in history', () => {
    render(<App />)
    reviewDefinite()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revise' }))

    const proposal = screen.getByLabelText(/natural-language proposal/i)
    expect((proposal as HTMLTextAreaElement).value).toContain('third-party analytics')
    fireEvent.change(proposal, { target: { value: 'Keep analytics local and send no identity data.' } })
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    act(() => vi.advanceTimersByTime(181))

    const history = screen.getByRole('navigation', { name: 'Review history' })
    expect(screen.getByRole('heading', { name: 'v2 compared with parent v1' })).toBeTruthy()
    expect(screen.getByText('Proposal text changed')).toBeTruthy()
    expect(screen.getByText('Removed finding')).toBeTruthy()
    expect(screen.getByText('New finding')).toBeTruthy()
    expect(within(history).getByText('v1')).toBeTruthy()
    expect(within(history).getByText('v2')).toBeTruthy()
    fireEvent.click(within(history).getByRole('button', { name: /^v1/i }))
    expect(screen.getByText(/This is the original review/)).toBeTruthy()
    expect(screen.getByText(/Decision recorded — Accepted/i)).toBeTruthy()
    expect(screen.getByText('SEC-001')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Revise' }))
    fireEvent.change(screen.getByLabelText(/natural-language proposal/i), { target: { value: 'Keep the revised analytics local.' } })
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    act(() => vi.advanceTimersByTime(181))
    expect(within(history).getByRole('button', { name: /^v3/i }).textContent).toContain('Revision of v1')
    expect(screen.getByRole('heading', { name: 'v3 compared with parent v1' })).toBeTruthy()
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

  it('keeps compatible results free of finding resolution controls', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /compatible change/i }))
    reviewDefinite()
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reject' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Revise' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'No conflicts detected' })).toBeTruthy()
  })
})
