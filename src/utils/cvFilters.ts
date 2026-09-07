import type { CVMetadata, CVStatus } from '../types/cv'

const SEARCH_TEXT_LIMIT = 80_000

export function normalizeSearchText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, SEARCH_TEXT_LIMIT).toLowerCase()
}

export function matchesCVQuery(cv: CVMetadata, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  return (
    cv.name.toLowerCase().includes(q) ||
    cv.tags.some((t) => t.toLowerCase().includes(q)) ||
    cv.contacts.skills.some((s) => s.toLowerCase().includes(q)) ||
    (cv.contacts.email?.toLowerCase().includes(q) ?? false) ||
    (cv.contacts.phone?.toLowerCase().includes(q) ?? false) ||
    cv.searchText.includes(q)
  )
}

export function matchesCVStatus(
  cv: CVMetadata,
  statusFilter: CVStatus | 'all'
): boolean {
  return statusFilter === 'all' || cv.status === statusFilter
}

export function matchesCVTag(cv: CVMetadata, tagFilter: string): boolean {
  return !tagFilter || cv.tags.includes(tagFilter)
}
