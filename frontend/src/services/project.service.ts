import { api } from './api'
import { Project, CreateProjectPayload, UpdateProjectPayload } from '../types/project'

export type ProjectType = 'SAAS' | 'OFERTA' | 'DEMANDA'

const BASE = '/projects'

export async function getProjects(): Promise<Project[]> {
  try {
    const dbId = localStorage.getItem('db_user_id')
    if (dbId) {
      const userResp = await api.get(`/users/${dbId}`)
      const dbUser = userResp.data as any
      const role = String(dbUser?.role ?? '').toUpperCase()
      const tenant = dbUser?.company?.id ?? dbUser?.tenantId ?? null

      // If ADMIN or MASTER, request tenant-scoped projects
      if ((role === 'ADMIN' || role === 'MASTER') && tenant) {
        const res = await api.get<Project[]>(`${BASE}?tenantId=${tenant}`)
        return res.data
      }

      // If USER, request plain /projects and backend will return only member projects
      if (role === 'USER') {
        const res = await api.get<Project[]>(BASE)
        return res.data
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  const res = await api.get<Project[]>(BASE)
  return res.data
}

export async function getProject(id: string): Promise<Project> {
  const res = await api.get<Project>(`${BASE}/${id}`)
  return res.data
}

export async function getQualification(projectId: string): Promise<any> {
  const res = await api.get<any>(`${BASE}/${projectId}/qualification`)
  return res.data
}

export async function getCapacity(projectId: string): Promise<any> {
  const res = await api.get<any>(`${BASE}/${projectId}/capacity`)
  return res.data
}

export async function saveQualification(projectId: string, payload: any): Promise<any> {
  const res = await api.put<any>(`${BASE}/${projectId}/qualification`, payload)
  return res.data
}

export async function saveCapacity(projectId: string, payload: any): Promise<any> {
  const res = await api.put<any>(`${BASE}/${projectId}/capacity`, payload)
  return res.data
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const creatorId = localStorage.getItem('db_user_id') || undefined
  const body = { ...payload, ...(creatorId ? { creatorId } : {}) }
  const res = await api.post<Project>(BASE, body)
  return res.data
}

export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  const res = await api.put<Project>(`${BASE}/${id}`, payload)
  return res.data
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

export default { getProjects, getProject, createProject, updateProject, deleteProject }
