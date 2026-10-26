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

function enterProposal(text: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'Natural-language proposal' }), {
    target: { value: text },
  })
}

describe('SpecLock workspace', () => {
  it('renders the immutable Northstar baseline IDs and exact source text', () => {
    render(<App />)
    expect(screen.getByText('Northstar Notes')).toBeTruthy()
    expect(screen.getByText(/Northstar Notes.*Change review/)).toBeTruthy()
    expect(screen.getByText('Evidence-backed change review')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Review a proposed change' })).toBeTruthy()
    for (const [requirementId, requirementText] of [
      ['SEC-001', 'The application must make no external network requests. All note data must remain on the current device.'],
      ['PRIV-001', 'Analytics events may collect product usage counters only and must not include user identity, message content, or contact information.'],
      ['AC-001', 'Core note creation must work offline and must remain usable after browser storage is unavailable.'],
      ['EXC-001', 'The product does not include cloud synchronization, account systems, or third-party data exports.'],
    ]) {
      expect(screen.getByText(requirementId)).toBeTruthy()
      expect(screen.getByText(requirementText)).toBeTruthy()
    }
  })

  it('gives the initial findings area a clear next step and evidence preview', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Write a proposal to begin' })).toBeTruthy()
    expect(screen.getByText(/Enter your proposal, then run a review to see linked baseline requirements, exact proposal evidence, and the explanation behind each finding/i)).toBeTruthy()
  })

  it('starts with an empty proposal and a helpful placeholder', () => {
    render(<App />)
    const proposal = screen.getByRole('textbox', { name: 'Natural-language proposal' }) as HTMLTextAreaElement
    expect(proposal.value).toBe('')
    expect(proposal.placeholder).toBe('Describe the product change you want to review...')
  })

  it('lets each test category be selected without adding or replacing proposal text', () => {
    render(<App />)
    const proposal = screen.getByRole('textbox', { name: 'Natural-language proposal' }) as HTMLTextAreaElement
    for (const category of ['Definite conflict', 'Compatible change', 'Potential conflict']) {
      fireEvent.change(proposal, { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: category }))
      expect(proposal.value).toBe('')

      const userText = `My proposal for ${category}.`
      enterProposal(userText)
      fireEvent.click(screen.getByRole('button', { name: category }))
      expect(proposal.value).toBe(userText)
      expect(screen.getByRole('button', { name: category }).getAttribute('aria-pressed')).toBe('true')
    }
  })

  it('shows definite evidence for a manually entered proposal in the definite category', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Definite conflict' }))
    enterProposal("Add a third-party analytics integration that sends each user's email address and account identifier to an external service.")
    await reviewCurrentProposal()
    expect(screen.getAllByText('DEFINITE CONFLICT').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Review outcome').textContent).toContain('Definite conflict')
    expect(screen.getAllByText(/SEC-001|PRIV-001|EXC-001/).length).toBeGreaterThan(1)
    expect(screen.getByText(/directly contradicting the network, privacy, and scope exclusions/i)).toBeTruthy()
  })

  it('shows exact evidence and linked requirements for the explicit personal-data proposal', () => {
    const proposal = "Add a third-party analytics integration that sends each user's email address and account identifier to an external service."
    render(<App />)
    enterProposal(proposal)
    reviewCurrentProposal()

    expect(screen.getAllByText('DEFINITE CONFLICT').length).toBeGreaterThan(0)
    for (const requirementId of ['SEC-001', 'PRIV-001', 'EXC-001']) {
      expect(screen.getAllByText(requirementId).length).toBeGreaterThan(0)
    }
    const proposalEvidence = screen.getAllByText(/Add a third-party analytics integration/, { selector: 'blockquote' })
    expect(proposalEvidence).toHaveLength(3)
    expect(proposalEvidence.every((quote) => quote.textContent?.includes(proposal))).toBe(true)
    expect(screen.getAllByText(/conflicts with the recorded baseline/i).length).toBeGreaterThan(0)
  })

  it('shows no conflict for the compatible scenario without finding controls', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /compatible change/i }))
    enterProposal('Add a local keyboard shortcut that changes the editor appearance using only in-memory theme settings.')
    await reviewCurrentProposal()
    expect(screen.getByRole('heading', { name: 'No conflicts detected' })).toBeTruthy()
    expect(screen.getByLabelText('Review outcome').textContent).toContain('No conflicts detected')
    expect(screen.getByText(/No conflict with the recorded baseline was identified/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /accept|reject|revise/i })).toBeNull()
  })

  it('shows a potential finding for the ambiguous scenario', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /potential conflict/i }))
    enterProposal('Add optional telemetry synchronization so usage activity can be shared with a dashboard service.')
    await reviewCurrentProposal()
    expect(screen.getByText('POTENTIAL CONFLICT')).toBeTruthy()
    expect(screen.getByLabelText('Review outcome').textContent).toContain('Potential conflict')
    expect(screen.getByText(/outside the current device/i)).toBeTruthy()
  })

  it('shows an Unable to assess result without resolution controls for unsupported text', () => {
    render(<App />)
    enterProposal('Add an unrelated document export workflow.')
    reviewCurrentProposal()
    expect(screen.getByRole('heading', { name: 'Unable to assess' })).toBeTruthy()
    expect(screen.getByLabelText('Review outcome').textContent).toContain('Unable to assess')
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
    const proposal = screen.getByRole('textbox', { name: 'Natural-language proposal' })
    for (const text of ['', ' \t\n ']) {
      fireEvent.change(proposal, { target: { value: text } })
      fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
      expect(screen.getByRole('alert').textContent).toContain('Enter a proposal')
      expect(screen.queryByText('No conflicts detected')).toBeNull()
      expect(screen.queryByRole('navigation', { name: 'Review history' })).toBeNull()
    }
  })

  it('shows loading while the review is running and prevents duplicate submission', async () => {
    render(<App />)
    enterProposal('Add a local keyboard shortcut that changes the editor appearance using only in-memory theme settings.')
    fireEvent.click(screen.getByRole('button', { name: /review proposal/i }))
    expect(screen.getByText('Comparing evidence')).toBeTruthy()
    expect((screen.getByRole('button', { name: /reviewing/i }) as HTMLButtonElement).disabled).toBe(true)
    act(() => {
      vi.advanceTimersByTime(181)
    })
  })
})
