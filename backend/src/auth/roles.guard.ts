import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'

function extractRolesFromPayload(payload: any): string[] {
  const roles = new Set<string>()
  if (!payload) return []

  const realm = payload?.realm_access?.roles
  if (Array.isArray(realm)) realm.forEach((r: string) => roles.add(r))

  if (Array.isArray(payload?.roles)) payload.roles.forEach((r: string) => roles.add(r))
  if (typeof payload?.role === 'string') roles.add(payload.role)

  const resourceAccess = payload?.resource_access
  if (resourceAccess && typeof resourceAccess === 'object') {
    Object.values(resourceAccess).forEach((entry: any) => {
      if (entry && Array.isArray(entry.roles)) entry.roles.forEach((r: string) => roles.add(r))
    })
  }

  return Array.from(roles)
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // All routes are public — no role checks.
    return true
  }
}
