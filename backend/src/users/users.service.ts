import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThanOrEqual } from 'typeorm'
import { User, Role } from './user.entity'
import { DataSource } from 'typeorm'
import { KeycloakAdminService } from '../keycloak-admin/keycloak-admin.service'
import { Company } from '../company/company.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    return await this.repo.findOne({ where: { keycloakId }, relations: ['company'] })
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repo.findOne({ where: { username }, relations: ['company'] })
  }

  async findAll(): Promise<User[]> {
    return this.repo.find({ relations: ['company'] })
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return this.repo.find({ where: { tenantId }, relations: ['company'] })
  }

  async findOne(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: ['company'] })
  }

  async findByAnyId(sub: any): Promise<User | null> {
    if (!sub) return null
    // try local DB id first (uuid-like)
    try {
      if (typeof sub === 'string' && sub.includes('-')) {
        const byId = await this.findOne(sub)
        if (byId) return byId
      }
    } catch (e) {
      // ignore
    }
    // fallback to keycloak id
    try {
      return await this.findByKeycloakId(String(sub))
    } catch (e) {
      return null
    }
  }
async createUser(dto: CreateUserDto, creator: User): Promise<User> {
  let tenantId: string | undefined = undefined
  let company: Company | null = null

  if (creator.role === Role.ADMIN) {
    if (!creator.tenantId) throw new BadRequestException('Creator missing tenant')
    tenantId = creator.tenantId
    company = await this.companyRepo.findOne({ where: { id: tenantId } })
  } else {
    if (dto.companyId) {
      company = await this.companyRepo.findOne({ where: { id: dto.companyId } })
      if (!company) throw new BadRequestException('Company not found')
      tenantId = company.id
    }
  }

  if (dto.role === Role.MASTER && creator.role !== Role.MASTER) {
    throw new BadRequestException('Only MASTER can assign MASTER role')
  }

  const user = this.repo.create({
    username: dto.username,
    email: dto.email,
    tenantId: tenantId ?? null,
    role: dto.role ?? Role.USER,
    company: company ?? null,
  })

  return await this.repo.save(user)
}

  async updateUser(id: string, dto: UpdateUserDto, actor: User): Promise<User> {
    const user = await this.findOne(id)
    if (!user) throw new NotFoundException('User not found')

    if (actor.role === Role.ADMIN) {
      if (!actor.tenantId || user.tenantId !== actor.tenantId) throw new BadRequestException('Cannot modify users from other tenant')
      if (user.role === Role.MASTER) throw new BadRequestException('Cannot modify MASTER user')
      if (dto.role === Role.MASTER) throw new BadRequestException('Cannot assign MASTER role')
    }

    if (dto.companyId) {
      const c = await this.companyRepo.findOne({ where: { id: dto.companyId } })
      if (!c) throw new BadRequestException('Company not found')
      user.company = c
      user.tenantId = c.id
    }

    if (dto.username !== undefined) user.username = dto.username
    if (dto.email !== undefined) user.email = dto.email
    if (dto.role !== undefined && dto.role !== user.role) {
      // update role mapping in keycloak
      if (!user.keycloakId) throw new BadRequestException('User not linked to keycloak')
      // remove previous role
      try {
        await this.keycloakAdmin.removeRealmRole(user.keycloakId, user.role)
      } catch (e) {
        // ignore remove errors and attempt assign
      }
      await this.keycloakAdmin.assignRealmRole(user.keycloakId, dto.role)
      user.role = dto.role
    }

    return this.repo.save(user)
  }

  async removeUser(id: string, actor: User): Promise<void> {
    const user = await this.findOne(id)
    if (!user) throw new NotFoundException('User not found')
    if (user.role === Role.MASTER) throw new BadRequestException('Cannot delete MASTER user')
    if (actor.role === Role.ADMIN) {
      if (!actor.tenantId || user.tenantId !== actor.tenantId) throw new BadRequestException('Cannot delete users from other tenant')
    }

    // delete in keycloak if present
    if (user.keycloakId) {
      try {
        await this.keycloakAdmin.deleteUser(user.keycloakId)
      } catch (e) {
        // ignore keycloak delete errors for now
      }
    }

    await this.repo.delete(id)
  }

  async createIfNotExists(keycloakId: string, username: string | null, email: string | null, tenantId: string): Promise<User> {
    const existing = await this.findByKeycloakId(keycloakId)
    if (existing) return existing
    const user = this.repo.create({ keycloakId, username: username ?? null, email: email ?? null, tenantId })
    return await this.repo.save(user)
  }

  async updateLastSeen(sub: any): Promise<void> {
    if (!sub) return
    try {
      // if looks like uuid (local db id) update by id
      if (typeof sub === 'string' && sub.includes('-')) {
        await this.repo.update({ id: sub }, { lastSeen: new Date() })
        return
      }
    } catch (e) {
      // ignore
    }
    try {
      await this.repo.update({ keycloakId: String(sub) }, { lastSeen: new Date() })
    } catch (e) {
      // ignore
    }
  }

  async countActiveUsers(tenantId?: string | null, windowMinutes = 30): Promise<{ total: number; active: number }> {
    const cutoff = new Date(Date.now() - windowMinutes * 60000)
    const whereActive: any = { lastSeen: MoreThanOrEqual(cutoff) }
    const whereTotal: any = {}
    if (tenantId) {
      whereActive.tenantId = tenantId
      whereTotal.tenantId = tenantId
    }
    const active = await this.repo.count({ where: whereActive })
    const total = await this.repo.count({ where: whereTotal })
    return { total, active }
  }

  async leaderboard(windowDays = 7, tenantId?: string | null, limit = 10): Promise<Array<{ userId: string; username: string | null; email: string | null; companyId?: string | null; companyName?: string | null; score: number }>> {
    const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
    const cutoffIso = cutoff.toISOString()

    let tenantFilter = ''
    const params: any[] = [cutoffIso, limit]
    if (tenantId) {
      tenantFilter = `AND u."tenantId" = $3`
      params.push(tenantId)
    }

    const sql = `
      SELECT a."userId" as "userId", u.username, u.email, u."tenantId" as "companyId", c.name as "companyName", COUNT(*) as score
      FROM audit_logs a
      LEFT JOIN users u ON (u."keycloakId" = a."userId" OR u.id::text = a."userId")
      LEFT JOIN companies c ON c.id = u."tenantId"
      WHERE a."createdAt" >= $1
      ${tenantFilter}
      GROUP BY a."userId", u.username, u.email, u."tenantId", c.name
      ORDER BY score DESC
      LIMIT $2
    `

    const raw = await this.dataSource.query(sql, params)
    return raw.map((r: any) => ({
      userId: r.userId,
      username: r.username,
      email: r.email,
      companyId: r.companyId,
      companyName: r.companyName,
      score: Number(r.score)
    }))
  }
}
