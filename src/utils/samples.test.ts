import { describe, expect, it } from 'vitest'
import { buildSimplePdf } from './buildSimplePdf'
import { createDemoCVs } from './samples'

describe('samples', () => {
  it('builds a non-empty pdf blob', async () => {
    const blob = buildSimplePdf(['Hello', 'World'])
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(100)
    const text = await blob.text()
    expect(text.startsWith('%PDF')).toBe(true)
    expect(text).toContain('Hello')
  })

  it('creates two demo cvs with searchable body text', () => {
    const demos = createDemoCVs(1_700_000_000_000)
    expect(demos).toHaveLength(2)
    expect(demos[0]?.type).toBe('pdf')
    expect(demos[1]?.type).toBe('docx')
    expect(demos[0]?.searchText).toContain('react')
    expect(demos[1]?.searchText).toContain('nestjs')
    expect(demos[0]?.contacts.email).toContain('@')
    expect(demos[1]?.contacts.email).toContain('@')
  })
})
