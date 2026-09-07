import type { CVContacts } from '../types/cv'

interface Props {
  contacts: CVContacts
}

export default function CandidateCard({ contacts }: Props) {
  const hasAnything =
    contacts.email || contacts.phone || contacts.skills.length > 0

  if (!hasAnything) return null

  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        Картка кандидата
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--color-ink)]">
        {contacts.email && (
          <a
            href={`mailto:${contacts.email}`}
            className="font-medium text-teal-700 hover:underline"
          >
            {contacts.email}
          </a>
        )}
        {contacts.phone && (
          <span className="text-[var(--color-muted)]">{contacts.phone}</span>
        )}
      </div>
      {contacts.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {contacts.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900 ring-1 ring-teal-100"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
