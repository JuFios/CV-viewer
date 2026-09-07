import { describe, expect, it } from 'vitest'
import {
  escapeHtml,
  escapeRegExp,
  highlightHtml,
  highlightPlainText,
} from './highlight'

describe('highlight helpers', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegExp('C++ (fun)')).toBe('C\\+\\+ \\(fun\\)')
  })

  it('escapes html in plain text', () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    )
  })

  it('wraps plain text matches in mark tags after escaping', () => {
    expect(highlightPlainText('React and react-dom', 'react')).toBe(
      '<mark class="cv-highlight">React</mark> and <mark class="cv-highlight">react</mark>-dom'
    )
  })

  it('does not allow raw html from pdf text layer', () => {
    expect(highlightPlainText('a <b> c', 'a')).toBe(
      '<mark class="cv-highlight">a</mark> &lt;b&gt; c'
    )
  })

  it('does not alter html tags while highlighting text nodes', () => {
    const html = '<p class="x">React rocks</p><span>Other</span>'
    expect(highlightHtml(html, 'React')).toBe(
      '<p class="x"><mark class="cv-highlight">React</mark> rocks</p><span>Other</span>'
    )
  })

  it('returns escaped content for empty query', () => {
    expect(highlightHtml('<p>Hi</p>', '  ')).toBe('<p>Hi</p>')
    expect(highlightPlainText('Hi', '')).toBe('Hi')
    expect(highlightPlainText('<Hi>', '')).toBe('&lt;Hi&gt;')
  })
})
