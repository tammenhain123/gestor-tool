import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, NotFoundException, Query } from '@nestjs/common'
import { Roles } from '../auth/roles.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtPayload } from '../auth/jwt.strategy'
import { User, Role } from './user.entity'

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('MASTER', 'ADMIN')
  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
    // prefer local DB actor if present
    const actor = await this.usersService.findByAnyId((user as any).sub)
    if (actor) {
      if (actor.role === Role.MASTER) return this.usersService.findAll()
      if (actor.role === Role.ADMIN) {
        const tenant = actor.tenantId ?? (actor.company && (actor.company as any).id)
        if (!tenant) return []
        return this.usersService.findAllByTenant(tenant)
      }
      return []
    }

    // fallback to token roles/tenant — only consider token MASTER if no tenant is present
    const uAny = user as any
    const tokenTenant = uAny?.tenant_id ?? uAny?.tenantId ?? null

    const tokenRoles: string[] = []
    if (Array.isArray(uAny?.realm_access?.roles)) tokenRoles.push(...uAny.realm_access.roles)
    if (Array.isArray(uAny?.roles)) tokenRoles.push(...uAny.roles)
    if (typeof uAny?.role === 'string') tokenRoles.push(uAny.role)
    const upper = tokenRoles.map((r) => String(r).toUpperCase())

    // If caller provided tenantId as query, allow when MASTER or when ADMIN and tokenTenant matches
    if (tenantId) {
      if (upper.includes('MASTER')) return this.usersService.findAllByTenant(tenantId)
      if (upper.includes('ADMIN') && tokenTenant && tokenTenant === tenantId) return this.usersService.findAllByTenant(tenantId)
      return []
    }

    const tokenIsMaster = upper.includes('MASTER') && !tokenTenant
    if (tokenIsMaster) return this.usersService.findAll()

    if (!tokenTenant) return []
    return this.usersService.findAllByTenant(tokenTenant)
  }

  @Roles('MASTER', 'ADMIN')
  @Get('active')
  async activeSummary(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
    // prefer local DB actor if present
    const actor = await this.usersService.findByAnyId((user as any).sub)
    const WINDOW_MINUTES = 30
    if (actor) {
      if (actor.role === Role.MASTER) return this.usersService.countActiveUsers(tenantId ?? null, WINDOW_MINUTES)
      if (actor.role === Role.ADMIN) {
        const tenant = actor.tenantId ?? (actor.company && (actor.company as any).id)
        if (!tenant) return { total: 0, active: 0 }
        return this.usersService.countActiveUsers(tenant, WINDOW_MINUTES)
      }
      return { total: 0, active: 0 }
    }

    // fallback to token roles/tenant
    const uAny = user as any
    const tokenTenant = uAny?.tenant_id ?? uAny?.tenantId ?? null

    const tokenRoles: string[] = []
    if (Array.isArray(uAny?.realm_access?.roles)) tokenRoles.push(...uAny.realm_access.roles)
    if (Array.isArray(uAny?.roles)) tokenRoles.push(...uAny.roles)
    if (typeof uAny?.role === 'string') tokenRoles.push(uAny.role)
    const upper = tokenRoles.map((r) => String(r).toUpperCase())

    if (tenantId) {
      if (upper.includes('MASTER')) return this.usersService.countActiveUsers(tenantId, WINDOW_MINUTES)
      if (upper.includes('ADMIN') && tokenTenant && tokenTenant === tenantId) return this.usersService.countActiveUsers(tenantId, WINDOW_MINUTES)
      return { total: 0, active: 0 }
    }

    const tokenIsMaster = upper.includes('MASTER') && !tokenTenant
    if (tokenIsMaster) return this.usersService.countActiveUsers(null, WINDOW_MINUTES)
    if (!tokenTenant) return { total: 0, active: 0 }
    return this.usersService.countActiveUsers(tokenTenant, WINDOW_MINUTES)
  }

  @Roles('MASTER', 'ADMIN')
  @Get('leaderboard')
  async leaderboard(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
    @Query('days') daysStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const days = daysStr ? parseInt(daysStr, 10) : 7
    const limit = limitStr ? parseInt(limitStr, 10) : 10

    const actor = await this.usersService.findByAnyId((user as any).sub)
    if (actor) {
      if (actor.role === Role.MASTER) return this.usersService.leaderboard(days, tenantId ?? null, limit)
      if (actor.role === Role.ADMIN) {
        const tenant = actor.tenantId ?? (actor.company && (actor.company as any).id)
        if (!tenant) return []
        return this.usersService.leaderboard(days, tenant, limit)
      }
      return []
    }

    const uAny = user as any
    const tokenTenant = uAny?.tenant_id ?? uAny?.tenantId ?? null

    const tokenRoles: string[] = []
    if (Array.isArray(uAny?.realm_access?.roles)) tokenRoles.push(...uAny.realm_access.roles)
    if (Array.isArray(uAny?.roles)) tokenRoles.push(...uAny.roles)
    if (typeof uAny?.role === 'string') tokenRoles.push(uAny.role)
    const upper = tokenRoles.map((r) => String(r).toUpperCase())

    if (tenantId) {
      if (upper.includes('MASTER')) return this.usersService.leaderboard(days, tenantId, limit)
      if (upper.includes('ADMIN') && tokenTenant && tokenTenant === tenantId) return this.usersService.leaderboard(days, tenantId, limit)
      return []
    }

    const tokenIsMaster = upper.includes('MASTER') && !tokenTenant
    if (tokenIsMaster) return this.usersService.leaderboard(days, null, limit)
    if (!tokenTenant) return []
    return this.usersService.leaderboard(days, tokenTenant, limit)
  }

  @Roles('MASTER', 'ADMIN')
  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    // require existing local user; for backward compatibility construct a temporary actor
    let actor = await this.usersService.findByAnyId((user as any).sub)
    if (!actor) {
      const uAny = user as any
      const hasMaster =
        (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('MASTER')) ||
        (Array.isArray(uAny?.roles) && uAny.roles.includes('MASTER')) ||
        (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
          Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('MASTER')))
      const hasAdmin =
        (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('ADMIN')) ||
        (Array.isArray(uAny?.roles) && uAny.roles.includes('ADMIN')) ||
        (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
          Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('ADMIN')))

      if (!hasMaster && !hasAdmin) throw new NotFoundException('Local user not found for current principal')

      actor = {
        id: null as any,
        keycloakId: user.sub,
        username: uAny?.preferred_username ?? uAny?.username ?? null,
        email: uAny?.email ?? null,
        tenantId: uAny?.tenant_id ?? uAny?.tenantId ?? null,
        role: hasMaster ? Role.MASTER : Role.ADMIN,
      } as unknown as User
    }
    return this.usersService.createUser(dto, actor as unknown as User)
  }

  @Roles('MASTER', 'ADMIN')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    let actor = await this.usersService.findByAnyId((user as any).sub)
    if (!actor) {
      const uAny = user as any
      const hasMaster =
        (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('MASTER')) ||
        (Array.isArray(uAny?.roles) && uAny.roles.includes('MASTER')) ||
        (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
          Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('MASTER')))
      const hasAdmin =
        (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('ADMIN')) ||
        (Array.isArray(uAny?.roles) && uAny.roles.includes('ADMIN')) ||
        (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
          Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('ADMIN')))

      if (!hasMaster && !hasAdmin) throw new NotFoundException('Local user not found for current principal')

      actor = {
        id: null as any,
        keycloakId: user.sub,
        username: uAny?.preferred_username ?? uAny?.username ?? null,
        email: uAny?.email ?? null,
        tenantId: uAny?.tenant_id ?? uAny?.tenantId ?? null,
        role: hasMaster ? Role.MASTER : Role.ADMIN,
      } as unknown as User
    }
    return this.usersService.updateUser(id, dto, actor as unknown as User)
  }

  @Roles('MASTER', 'ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    let actor = await this.usersService.findByAnyId((user as any).sub)
    if (!actor) {
      const uAny = user as any
      const hasMaster =
        (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('MASTER')) ||
        (Array.isArray(uAny?.roles) && uAny.roles.includes('MASTER')) ||
        (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
          Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('MASTER')))
      const hasAdmin =
        (Array.isArray(uAny?.realm_access?.roles) && uAny.realm_access.roles.includes('ADMIN')) ||
        (Array.isArray(uAny?.roles) && uAny.roles.includes('ADMIN')) ||
        (uAny?.resource_access && typeof uAny.resource_access === 'object' &&
          Object.values(uAny.resource_access).some((entry: any) => Array.isArray(entry.roles) && entry.roles.includes('ADMIN')))

      if (!hasMaster && !hasAdmin) throw new NotFoundException('Local user not found for current principal')

      actor = {
        id: null as any,
        keycloakId: user.sub,
        username: uAny?.preferred_username ?? uAny?.username ?? null,
        email: uAny?.email ?? null,
        tenantId: uAny?.tenant_id ?? uAny?.tenantId ?? null,
        role: hasMaster ? Role.MASTER : Role.ADMIN,
      } as unknown as User
    }
    await this.usersService.removeUser(id, actor as unknown as User)
    return { ok: true }
  }
}
