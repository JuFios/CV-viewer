import type { CVItem } from '../types/cv'
import { buildSimplePdf } from './buildSimplePdf'
import { normalizeSearchText } from './cvFilters'
import { parseContactsFromContent } from './parseContacts'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function createDemoCVs(now = Date.now()): CVItem[] {
  const frontendPdfLines = [
    'Olena Kovalenko — Frontend Developer',
    'Email: olena.kovalenko@example.com',
    'Phone: +380 67 111 22 33',
    '',
    'Summary',
    'Frontend developer with React, TypeScript and Redux Toolkit.',
    'Built accessible SPA dashboards and document viewers.',
    '',
    'Skills',
    'React, TypeScript, Redux, Vite, Tailwind, Jest, Cypress',
    '',
    'Experience',
    'Frontend Developer — Product Studio (2022-2025)',
    '- Shipped CV screening tools for recruiters',
    '- Improved PDF rendering performance with lazy pages',
  ]

  const frontendText = frontendPdfLines.join('\n')
  const frontendContacts = parseContactsFromContent(frontendText, 'pdf')

  const backendHtml = `
    <h1>Andrii Melnyk</h1>
    <p><strong>Backend Engineer</strong></p>
    <p>Email: andrii.melnyk@example.com<br/>Phone: +380 50 987 65 43</p>
    <h2>Summary</h2>
    <p>Backend engineer focused on Node.js, NestJS, PostgreSQL and Docker.</p>
    <h2>Skills</h2>
    <p>Node.js, NestJS, TypeScript, PostgreSQL, Redis, Docker, AWS, GraphQL</p>
    <h2>Experience</h2>
    <p><strong>Backend Engineer — Cloud Apps (2021-2025)</strong></p>
    <ul>
      <li>Designed REST and GraphQL APIs for hiring platforms</li>
      <li>Reduced p95 latency with caching and query tuning</li>
    </ul>
  `.trim()

  const backendText = stripHtml(backendHtml)
  const backendContacts = parseContactsFromContent(backendHtml, 'docx')

  return [
    {
      id: 'demo-frontend-pdf',
      name: 'Olena_Kovalenko_Frontend.pdf',
      type: 'pdf',
      content: buildSimplePdf(frontendPdfLines),
      addedAt: now - 1000,
      status: 'interview',
      tags: ['frontend', 'react'],
      contacts: frontendContacts,
      searchText: normalizeSearchText(frontendText),
    },
    {
      id: 'demo-backend-docx',
      name: 'Andrii_Melnyk_Backend.docx',
      type: 'docx',
      content: backendHtml,
      addedAt: now,
      status: 'new',
      tags: ['backend', 'nodejs'],
      contacts: backendContacts,
      searchText: normalizeSearchText(backendText),
    },
  ]
}
