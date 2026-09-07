export type CVFileType = 'pdf' | 'docx'

export type CVStatus = 'new' | 'interview' | 'offer' | 'rejected'

export interface CVContacts {
  email: string | null
  phone: string | null
  skills: string[]
}

export interface CVMetadata {
  id: string
  name: string
  type: CVFileType
  addedAt: number
  status: CVStatus
  tags: string[]
  contacts: CVContacts
  searchText: string
}

export type CVContent = Blob | string

export interface CVItem extends CVMetadata {
  content: CVContent
}

export const CV_STATUS_LABELS: Record<CVStatus, string> = {
  new: 'Новий',
  interview: 'Співбесіда',
  offer: 'Офер',
  rejected: 'Відмова',
}

export const CV_STATUS_CLASS: Record<CVStatus, string> = {
  new: 'status-new',
  interview: 'status-interview',
  offer: 'status-offer',
  rejected: 'status-rejected',
}

export const CV_STATUSES: CVStatus[] = ['new', 'interview', 'offer', 'rejected']
