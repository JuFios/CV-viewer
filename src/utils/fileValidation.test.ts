import { describe, expect, it } from 'vitest'
import { MAX_CV_FILE_BYTES } from './db'
import { getUploadSizeError } from './fileValidation'

describe('fileValidation', () => {
  it('rejects files over the configured limit', () => {
    expect(getUploadSizeError(MAX_CV_FILE_BYTES)).toBeNull()
    expect(getUploadSizeError(MAX_CV_FILE_BYTES + 1)).toBe(
      'Файл завеликий. Максимум 15 МБ'
    )
  })
})
