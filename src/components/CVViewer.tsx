import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setActive } from '../store/cvSlice'
import { getCVContent } from '../utils/db'
import { highlightHtml } from '../utils/highlight'
import type { CVContent } from '../types/cv'
import CandidateCard from './CandidateCard'
import CVMetaControls from './CVMetaControls'

const PDFDocumentView = lazy(() => import('./PDFDocumentView'))

interface Props {
  id: string
}

function useCVContent(id: string) {
  const [state, setState] = useState<{
    content: CVContent | null
    loading: boolean
    error: string | null
  }>({ content: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    void getCVContent(id)
      .then((value) => {
        if (cancelled) return
        if (value == null) {
          setState({
            content: null,
            loading: false,
            error: 'Не вдалося завантажити вміст CV',
          })
        } else {
          setState({ content: value, loading: false, error: null })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            content: null,
            loading: false,
            error: 'Не вдалося завантажити вміст CV',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return state
}

export default function CVViewer({ id }: Props) {
  const dispatch = useAppDispatch()
  const isLoadingList = useAppSelector((s) => s.cv.isLoading)
  const cv = useAppSelector((s) => s.cv.items.find((item) => item.id === id))
  const searchQuery = useAppSelector((s) => s.cv.searchQuery)
  const { content, loading, error } = useCVContent(id)
  const frameRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(720)

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (!width) return
      setPageWidth(Math.min(920, Math.max(280, width - 48)))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const docxHtml = typeof content === 'string' ? content : null

  const highlightedHtml = useMemo(() => {
    if (!docxHtml || !cv || cv.type !== 'docx') return ''
    return highlightHtml(docxHtml, searchQuery)
  }, [docxHtml, cv, searchQuery])

  if (!isLoadingList && !cv) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base font-semibold text-[var(--color-ink)]">
          CV не знайдено
        </p>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">
          Цього файлу немає в локальному сховищі. Можливо, його вже видалили.
        </p>
        <Link
          to="/"
          onClick={() => dispatch(setActive(null))}
          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          На головну
        </Link>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
        Завантаження…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[var(--color-panel)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Документ
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--color-ink)]">
          {cv.name}
        </h2>
      </header>

      <CVMetaControls cv={cv} />
      <CandidateCard contacts={cv.contacts} />

      <div ref={frameRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {loading && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
            Завантаження…
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex h-full items-center justify-center text-sm text-rose-700"
          >
            {error}
          </div>
        )}
        {!loading && !error && cv.type === 'pdf' && content instanceof Blob && (
          <Suspense
            fallback={
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                Завантаження PDF-переглядача…
              </p>
            }
          >
            <PDFDocumentView
              file={content}
              fileName={cv.name}
              searchQuery={searchQuery}
              pageWidth={pageWidth}
            />
          </Suspense>
        )}
        {!loading &&
          !error &&
          cv.type === 'pdf' &&
          !(content instanceof Blob) &&
          content && (
            <div className="flex h-full items-center justify-center text-sm text-rose-700">
              Некоректний формат збереженого PDF
            </div>
          )}
        {!loading && !error && docxHtml && cv.type === 'docx' && (
          <div
            className="cv-docx mx-auto max-w-3xl rounded-2xl border border-[var(--color-line)] bg-white px-6 py-8 shadow-sm sm:px-10"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        )}
      </div>
    </div>
  )
}
