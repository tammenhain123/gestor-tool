import { api } from './api'
import { Company, CreateCompanyPayload, UpdateCompanyPayload } from '../types/company'

const BASE = '/companies'

export async function getCompanies(): Promise<Company[]> {
  const res = await api.get<Company[]>(BASE)
  return res.data
}

export async function getCompany(id: string): Promise<Company> {
  const res = await api.get<Company>(`${BASE}/${id}`)
  return res.data
}

export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  const res = await api.post<Company>(BASE, payload)
  return res.data
}

export async function updateCompany(id: string, payload: UpdateCompanyPayload): Promise<Company> {
  const res = await api.put<Company>(`${BASE}/${id}`, payload)
  return res.data
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

export default {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
}
