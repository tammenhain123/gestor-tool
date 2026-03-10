import { Controller, Get, UseGuards, Param, NotFoundException, ForbiddenException } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { UsersService } from './users.service'
import { JwtPayload } from '../auth/jwt.strategy'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    const keycloakId = user.sub
    const username = user.preferred_username ?? null
    const email = user.email ?? null
    const tenantId = user.tenant_id ?? ''

    // Do not create a DB user automatically on simple "me" lookup.
    // Only return existing local user if present.
    const dbUser = await this.usersService.findByAnyId(keycloakId)

    return {
      userId: user.sub,
      username,
      email,
      tenantId,
      db: dbUser ?? null
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const dbUser = await this.usersService.findOne(id)
    if (!dbUser) throw new NotFoundException('User not found')

    // allow if token maps to the same local user
    // If the token `sub` equals the requested local DB id (local auth case), allow
    try {
      if (user && String((user as any).sub) === String(id)) return dbUser
    } catch (e) {}

    const local = await this.usersService.findByAnyId((user as any).sub)
    if (local && local.id === id) return dbUser

    // allow if token has MASTER or ADMIN role
    const uAny: any = user as any
    const hasAdmin =
      (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('ADMIN')) ||
      (Array.isArray(uAny?.roles) && uAny.roles.includes('ADMIN')) ||
      (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
        Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('ADMIN')))
    const hasMaster =
      (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('MASTER')) ||
      (Array.isArray(uAny?.roles) && uAny.roles.includes('MASTER')) ||
      (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
        Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('MASTER')))

    if (hasAdmin || hasMaster) return dbUser

    throw new ForbiddenException('Not allowed')
  }
}
