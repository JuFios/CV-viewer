import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ResizableSidebar from './components/ResizableSidebar'
import UndoToast from './components/UndoToast'
import ErrorBoundary from './components/ErrorBoundary'
import EmptyState from './pages/EmptyState'
import CVPage from './pages/CVPage'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { loadCVs } from './store/cvSlice'
import { useMediaQuery } from './hooks/useMediaQuery'

export default function App() {
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector((s) => s.cv.isLoading)
  const loadError = useAppSelector((s) => s.cv.loadError)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [mobileOpen, setMobileOpen] = useState(false)
  const drawerOpen = !isDesktop && mobileOpen

  useEffect(() => {
    void dispatch(loadCVs())
  }, [dispatch])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  return (
    <div className="app-shell flex h-dvh w-screen flex-col overflow-hidden md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Перейти до вмісту
      </a>

      {!isDesktop && (
        <header className="flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 md:hidden">
          <button
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="mobile-sidebar"
            onClick={() => setMobileOpen((open) => !open)}
            className="btn-ghost rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]"
          >
            {drawerOpen ? 'Закрити' : 'Меню'}
          </button>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
              CV Viewer
            </p>
            <p className="text-xs text-[var(--color-muted)]">Локальний перегляд резюме</p>
          </div>
        </header>
      )}

      {isDesktop ? (
        <ResizableSidebar>
          <Sidebar />
        </ResizableSidebar>
      ) : (
        <>
          {drawerOpen && (
            <button
              type="button"
              aria-label="Закрити меню"
              className="fixed inset-0 z-40 bg-slate-900/35 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <div
            id="mobile-sidebar"
            className={`fixed inset-y-0 left-0 z-50 w-[min(20rem,88vw)] transform shadow-2xl transition-transform duration-200 md:hidden ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            aria-hidden={!drawerOpen}
            inert={!drawerOpen ? true : undefined}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <main id="main-content" className="min-w-0 flex-1 overflow-hidden" tabIndex={-1}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
            Завантаження збережених CV…
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="flex h-full items-center justify-center px-6 text-center text-sm text-rose-700"
          >
            {loadError}
          </div>
        ) : (
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<EmptyState />} />
              <Route path="/cv/:id" element={<CVPage />} />
            </Routes>
          </ErrorBoundary>
        )}
      </main>
      <UndoToast />
    </div>
  )
}
