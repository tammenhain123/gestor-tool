import api from './api'

export async function presign(projectId: string, filename: string, projectName?: string, tabName?: string) {
  const body: any = { filename }
  if (projectName) body.projectName = projectName
  if (tabName) body.tabName = tabName
  const res = await api.post(`/projects/${projectId}/files/presign`, body)
  return res.data as { key: string; url: string }
}

export async function list(projectId: string) {
  const res = await api.get(`/projects/${projectId}/files`)
  return res.data as any[]
}

export async function saveMetadata(projectId: string, payload: { key: string; originalName: string; mimeType?: string; size?: number; uploadedBy?: string; qualificationId?: string; capacityId?: string; companyId?: string }) {
  const res = await api.post(`/projects/${projectId}/files/metadata`, payload)
  return res.data
}

export async function presignGet(projectId: string, key: string) {
  const res = await api.get(`/projects/${projectId}/files/presign-get?key=${encodeURIComponent(key)}`)
  return res.data as { url: string }
}

export default { presign, saveMetadata, presignGet, list }
