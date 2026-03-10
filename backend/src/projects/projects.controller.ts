import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, NotFoundException, Query, Logger, InternalServerErrorException } from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { UsersService } from '../users/users.service'
import { User, Role } from '../users/user.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtPayload } from '../auth/jwt.strategy'

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name)
  constructor(private readonly projectsService: ProjectsService, private readonly usersService: UsersService) {}

  private async resolveActor(sub: any) {
    if (!sub) return null
    return await this.usersService.findByAnyId(sub)
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload, @Query('tenantId') tenantId?: string) {
    const uAny: any = user as any

    // try local actor first (match by keycloakId or local DB id)
    const actor = await this.resolveActor((user as any)?.sub)
    if (actor) {
      if (actor.role === Role.MASTER) return this.projectsService.findAll()
      if (actor.role === Role.ADMIN) {
        const tenant = actor.tenantId ?? (actor.company && (actor.company as any).id)
        if (!tenant) return []
        return this.projectsService.findAllByCompany(tenant)
      }
      // USER
      return this.projectsService.findAllForMember(actor.id)
    }

    // fallback to token roles/tenant or explicit tenantId
    const tokenRoles: string[] = []
    if (Array.isArray(uAny?.realm_access?.roles)) tokenRoles.push(...uAny.realm_access.roles)
    if (Array.isArray(uAny?.roles)) tokenRoles.push(...uAny.roles)
    if (typeof uAny?.role === 'string') tokenRoles.push(uAny.role)
    const upper = tokenRoles.map((r) => String(r).toUpperCase())

    // if caller provided tenantId, validate token/actor and return projects for that tenant
    if (tenantId) {
      if (upper.includes('MASTER')) return this.projectsService.findAllByCompany(tenantId)
      // allow ADMIN only if token tenant matches provided
      const tokenTenant = uAny?.tenant_id ?? uAny?.tenantId ?? null
      if (upper.includes('ADMIN') && tokenTenant && tokenTenant === tenantId) return this.projectsService.findAllByCompany(tenantId)
      return []
    }

    if (upper.includes('MASTER')) return this.projectsService.findAll()
    if (upper.includes('ADMIN')) {
      const tenant = uAny?.tenant_id ?? uAny?.tenantId ?? null
      if (!tenant) return []
      return this.projectsService.findAllByCompany(tenant)
    }

    return []
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const p = await this.projectsService.findOne(id)
    if (!p) throw new NotFoundException('Project not found')
    return p
  }

  @Get(':id/qualification')
  async getQualification(@Param('id') id: string) {
    const q = await this.projectsService.getQualification(id)
    if (!q) return null
    return q.data ?? null
  }

  @Get(':id/capacity')
  async getCapacity(@Param('id') id: string) {
    try {
      const c = await this.projectsService.getCapacity(id)
      if (!c) return null
      return c
    } catch (e) {
      this.logger.error(`getCapacity failed for project=${id}: ${e}`)
      throw new InternalServerErrorException('Failed to load capacity data')
    }
  }

  @Roles('ADMIN')
  @Post()
  async create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    // if frontend provided creatorId, prefer that
    if ((dto as any).creatorId) {
      const creator = await this.usersService.findOne((dto as any).creatorId)
      if (!creator) throw new NotFoundException('Creator not found')
      return this.projectsService.create(dto, creator as any)
    }

    // require existing local user; when missing, construct a temporary actor if token has ADMIN/MASTER
    let actor = await this.resolveActor((user as any)?.sub)
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
    return this.projectsService.create(dto, actor as any)
  }

  @Roles('ADMIN')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: JwtPayload) {
    let actor = await this.resolveActor((user as any)?.sub)
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
    return this.projectsService.update(id, dto, actor as any)
  }

  @Put(':id/qualification')
  async saveQualification(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: JwtPayload) {
    let actor = await this.resolveActor((user as any)?.sub)
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

    return this.projectsService.saveQualification(id, dto, actor as any)
  }

  @Put(':id/capacity')
  async saveCapacity(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: JwtPayload) {
    let actor = await this.resolveActor((user as any)?.sub)
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

    try {
      return await this.projectsService.saveCapacity(id, dto, actor as any)
    } catch (e) {
      this.logger.error(`saveCapacity failed for project=${id}: ${e}`)
      throw new InternalServerErrorException('Failed to save capacity data')
    }
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    let actor = await this.resolveActor((user as any)?.sub)
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
    await this.projectsService.remove(id)
    return { ok: true }
  }
}
