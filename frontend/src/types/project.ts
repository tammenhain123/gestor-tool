import { ProjectType } from '../services/project.service'

export type Project = {
  id: string
  name: string
  imageUrl?: string | null
  type: ProjectType
  description?: string | null
  company: { id: string; name: string }
  creator: { id: string; username?: string | null }
  users?: { id: string; username?: string | null }[]
  // admin/viewer removed from project shape
  createdAt: string
  updatedAt: string
}

export type CreateProjectPayload = {
  name: string
  imageUrl?: string
  type: ProjectType
  description?: string
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>
