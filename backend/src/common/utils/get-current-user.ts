import { Request } from 'express'
import { Role } from '../../users/user.entity'

export function getCurrentUserFromRequest(req: Request) {
  const user = (req as any).user
  if (!user) return null

  return {
    id: user.id ?? user.sub,
    username: user.username ?? user.preferred_username ?? user.email,
    role: user.role ?? (user.realm_access?.roles?.includes('MASTER') ? Role.MASTER : user.realm_access?.roles?.[0]),
    companyId: user.tenantId ?? user.attributes?.tenant_id ?? null,
  }
}
