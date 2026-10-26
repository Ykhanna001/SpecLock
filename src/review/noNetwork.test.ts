import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    const isSource = entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')
    const isTest = entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')
    return isSource && !isTest ? [path] : []
  })
}

describe('no external network dependency', () => {
  it('core source contains no fetch, XMLHttpRequest, live AI client, or HTTP URL', () => {
    const forbidden = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /https?:\/\//, /api[_-]?key/i, /openai|anthropic|gemini/i]
    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      const source = readFileSync(file, 'utf8')
      for (const pattern of forbidden) {
        expect(source, `${file} matched ${pattern}`).not.toMatch(pattern)
      }
    }
  })
})
