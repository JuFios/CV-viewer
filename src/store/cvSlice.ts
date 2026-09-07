import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { CVItem, CVMetadata, CVStatus } from '../types/cv'
import {
  migrateLegacyLocalStorage,
  moveToTrash,
  purgeTrashEntry,
  reconcileTrash,
  restoreFromTrash,
  saveCVToDB,
  updateCVMetadataInDB,
  isQuotaExceededError,
} from '../utils/db'
import { cancelFinalize, scheduleFinalize } from '../utils/deleteScheduler'

interface CVState {
  items: CVMetadata[]
  activeId: string | null
  isLoading: boolean
  loadError: string | null
  deletedItem: CVMetadata | null
  searchQuery: string
}

type CVRoot = { cv: CVState }

const initialState: CVState = {
  items: [],
  activeId: null,
  isLoading: true,
  loadError: null,
  deletedItem: null,
  searchQuery: '',
}

export const loadCVs = createAsyncThunk('cv/load', async (_, { dispatch }) => {
  await migrateLegacyLocalStorage()
  const result = await reconcileTrash()

  if (result.pending) {
    const remaining = result.pending.expiresAt - Date.now()
    const id = result.pending.metadata.id
    if (remaining <= 0) {
      await purgeTrashEntry(id)
      return { items: result.items, pending: null }
    }
    scheduleFinalize(() => {
      void dispatch(finalizeDelete(id))
    }, remaining)
  }

  return result
})

export const addCV = createAsyncThunk('cv/add', async (cv: CVItem) => {
  try {
    await saveCVToDB(cv)
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Недостатньо місця в сховищі браузера для цього файлу')
    }
    throw error instanceof Error
      ? error
      : new Error('Не вдалося зберегти CV')
  }
  return {
    id: cv.id,
    name: cv.name,
    type: cv.type,
    addedAt: cv.addedAt,
    status: cv.status,
    tags: cv.tags,
    contacts: cv.contacts,
    searchText: cv.searchText,
  } satisfies CVMetadata
})

export const seedDemoCVs = createAsyncThunk(
  'cv/seedDemo',
  async (_, { getState, dispatch }) => {
    const state = getState() as CVRoot
    if (state.cv.items.length > 0) {
      return state.cv.items[0]?.id ?? null
    }
    const { createDemoCVs } = await import('../utils/samples')
    const samples = createDemoCVs()
    let firstId: string | null = null
    for (const sample of samples) {
      const meta = await dispatch(addCV(sample)).unwrap()
      firstId ??= meta.id
    }
    return firstId
  }
)

export const finalizeDelete = createAsyncThunk(
  'cv/finalizeDelete',
  async (id: string) => {
    await purgeTrashEntry(id)
    return id
  }
)

export const softDeleteCV = createAsyncThunk(
  'cv/softDelete',
  async (id: string, { getState, dispatch }) => {
    const state = getState() as CVRoot
    const item = state.cv.items.find((cv) => cv.id === id)
    if (!item) return null

    const prev = state.cv.deletedItem
    cancelFinalize()
    if (prev && prev.id !== id) {
      await purgeTrashEntry(prev.id)
    }

    await moveToTrash(item, 5000)
    scheduleFinalize(() => {
      void dispatch(finalizeDelete(id))
    }, 5000)

    return item
  }
)

export const undoDeleteCV = createAsyncThunk(
  'cv/undoDelete',
  async (_, { getState }) => {
    const state = getState() as CVRoot
    const item = state.cv.deletedItem
    if (!item) return null
    cancelFinalize()
    const restored = await restoreFromTrash(item.id)
    return restored ?? item
  }
)

export const changeStatus = createAsyncThunk(
  'cv/changeStatus',
  async ({ id, status }: { id: string; status: CVStatus }) => {
    await updateCVMetadataInDB(id, { status })
    return { id, status }
  }
)

export const addTagToCV = createAsyncThunk(
  'cv/addTag',
  async ({ id, tag }: { id: string; tag: string }, { getState }) => {
    const state = getState() as CVRoot
    const item = state.cv.items.find((cv) => cv.id === id)
    if (!item) return null
    const trimmed = tag.trim()
    if (!trimmed || item.tags.includes(trimmed)) return null
    const tags = [...item.tags, trimmed]
    await updateCVMetadataInDB(id, { tags })
    return { id, tags }
  }
)

export const removeTagFromCV = createAsyncThunk(
  'cv/removeTag',
  async ({ id, tag }: { id: string; tag: string }, { getState }) => {
    const state = getState() as CVRoot
    const item = state.cv.items.find((cv) => cv.id === id)
    if (!item) return null
    const tags = item.tags.filter((t) => t !== tag)
    await updateCVMetadataInDB(id, { tags })
    return { id, tags }
  }
)

const cvSlice = createSlice({
  name: 'cv',
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<string | null>) => {
      state.activeId = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCVs.pending, (state) => {
        state.isLoading = true
        state.loadError = null
      })
      .addCase(loadCVs.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.deletedItem = action.payload.pending?.metadata ?? null
        if (
          state.activeId &&
          !action.payload.items.some((item) => item.id === state.activeId)
        ) {
          state.activeId = null
        }
        state.isLoading = false
      })
      .addCase(loadCVs.rejected, (state) => {
        state.isLoading = false
        state.loadError = 'Не вдалося завантажити збережені CV'
      })
      .addCase(addCV.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.activeId = action.payload.id
      })
      .addCase(softDeleteCV.fulfilled, (state, action) => {
        if (!action.payload) return
        state.deletedItem = action.payload
        state.items = state.items.filter((cv) => cv.id !== action.payload!.id)
        if (state.activeId === action.payload.id) {
          state.activeId = state.items[0]?.id ?? null
        }
      })
      .addCase(undoDeleteCV.fulfilled, (state, action) => {
        if (!action.payload) return
        state.items.unshift(action.payload)
        state.activeId = action.payload.id
        state.deletedItem = null
      })
      .addCase(finalizeDelete.fulfilled, (state, action) => {
        if (state.deletedItem?.id === action.payload) {
          state.deletedItem = null
        }
      })
      .addCase(changeStatus.fulfilled, (state, action) => {
        const item = state.items.find((i) => i.id === action.payload.id)
        if (item) item.status = action.payload.status
      })
      .addCase(addTagToCV.fulfilled, (state, action) => {
        if (!action.payload) return
        const item = state.items.find((i) => i.id === action.payload!.id)
        if (item) item.tags = action.payload.tags
      })
      .addCase(removeTagFromCV.fulfilled, (state, action) => {
        if (!action.payload) return
        const item = state.items.find((i) => i.id === action.payload!.id)
        if (item) item.tags = action.payload.tags
      })
  },
})

export const { setActive, setSearchQuery } = cvSlice.actions
export default cvSlice.reducer
