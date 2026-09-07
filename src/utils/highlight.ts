export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function highlightHtml(html: string, query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return html

  const re = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi')
  const parts = html.split(/(<[^>]+>)/g)

  return parts
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) return part
      return part.replace(re, '<mark class="cv-highlight">$1</mark>')
    })
    .join('')
}

export function highlightPlainText(text: string, query: string): string {
  const escaped = escapeHtml(text)
  const trimmed = query.trim()
  if (!trimmed) return escaped
  const escapedQuery = escapeHtml(trimmed)
  const re = new RegExp(`(${escapeRegExp(escapedQuery)})`, 'gi')
  return escaped.replace(re, '<mark class="cv-highlight">$1</mark>')
}
