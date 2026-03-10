export type Company = {
  id: string
  name: string
  logoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateCompanyPayload = {
  name: string
  logoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  active?: boolean
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>
