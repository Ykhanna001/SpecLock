import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

vi.useFakeTimers()

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

function reviewCurrentProposal() {
  fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
  act(() => {
    vi.advanceTimersByTime(181)
  })
}

describe('SpecLock workspace', () => {
  it('renders the immutable Northstar baseline IDs and exact source text', () => {
    render(<App />)
    expect(screen.getAllByText('Northstar Notes')).toHaveLength(2)
    expect(screen.getByText('SEC-001')).toBeTruthy()
    expect(screen.getByText(/must make no external network requests/i)).toBeTruthy()
    expect(screen.getByText('EXC-001')).toBeTruthy()
  })

  it('shows definite evidence for the seeded conflicting proposal', async () => {
    render(<App />)
    await reviewCurrentProposal()
    expect(screen.getByText('DEFINITE CONFLICT')).toBeTruthy()
    expect(screen.getAllByText(/SEC-001|PRIV-001|EXC-001/).length).toBeGreaterThan(1)
    expect(screen.getByText(/directly contradicting the network, privacy, and scope exclusions/i)).toBeTruthy()
  })

  it('shows no conflict for the compatible scenario without finding controls', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /compatible change/i }))
    await reviewCurrentProposal()
    expect(screen.getByRole('heading', { name: 'No conflicts detected' })).toBeTruthy()
    expect(screen.getByText(/No conflict with the recorded baseline was identified/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /accept|reject|revise/i })).toBeNull()
  })

  it('shows a potential finding for the ambiguous scenario', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /potential conflict/i }))
    await reviewCurrentProposal()
    expect(screen.getByText('POTENTIAL CONFLICT')).toBeTruthy()
    expect(screen.getByText(/outside the current device/i)).toBeTruthy()
  })

  it('shows an Unable to assess result without resolution controls for unsupported text', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/natural-language proposal/i), {
      target: { value: 'Add an unrelated document export workflow.' },
    })
    reviewCurrentProposal()
    expect(screen.getByRole('heading', { name: 'Unable to assess' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /accept|reject|revise/i })).toBeNull()
  })

  it('keeps the proposal input and scenario controls accessible by label and role', () => {
    render(<App />)
    expect(screen.getByRole('group', { name: 'Seeded scenarios' })).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Natural-language proposal' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Review proposal' })).toBeTruthy()
  })

  it('shows an empty input error without producing a result', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/natural-language proposal/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    expect(screen.getByRole('alert').textContent).toContain('Enter a proposal')
    expect(screen.queryByText('No conflicts detected')).toBeNull()
  })

  it('shows loading while the review is running and prevents duplicate submission', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    expect(screen.getByText('Comparing evidence')).toBeTruthy()
    expect((screen.getByRole('button', { name: /reviewing/i }) as HTMLButtonElement).disabled).toBe(true)
    act(() => {
      vi.advanceTimersByTime(181)
    })
  })
})
