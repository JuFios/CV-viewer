import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { highlightPlainText } from '../utils/highlight'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

interface LazyPageProps {
  pageNumber: number
  width: number
  customTextRenderer?: (textItem: { str: string }) => string
}

function LazyPage({ pageNumber, width, customTextRenderer }: LazyPageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(pageNumber <= 2)
  const minHeight = Math.round(width * 1.414)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div
      ref={ref}
      className="mb-4 flex justify-center"
      style={{ minHeight: visible ? undefined : minHeight }}
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          className="shadow-md"
          customTextRenderer={customTextRenderer}
          loading={
            <div
              className="bg-white shadow-md"
              style={{ width, height: minHeight }}
              aria-hidden
            />
          }
        />
      ) : (
        <div
          className="bg-white shadow-md"
          style={{ width, height: minHeight }}
          aria-hidden
        />
      )}
    </div>
  )
}

interface Props {
  file: Blob
  fileName: string
  searchQuery: string
  pageWidth: number
}

export default function PDFDocumentView({
  file,
  fileName,
  searchQuery,
  pageWidth,
}: Props) {
  const [numPages, setNumPages] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const downloadUrl = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => URL.revokeObjectURL(downloadUrl)
  }, [downloadUrl])

  const pdfTextRenderer = useMemo(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return undefined
    return (textItem: { str: string }) =>
      highlightPlainText(textItem.str, trimmed)
  }, [searchQuery])

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Document
        file={file}
        onLoadSuccess={({ numPages: n }) => {
          setLoadError(null)
          setNumPages(n)
        }}
        onLoadError={(err) => {
          setLoadError(err.message)
        }}
        loading={
          <p className="py-8 text-sm text-neutral-400">Рендер PDF…</p>
        }
        error={
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-red-600">
            <p>Не вдалося відобразити PDF</p>
            {loadError && (
              <p className="max-w-md text-center text-xs text-neutral-500">
                {loadError}
              </p>
            )}
            <a
              href={downloadUrl}
              download={fileName}
              className="text-blue-600 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Завантажити файл
            </a>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <LazyPage
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={pageWidth}
            customTextRenderer={pdfTextRenderer}
          />
        ))}
      </Document>
    </div>
  )
}
