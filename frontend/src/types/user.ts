export type Role = 'MASTER' | 'ADMIN' | 'USER'

export type User = {
  id: string
  keycloakId: string
  username?: string | null
  email?: string | null
  tenantId?: string | null
  role: Role
  company?: { id: string; name: string } | null
  createdAt?: string
  updatedAt?: string
}

export type CreateUserDto = {
  username: string
  email: string
  password?: string
  role?: Role
  companyId?: string
}

export type UpdateUserDto = Partial<CreateUserDto>
