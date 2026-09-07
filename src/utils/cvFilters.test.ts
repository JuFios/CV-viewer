import { describe, expect, it } from 'vitest'
import {
  matchesCVQuery,
  matchesCVStatus,
  matchesCVTag,
  normalizeSearchText,
} from './cvFilters'
import type { CVMetadata } from '../types/cv'

const base: CVMetadata = {
  id: '1',
  name: 'Alice_Frontend.pdf',
  type: 'pdf',
  addedAt: 1,
  status: 'interview',
  tags: ['react'],
  contacts: {
    email: 'alice@example.com',
    phone: '+380671112233',
    skills: ['TypeScript'],
  },
  searchText: normalizeSearchText(
    'Frontend developer with Redux Toolkit and accessibility focus'
  ),
}

describe('cvFilters', () => {
  it('normalizes and truncates search text', () => {
    expect(normalizeSearchText('  Hello   World  ')).toBe('hello world')
    expect(normalizeSearchText('a'.repeat(90_000)).length).toBe(80_000)
  })

  it('matches by document body text, not only filename', () => {
    expect(matchesCVQuery(base, 'accessibility')).toBe(true)
    expect(matchesCVQuery(base, 'redux toolkit')).toBe(true)
    expect(matchesCVQuery(base, 'golang')).toBe(false)
  })

  it('matches tags, email and status helpers', () => {
    expect(matchesCVQuery(base, 'alice@example.com')).toBe(true)
    expect(matchesCVQuery(base, 'react')).toBe(true)
    expect(matchesCVStatus(base, 'interview')).toBe(true)
    expect(matchesCVStatus(base, 'offer')).toBe(false)
    expect(matchesCVTag(base, 'react')).toBe(true)
    expect(matchesCVTag(base, '')).toBe(true)
  })
})
