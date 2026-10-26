import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8')
const globalCss = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')

describe('responsive workspace layout', () => {
  it('keeps the proposal prominent without imposing a viewport-height panel', () => {
    const desktopGrid = css.match(/\.workspace-grid\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(desktopGrid).toMatch(/grid-template-columns:\s*minmax\(0,\s*1\.15fr\)\s*minmax\(220px,\s*0\.65fr\)\s*minmax\(0,\s*1\.3fr\)/)
    expect(desktopGrid).not.toMatch(/min-height/)
    expect(css).toMatch(/textarea\s*\{[^}]*min-height:\s*128px;/)
    expect(css).toMatch(/\.review-button\s*\{[^}]*min-height:\s*42px;/)
  })

  it('compacts baseline cards and keeps the initial findings guidance content-led', () => {
    expect(css).toMatch(/\.baseline-item p\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*1\.48;/)
    expect(css).toMatch(/\.empty-result\s*\{[^}]*min-height:\s*0;[^}]*border-style:\s*dashed;/)
  })

  it('moves findings below the baseline and proposal at the tablet breakpoint', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*980px\)[\s\S]*?\.findings-panel\s*\{\s*grid-column:\s*1\s*\/\s*-1;/)
  })

  it('stacks workspace panels and evidence details on narrow viewports', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*680px\)[\s\S]*?\.workspace-grid\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;/)
    expect(css).toMatch(/\.evidence-row,\s*\.next-steps\s*\{\s*grid-template-columns:\s*1fr;/)
    expect(css).toMatch(/@media\s*\(max-width:\s*680px\)[\s\S]*?\.comparison-detail-row\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);/)
    expect(css).toMatch(/\.comparison-mobile-label\s*\{\s*display:\s*block;/)
    expect(css).toMatch(/\.comparison-detail-row > p\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/)
  })

  it('keeps local-review status visible and allows the narrow header to wrap', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*680px\)[\s\S]*?\.topbar\s*\{[^}]*flex-wrap:\s*wrap;[\s\S]*?\.topbar-context\s*\{[^}]*margin-left:\s*auto;/)
    expect(css).not.toMatch(/\.local-badge\s*,\s*\.topbar-divider\s*\{\s*display:\s*none;/)
  })

  it('defines a shared dark theme and visible focus and reduced-motion treatments', () => {
    expect(globalCss).toContain('--surface-canvas: #0b0c10;')
    expect(globalCss).toContain('--accent: #a78bfa;')
    expect(globalCss).toContain('--status-definite:')
    expect(globalCss).toContain('--status-potential:')
    expect(globalCss).toContain('--status-compatible:')
    expect(globalCss).toContain('--status-limited:')
    expect(globalCss).toMatch(/button:focus-visible,\s*textarea:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--focus-ring\);/)
    expect(globalCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })
})
