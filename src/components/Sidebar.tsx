import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addCV,
  softDeleteCV,
  setActive,
  setSearchQuery,
  seedDemoCVs,
} from '../store/cvSlice'
import { parseCVFile } from '../utils/parseCV'
import { parseContactsFromContent } from '../utils/parseContacts'
import { getUploadSizeError } from '../utils/fileValidation'
import { matchesCVQuery, matchesCVStatus, matchesCVTag, normalizeSearchText } from '../utils/cvFilters'
import {
  CV_STATUSES,
  CV_STATUS_LABELS,
  CV_STATUS_CLASS,
  type CVStatus,
} from '../types/cv'

type SortOption = 'name-asc' | 'name-desc' | 'date-new' | 'date-old'

const SORT_LABELS: Record<SortOption, string> = {
  'name-asc': 'Назва (А-Я)',
  'name-desc': 'Назва (Я-А)',
  'date-new': 'Спочатку нові',
  'date-old': 'Спочатку старі',
}

interface Props {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: Props) {
  const items = useAppSelector((s) => s.cv.items)
  const activeId = useAppSelector((s) => s.cv.activeId)
  const searchQuery = useAppSelector((s) => s.cv.searchQuery)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date-new')
  const [statusFilter, setStatusFilter] = useState<CVStatus | 'all'>('all')
  const [tagFilter, setTagFilter] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach((cv) => cv.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  const visibleItems = useMemo(() => {
    const filtered = items.filter(
      (cv) =>
        matchesCVQuery(cv, searchQuery) &&
        matchesCVStatus(cv, statusFilter) &&
        matchesCVTag(cv, tagFilter)
    )
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-old':
          return a.addedAt - b.addedAt
        case 'date-new':
        default:
          return b.addedAt - a.addedAt
      }
    })
  }, [items, searchQuery, sortBy, statusFilter, tagFilter])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleSelectTab = (id: string) => {
    dispatch(setActive(id))
    navigate(`/cv/${id}`)
    onNavigate?.()
  }

  const handleRemove = async (id: string) => {
    const remaining = items.filter((cv) => cv.id !== id)
    await dispatch(softDeleteCV(id))
    if (activeId === id) {
      navigate(remaining[0] ? `/cv/${remaining[0].id}` : '/')
    }
  }

  const processFile = async (file: File) => {
    setToast(null)
    setIsUploading(true)
    try {
      if (getUploadSizeError(file.size)) {
        throw new Error(getUploadSizeError(file.size)!)
      }
      const { type, content, text } = await parseCVFile(file)
      const contacts = parseContactsFromContent(text, type)
      const id = crypto.randomUUID()
      await dispatch(
        addCV({
          id,
          name: file.name,
          type,
          content,
          addedAt: Date.now(),
          status: 'new',
          tags: [],
          contacts,
          searchText: normalizeSearchText(text),
        })
      ).unwrap()
      navigate(`/cv/${id}`)
      onNavigate?.()
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : 'Не вдалося прочитати файл'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleSeedDemo = async () => {
    setToast(null)
    setIsSeeding(true)
    try {
      const firstId = await dispatch(seedDemoCVs()).unwrap()
      if (firstId) {
        navigate(`/cv/${firstId}`)
        onNavigate?.()
      }
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : 'Не вдалося завантажити демо'
      )
    } finally {
      setIsSeeding(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  return (
    <aside
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`sidebar-shell relative flex h-full w-full flex-col transition-colors ${
        isDragOver ? 'bg-teal-50' : ''
      }`}
      aria-label="Список резюме"
    >
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-teal-500 bg-teal-50/85 text-sm font-semibold text-teal-800">
          Відпустіть, щоб завантажити
        </div>
      )}

      <div className="border-b border-[var(--color-line)] px-4 py-4">
        <div className="mb-3 hidden md:block">
          <h1 className="text-base font-bold tracking-tight text-[var(--color-ink)]">
            CV Viewer
          </h1>
          <p className="text-xs text-[var(--color-muted)]">
            {items.length} у сховищі
          </p>
        </div>

        <label className="mb-2 block">
          <span className="sr-only">Пошук і підсвічування</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Пошук і підсвічування…"
            className="field"
          />
        </label>
        <label className="mb-2 block">
          <span className="sr-only">Сортування</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="field"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <option key={opt} value={opt}>
                {SORT_LABELS[opt]}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-2 block">
          <span className="sr-only">Фільтр за статусом</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CVStatus | 'all')
            }
            className="field"
          >
            <option value="all">Усі статуси</option>
            {CV_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CV_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        {allTags.length > 0 && (
          <label className="block">
            <span className="sr-only">Фільтр за тегом</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="field"
            >
              <option value="">Усі теги</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Завантажені CV">
        {items.length === 0 && (
          <p className="px-3 py-8 text-center text-sm leading-relaxed text-[var(--color-muted)]">
            Ще немає резюме.
            <br />
            Перетягніть PDF або DOCX сюди.
          </p>
        )}
        {items.length > 0 && visibleItems.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-[var(--color-muted)]">
            Нічого не знайдено
          </p>
        )}
        <ul className="space-y-1">
          {visibleItems.map((cv) => (
            <li
              key={cv.id}
              className={`group flex rounded-xl ${
                cv.id === activeId
                  ? 'bg-teal-50 ring-1 ring-teal-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectTab(cv.id)}
                aria-current={cv.id === activeId ? 'page' : undefined}
                className="min-w-0 flex-1 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset rounded-xl"
              >
                <span
                  className={`block truncate text-sm ${
                    cv.id === activeId
                      ? 'font-semibold text-teal-900'
                      : 'font-medium text-[var(--color-ink)]'
                  }`}
                >
                  {cv.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CV_STATUS_CLASS[cv.status]}`}
                  >
                    {CV_STATUS_LABELS[cv.status]}
                  </span>
                  {cv.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleRemove(cv.id)}
                className="icon-btn mr-1.5 shrink-0 self-center rounded-lg px-2 py-1 text-sm text-slate-400 opacity-100 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                title="Видалити"
                aria-label={`Видалити ${cv.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-[var(--color-line)] p-3">
        {toast && (
          <div
            role="alert"
            className="mb-2 rounded-lg bg-rose-50 px-2.5 py-2 text-xs leading-relaxed text-rose-700"
          >
            {toast}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || isSeeding}
          className="btn-primary"
        >
          {isUploading ? 'Завантаження…' : '+ Завантажити CV'}
        </button>
        {items.length === 0 && (
          <button
            type="button"
            onClick={() => void handleSeedDemo()}
            disabled={isUploading || isSeeding}
            className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-ink)] hover:bg-slate-50 disabled:opacity-60"
          >
            {isSeeding ? 'Готуємо демо…' : 'Завантажити демо-дані'}
          </button>
        )}
      </div>
    </aside>
  )
}
