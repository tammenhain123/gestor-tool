export function extractRolesFromTokenPayload(payload: any): string[] {
  if (!payload) return []
  const roles = new Set<string>()

  // realm_access roles
  const realmRoles = payload?.realm_access?.roles
  if (Array.isArray(realmRoles)) realmRoles.forEach((r: string) => roles.add(r))

  // top-level roles or role
  if (Array.isArray(payload?.roles)) payload.roles.forEach((r: string) => roles.add(r))
  if (typeof payload?.role === 'string') roles.add(payload.role)

  // resource_access: collect roles from all clients
  const resourceAccess = payload?.resource_access
  if (resourceAccess && typeof resourceAccess === 'object') {
    Object.values(resourceAccess).forEach((entry: any) => {
      if (entry && Array.isArray(entry.roles)) entry.roles.forEach((r: string) => roles.add(r))
    })
  }

  return Array.from(roles)
}
