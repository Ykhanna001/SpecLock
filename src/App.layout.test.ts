import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8')

describe('responsive workspace layout', () => {
  it('moves findings below the baseline and proposal at the tablet breakpoint', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*980px\)[\s\S]*?\.findings-panel\s*\{\s*grid-column:\s*1\s*\/\s*-1;/)
  })

  it('stacks workspace panels and evidence details on narrow viewports', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*680px\)[\s\S]*?\.workspace-grid\s*\{\s*display:\s*block;/)
    expect(css).toMatch(/\.evidence-row,\s*\.next-steps\s*\{\s*grid-template-columns:\s*1fr;/)
    expect(css).toMatch(/\.comparison-detail-headings,\s*\.comparison-detail-row\s*\{[\s\S]*?grid-template-columns:\s*64px\s+1fr\s+1fr;/)
  })
})
