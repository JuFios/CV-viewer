import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_WIDTH = 200
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 256
const STORAGE_KEY = 'cv-viewer:sidebar-width'

interface Props {
  children: React.ReactNode
}

export default function ResizableSidebar({ children }: Props) {
  const [width, setWidth] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const n = raw ? Number(raw) : DEFAULT_WIDTH
      return Number.isFinite(n)
        ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n))
        : DEFAULT_WIDTH
    } catch {
      return DEFAULT_WIDTH
    }
  })
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(width)

  const persistWidth = useCallback((next: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // ignore quota / private mode
    }
  }, [])

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return
    const next = startWidth.current + (e.clientX - startX.current)
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)))
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    setWidth((w) => {
      persistWidth(w)
      return w
    })
  }, [persistWidth])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const delta = e.key === 'ArrowRight' ? 16 : -16
    setWidth((w) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w + delta))
      persistWidth(next)
      return next
    })
  }

  return (
    <div className="relative flex h-full shrink-0" style={{ width }}>
      <div className="h-full w-full overflow-hidden">{children}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(width)}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-label="Змінити ширину панелі"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className="absolute top-0 right-0 z-20 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-teal-400/40 focus:outline-none focus-visible:bg-teal-500/50 active:bg-teal-500/50"
      />
    </div>
  )
}
