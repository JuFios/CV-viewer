import localforage from 'localforage'
import type { CVContent, CVItem, CVMetadata } from '../types/cv'

const metadataStore = localforage.createInstance({
  name: 'cv-viewer',
  storeName: 'metadata',
})

const contentStore = localforage.createInstance({
  name: 'cv-viewer',
  storeName: 'content',
})

const trashStore = localforage.createInstance({
  name: 'cv-viewer',
  storeName: 'trash',
})

const LEGACY_STORAGE_KEY = 'cv-viewer:items'
export const MAX_CV_FILE_BYTES = 15 * 1024 * 1024

export interface TrashEntry {
  metadata: CVMetadata
  expiresAt: number
}

export async function saveCVToDB(cv: CVItem): Promise<void> {
  const { content, ...metadata } = cv
  await metadataStore.setItem(cv.id, metadata)
  await contentStore.setItem(cv.id, content)
}

function normalizeMetadata(value: Partial<CVMetadata> & { id: string }): CVMetadata {
  return {
    id: value.id,
    name: value.name ?? 'Untitled',
    type: value.type === 'pdf' ? 'pdf' : 'docx',
    addedAt: typeof value.addedAt === 'number' ? value.addedAt : Date.now(),
    status: value.status ?? 'new',
    tags: Array.isArray(value.tags) ? value.tags : [],
    contacts: {
      email: value.contacts?.email ?? null,
      phone: value.contacts?.phone ?? null,
      skills: Array.isArray(value.contacts?.skills)
        ? value.contacts.skills
        : [],
    },
    searchText:
      typeof value.searchText === 'string' ? value.searchText.toLowerCase() : '',
  }
}

async function normalizeContent(raw: unknown): Promise<CVContent | null> {
  if (raw instanceof Blob) return raw
  if (typeof raw !== 'string') return null
  if (raw.startsWith('data:')) {
    const response = await fetch(raw)
    return await response.blob()
  }
  return raw
}

export async function getAllCVMetadata(): Promise<CVMetadata[]> {
  const items: CVMetadata[] = []
  await metadataStore.iterate((value) => {
    if (value && typeof value === 'object' && 'id' in value) {
      items.push(normalizeMetadata(value as Partial<CVMetadata> & { id: string }))
    }
  })
  return items.sort((a, b) => b.addedAt - a.addedAt)
}

export async function getCVContent(id: string): Promise<CVContent | null> {
  const raw = await contentStore.getItem(id)
  const normalized = await normalizeContent(raw)
  if (
    normalized instanceof Blob &&
    typeof raw === 'string' &&
    raw.startsWith('data:')
  ) {
    await contentStore.setItem(id, normalized)
  }
  return normalized
}

export async function deleteCVFromDB(id: string): Promise<void> {
  await metadataStore.removeItem(id)
  await contentStore.removeItem(id)
  await trashStore.removeItem(id)
}

export async function moveToTrash(
  metadata: CVMetadata,
  ttlMs = 5000
): Promise<void> {
  await metadataStore.removeItem(metadata.id)
  await trashStore.setItem(metadata.id, {
    metadata,
    expiresAt: Date.now() + ttlMs,
  } satisfies TrashEntry)
}

export async function restoreFromTrash(id: string): Promise<CVMetadata | null> {
  const entry = await trashStore.getItem<TrashEntry>(id)
  if (!entry) return null
  await metadataStore.setItem(id, entry.metadata)
  await trashStore.removeItem(id)
  return entry.metadata
}

export async function purgeTrashEntry(id: string): Promise<void> {
  await trashStore.removeItem(id)
  await contentStore.removeItem(id)
  await metadataStore.removeItem(id)
}

export async function reconcileTrash(): Promise<{
  items: CVMetadata[]
  pending: TrashEntry | null
}> {
  const now = Date.now()
  const expiredIds: string[] = []
  let pending: TrashEntry | null = null

  await trashStore.iterate((value, key) => {
    if (!value || typeof value !== 'object') return
    const entry = value as TrashEntry
    if (!entry.metadata?.id || typeof entry.expiresAt !== 'number') {
      expiredIds.push(String(key))
      return
    }
    if (entry.expiresAt <= now) {
      expiredIds.push(entry.metadata.id)
      return
    }
    if (!pending || entry.expiresAt > pending.expiresAt) {
      pending = entry
    }
  })

  await Promise.all(expiredIds.map((id) => purgeTrashEntry(id)))
  const items = await getAllCVMetadata()
  return { items, pending }
}

export async function updateCVMetadataInDB(
  id: string,
  updates: Partial<CVMetadata>
): Promise<void> {
  const existing = await metadataStore.getItem<CVMetadata>(id)
  if (existing) {
    await metadataStore.setItem(id, { ...existing, ...updates })
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

export async function migrateLegacyLocalStorage(): Promise<void> {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return
    }
    const existing = await getAllCVMetadata()
    if (existing.length > 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return
    }
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>
      if (typeof record.id !== 'string' || typeof record.content !== 'string') {
        continue
      }
      const content = await normalizeContent(record.content)
      if (content == null) continue
      const cv: CVItem = {
        id: record.id,
        name: typeof record.name === 'string' ? record.name : 'Untitled',
        type: record.type === 'pdf' ? 'pdf' : 'docx',
        content,
        addedAt:
          typeof record.addedAt === 'number' ? record.addedAt : Date.now(),
        status: 'new',
        tags: [],
        contacts: { email: null, phone: null, skills: [] },
        searchText: '',
      }
      await saveCVToDB(cv)
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
  }
}
