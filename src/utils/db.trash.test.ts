import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CVMetadata } from '../types/cv'

const memory = vi.hoisted(() => ({
  metadata: new Map<string, CVMetadata>(),
  content: new Map<string, unknown>(),
  trash: new Map<string, { metadata: CVMetadata; expiresAt: number }>(),
}))

vi.mock('localforage', () => {
  function createInstance(config: { storeName: string }) {
    const store =
      config.storeName === 'metadata'
        ? memory.metadata
        : config.storeName === 'content'
          ? memory.content
          : memory.trash

    return {
      async setItem(key: string, value: unknown) {
        store.set(key, value as never)
      },
      async getItem(key: string) {
        return store.has(key) ? store.get(key) : null
      },
      async removeItem(key: string) {
        store.delete(key)
      },
      async iterate(iterator: (value: unknown, key: string) => void) {
        for (const [key, value] of store.entries()) {
          iterator(value, key)
        }
      },
    }
  }

  return {
    default: { createInstance },
  }
})

import {
  moveToTrash,
  reconcileTrash,
  restoreFromTrash,
} from './db'

const sample: CVMetadata = {
  id: 'cv-1',
  name: 'Alice.pdf',
  type: 'pdf',
  addedAt: 1,
  status: 'new',
  tags: [],
  contacts: { email: null, phone: null, skills: [] },
  searchText: 'react typescript',
}

describe('db trash reconciliation', () => {
  beforeEach(() => {
    memory.metadata.clear()
    memory.content.clear()
    memory.trash.clear()
  })

  it('keeps pending trash out of active list and restores on undo', async () => {
    memory.metadata.set(sample.id, sample)
    memory.content.set(sample.id, 'pdf-bytes')

    await moveToTrash(sample, 5000)
    expect(memory.metadata.has(sample.id)).toBe(false)
    expect(memory.trash.has(sample.id)).toBe(true)

    const restored = await restoreFromTrash(sample.id)
    expect(restored?.id).toBe(sample.id)
    expect(memory.metadata.has(sample.id)).toBe(true)
    expect(memory.trash.has(sample.id)).toBe(false)
  })

  it('purges expired trash on reconcile', async () => {
    memory.content.set(sample.id, 'pdf-bytes')
    memory.trash.set(sample.id, {
      metadata: sample,
      expiresAt: Date.now() - 1000,
    })

    const result = await reconcileTrash()
    expect(result.items).toHaveLength(0)
    expect(result.pending).toBeNull()
    expect(memory.trash.has(sample.id)).toBe(false)
    expect(memory.content.has(sample.id)).toBe(false)
  })

  it('returns pending trash that is still within undo window', async () => {
    memory.content.set(sample.id, 'pdf-bytes')
    memory.trash.set(sample.id, {
      metadata: sample,
      expiresAt: Date.now() + 4000,
    })

    const result = await reconcileTrash()
    expect(result.pending?.metadata.id).toBe(sample.id)
    expect(result.items).toHaveLength(0)
  })
})
