import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import Sidebar from '../components/Sidebar'
import cvReducer from '../store/cvSlice'
import type { CVMetadata } from '../types/cv'

vi.mock('../utils/parseCV', () => ({
  parseCVFile: vi.fn(),
}))

vi.mock('../utils/db', () => ({
  getAllCVMetadata: vi.fn(),
  deleteCVFromDB: vi.fn().mockResolvedValue(undefined),
  updateCVMetadataInDB: vi.fn(),
  saveCVToDB: vi.fn(),
  migrateLegacyLocalStorage: vi.fn(),
  moveToTrash: vi.fn().mockResolvedValue(undefined),
  restoreFromTrash: vi.fn(),
  purgeTrashEntry: vi.fn().mockResolvedValue(undefined),
  reconcileTrash: vi.fn(),
  isQuotaExceededError: vi.fn().mockReturnValue(false),
  MAX_CV_FILE_BYTES: 15 * 1024 * 1024,
}))

import { parseCVFile } from '../utils/parseCV'

const item: CVMetadata = {
  id: 'cv-1',
  name: 'Resume.pdf',
  type: 'pdf',
  addedAt: Date.now(),
  status: 'new',
  tags: ['frontend'],
  contacts: { email: 'a@b.co', phone: null, skills: ['React'] },
  searchText: 'react typescript resume body',
}

function renderSidebar() {
  const store = configureStore({
    reducer: { cv: cvReducer },
    preloadedState: {
      cv: {
        items: [item],
        activeId: item.id,
        isLoading: false,
        loadError: null,
        deletedItem: null,
        searchQuery: '',
      },
    },
  })

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </Provider>
    ),
  }
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(parseCVFile).mockReset()
  })

  it('shows upload error when parsing fails', async () => {
    const user = userEvent.setup()
    vi.mocked(parseCVFile).mockRejectedValue(new Error('Пошкоджений файл'))
    renderSidebar()

    const file = new File(['x'], 'bad.pdf', { type: 'application/pdf' })
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(input, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Пошкоджений файл'
    )
  })

  it('soft-deletes an item and exposes undo toast state', async () => {
    const user = userEvent.setup()
    const { store } = renderSidebar()

    await user.click(
      screen.getAllByRole('button', { name: 'Видалити Resume.pdf' })[0]!
    )

    await waitFor(() => {
      expect(store.getState().cv.items).toHaveLength(0)
      expect(store.getState().cv.deletedItem?.name).toBe('Resume.pdf')
    })
  })
})
