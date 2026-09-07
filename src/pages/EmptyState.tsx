import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { seedDemoCVs } from '../store/cvSlice'

export default function EmptyState() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const itemsCount = useAppSelector((s) => s.cv.items.length)
  const [isSeeding, setIsSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setError(null)
    setIsSeeding(true)
    try {
      const firstId = await dispatch(seedDemoCVs()).unwrap()
      if (firstId) navigate(`/cv/${firstId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити демо')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] px-8 py-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          CV Viewer
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--color-ink)]">
          Оберіть або завантажте резюме
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          Підтримуються PDF і DOCX. Файли зберігаються лише локально у вашому
          браузері — без сервера й акаунтів.
        </p>
        {itemsCount === 0 && (
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => void handleSeed()}
              disabled={isSeeding}
              className="btn-primary"
            >
              {isSeeding ? 'Готуємо демо…' : 'Завантажити демо-дані'}
            </button>
            <p className="text-xs text-[var(--color-muted)]">
              2 приклади: Frontend PDF і Backend DOCX
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
