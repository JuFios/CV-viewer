import { useAppDispatch, useAppSelector } from '../store/hooks'
import { undoDeleteCV } from '../store/cvSlice'

export default function UndoToast() {
  const deletedItem = useAppSelector((s) => s.cv.deletedItem)
  const dispatch = useAppDispatch()

  if (!deletedItem) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"
    >
      <span>Видалено «{deletedItem.name}»</span>
      <button
        type="button"
        onClick={() => void dispatch(undoDeleteCV())}
        className="rounded-lg bg-white/15 px-2.5 py-1 font-semibold hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Скасувати
      </button>
    </div>
  )
}
