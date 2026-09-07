import type { CVContacts } from '../types/cv'

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g

const KNOWN_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Redux',
  'Next.js',
  'Vue',
  'Angular',
  'Node.js',
  'Express',
  'NestJS',
  'Python',
  'Django',
  'Flask',
  'Java',
  'Spring',
  'C#',
  '.NET',
  'Go',
  'Rust',
  'PHP',
  'Laravel',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Git',
  'CI/CD',
  'Tailwind',
  'CSS',
  'HTML',
  'Sass',
  'Webpack',
  'Vite',
  'Jest',
  'Cypress',
  'Playwright',
  'Figma',
  'Agile',
  'Scrum',
]

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
}

export function parseContactsFromContent(
  content: string,
  type: 'pdf' | 'docx'
): CVContacts {
  const text = type === 'docx' ? stripHtml(content) : content

  const emails = text.match(EMAIL_RE)
  const email = emails?.[0] ?? null

  const phones = (text.match(PHONE_RE) ?? [])
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, '').length >= 10)
  const phone = phones[0] ?? null

  const lower = text.toLowerCase()
  const skills = KNOWN_SKILLS.filter((skill) =>
    lower.includes(skill.toLowerCase())
  )

  return { email, phone, skills }
}
