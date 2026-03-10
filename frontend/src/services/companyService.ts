import api from './api'

export async function fetchCompanies() {
  const resp = await api.get('/companies')
  return resp.data
}
