import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import CVViewer from '../components/CVViewer'
import ErrorBoundary from '../components/ErrorBoundary'
import { useAppDispatch } from '../store/hooks'
import { setActive } from '../store/cvSlice'

export default function CVPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (id) dispatch(setActive(id))
  }, [dispatch, id])

  if (!id) return null

  return (
    <ErrorBoundary>
      <CVViewer key={id} id={id} />
    </ErrorBoundary>
  )
}
