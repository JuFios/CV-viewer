import mammoth from 'mammoth'
import DOMPurify from 'dompurify'
import type { CVContent, CVFileType } from '../types/cv'
import { ensurePdfWorker } from './pdfWorker'

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'))
    reader.readAsArrayBuffer(file)
  })
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = ensurePdfWorker()
  const pdf = await pdfjs.getDocument({ data: data.slice(0) }).promise
  const parts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    parts.push(pageText)
  }
  return parts.join('\n')
}

export function detectFileType(file: File): CVFileType | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
  if (
    name.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'docx'
  return null
}

export async function parseCVFile(
  file: File
): Promise<{ type: CVFileType; content: CVContent; text: string }> {
  const type = detectFileType(file)
  if (!type) {
    throw new Error('Непідтримуваний формат файлу. Дозволені: .pdf, .docx')
  }

  if (type === 'pdf') {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    const text = await extractPdfText(arrayBuffer.slice(0))
    const content = file.slice(0, file.size, 'application/pdf')
    return { type, content, text }
  }

  const arrayBuffer = await readFileAsArrayBuffer(file)
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const content = DOMPurify.sanitize(result.value, {
    USE_PROFILES: { html: true },
  })
  return { type, content, text: content }
}
