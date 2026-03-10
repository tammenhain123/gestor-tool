import api from './api'

export type NotificationPayload = {
  id: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export async function fetchNotifications() {
  const resp = await api.get<NotificationPayload[]>('/notifications')
  return resp.data
}

export async function markRead(id: string) {
  const resp = await api.put<NotificationPayload>(`/notifications/${id}/read`)
  return resp.data
}

export default { fetchNotifications, markRead }
