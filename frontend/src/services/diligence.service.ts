import api from './api'
import { CreateProjectPayload } from '../types/project'

export type CreateDiligencePayload = {
  projectId: string
  assigneeId: string
  startAt: string
  endAt: string
  description?: string
}

export async function createDiligence(payload: CreateDiligencePayload) {
  const resp = await api.post('/diligences', payload)
  return resp.data
}

export async function fetchDiligences() {
  const resp = await api.get('/diligences')
  return resp.data
}

export default { createDiligence, fetchDiligences }
