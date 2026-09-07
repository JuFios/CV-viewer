import { pdfjs } from 'react-pdf'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let configured = false

export function ensurePdfWorker(): typeof pdfjs {
  if (!configured) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc
    configured = true
  }
  return pdfjs
}
