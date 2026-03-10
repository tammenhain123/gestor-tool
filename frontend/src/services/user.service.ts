import { api } from './api'
import { User } from '../types/user'

const BASE = '/users'

export async function getUser(id: string): Promise<User> {
  const res = await api.get<User>(`${BASE}/${id}`)
  return res.data
}

export default { getUser }
import api from './api'
import { CreateUserDto, UpdateUserDto, User } from '../types/user'

export async function fetchUsers() {
  // prefer to send tenantId so backend returns only users for the caller's company
  try {
    const dbId = localStorage.getItem('db_user_id')
    if (dbId) {
      const userResp = await api.get(`/users/${dbId}`)
      const dbUser = userResp.data as any
      const tenant = dbUser?.company?.id ?? dbUser?.tenantId ?? null
      if (tenant) {
        const resp = await api.get(`/admin/users?tenantId=${tenant}`)
        return resp.data as User[]
      }
    }
  } catch (e) {
    // ignore and fallback
  }

  const resp = await api.get('/admin/users')
  return resp.data as User[]
}

export async function createUser(dto: CreateUserDto) {
  const resp = await api.post('/admin/users', dto)
  return resp.data as User
}

export async function updateUser(id: string, dto: UpdateUserDto) {
  const resp = await api.put(`/admin/users/${id}`, dto)
  return resp.data as User
}

export async function deleteUser(id: string) {
  const resp = await api.delete(`/admin/users/${id}`)
  return resp.data
}

export async function getActiveSummary() {
  try {
    const resp = await api.get('/admin/users/active')
    return resp.data as { total: number; active: number }
  } catch (e) {
    return { total: 0, active: 0 }
  }
}

export async function getLeaderboard(days = 7, limit = 5) {
  try {
    const resp = await api.get(`/admin/users/leaderboard?days=${days}&limit=${limit}`)
    return resp.data as Array<{ userId: string; username: string | null; companyName?: string | null; score: number }>
  } catch (e) {
    return []
  }
}
