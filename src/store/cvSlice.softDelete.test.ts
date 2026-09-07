import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import cvReducer, {
  softDeleteCV,
  undoDeleteCV,
} from '../store/cvSlice'
import type { CVMetadata } from '../types/cv'
import { resetDeleteSchedulerForTests } from '../utils/deleteScheduler'

vi.mock('../utils/db', () => ({
  getAllCVMetadata: vi.fn(),
  deleteCVFromDB: vi.fn().mockResolvedValue(undefined),
  updateCVMetadataInDB: vi.fn(),
  saveCVToDB: vi.fn(),
  migrateLegacyLocalStorage: vi.fn(),
  moveToTrash: vi.fn().mockResolvedValue(undefined),
  restoreFromTrash: vi.fn().mockImplementation(async (id: string) => ({
    id,
    name: 'Alice.pdf',
    type: 'pdf',
    addedAt: 1,
    status: 'new',
    tags: [],
    contacts: { email: null, phone: null, skills: [] },
    searchText: '',
  })),
  purgeTrashEntry: vi.fn().mockResolvedValue(undefined),
  reconcileTrash: vi.fn(),
  isQuotaExceededError: vi.fn().mockReturnValue(false),
}))

import { moveToTrash, purgeTrashEntry, restoreFromTrash } from '../utils/db'

const sample: CVMetadata = {
  id: 'cv-1',
  name: 'Alice.pdf',
  type: 'pdf',
  addedAt: 1,
  status: 'new',
  tags: [],
  contacts: { email: null, phone: null, skills: [] },
  searchText: '',
}

function createStore(items: CVMetadata[] = [sample]) {
  return configureStore({
    reducer: { cv: cvReducer },
    preloadedState: {
      cv: {
        items,
        activeId: items[0]?.id ?? null,
        isLoading: false,
        loadError: null,
        deletedItem: null,
        searchQuery: '',
      },
    },
  })
}

describe('soft delete flow', () => {
  beforeEach(() => {
    resetDeleteSchedulerForTests()
    vi.mocked(moveToTrash).mockClear()
    vi.mocked(purgeTrashEntry).mockClear()
    vi.mocked(restoreFromTrash).mockClear()
    vi.useFakeTimers()
  })

  it('removes item from list and restores on undo before timeout', async () => {
    const store = createStore()
    await store.dispatch(softDeleteCV('cv-1'))
    expect(store.getState().cv.items).toHaveLength(0)
    expect(store.getState().cv.deletedItem?.id).toBe('cv-1')
    expect(moveToTrash).toHaveBeenCalledWith(sample, 5000)

    await store.dispatch(undoDeleteCV())
    expect(store.getState().cv.items).toHaveLength(1)
    expect(store.getState().cv.deletedItem).toBeNull()
    expect(restoreFromTrash).toHaveBeenCalledWith('cv-1')
    expect(purgeTrashEntry).not.toHaveBeenCalled()
  })

  it('finalizes deletion after timeout', async () => {
    const store = createStore()
    await store.dispatch(softDeleteCV('cv-1'))

    await vi.advanceTimersByTimeAsync(5000)

    expect(purgeTrashEntry).toHaveBeenCalledWith('cv-1')
    await waitForDeletedCleared(store)
  })
})

async function waitForDeletedCleared(
  store: ReturnType<typeof createStore>
): Promise<void> {
  for (let i = 0; i < 10; i++) {
    if (store.getState().cv.deletedItem === null) return
    await Promise.resolve()
  }
  expect(store.getState().cv.deletedItem).toBeNull()
}
