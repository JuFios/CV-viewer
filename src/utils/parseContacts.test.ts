import { describe, expect, it } from 'vitest'
import { parseContactsFromContent } from './parseContacts'

describe('parseContactsFromContent', () => {
  it('extracts email, phone and known skills from plain text', () => {
    const text = `
      Jane Doe
      jane.doe@example.com
      +380 67 123 45 67
      Skills: React, TypeScript, Redux, Docker
    `
    const result = parseContactsFromContent(text, 'pdf')
    expect(result.email).toBe('jane.doe@example.com')
    expect(result.phone).toContain('380')
    expect(result.skills).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'Redux', 'Docker'])
    )
  })

  it('strips html before parsing docx content', () => {
    const html =
      '<p>Contact: <a href="mailto:a@b.co">a@b.co</a></p><p>Knows Vue and NestJS</p>'
    const result = parseContactsFromContent(html, 'docx')
    expect(result.email).toBe('a@b.co')
    expect(result.skills).toEqual(expect.arrayContaining(['Vue', 'NestJS']))
  })

  it('returns empty contacts when nothing matches', () => {
    const result = parseContactsFromContent('Just a short bio.', 'pdf')
    expect(result).toEqual({ email: null, phone: null, skills: [] })
  })
})
