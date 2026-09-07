import { useState } from 'react'
import {
  CV_STATUSES,
  CV_STATUS_LABELS,
  type CVMetadata,
  type CVStatus,
} from '../types/cv'
import { useAppDispatch } from '../store/hooks'
import {
  addTagToCV,
  changeStatus,
  removeTagFromCV,
} from '../store/cvSlice'

interface Props {
  cv: CVMetadata
}

export default function CVMetaControls({ cv }: Props) {
  const dispatch = useAppDispatch()
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagInput.trim()) return
    void dispatch(addTagToCV({ id: cv.id, tag: tagInput }))
    setTagInput('')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <span className="font-medium">Статус</span>
        <select
          value={cv.status}
          onChange={(e) =>
            void dispatch(
              changeStatus({ id: cv.id, status: e.target.value as CVStatus })
            )
          }
          className="field w-auto min-w-36"
        >
          {CV_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CV_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-1.5">
        {cv.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => void dispatch(removeTagFromCV({ id: cv.id, tag }))}
              className="text-slate-400 hover:text-rose-600"
              aria-label={`Видалити тег ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <form onSubmit={handleAddTag} className="flex items-center gap-1">
          <label>
            <span className="sr-only">Новий тег</span>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Тег…"
              className="field w-28 py-1 text-xs"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700"
            aria-label="Додати тег"
          >
            +
          </button>
        </form>
      </div>
    </div>
  )
}
