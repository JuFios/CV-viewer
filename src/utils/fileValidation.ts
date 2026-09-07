import { MAX_CV_FILE_BYTES } from './db'

export function getUploadSizeError(size: number): string | null {
  if (size > MAX_CV_FILE_BYTES) {
    return 'Файл завеликий. Максимум 15 МБ'
  }
  return null
}
