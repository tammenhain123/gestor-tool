import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, QueryRunner, DataSource } from 'typeorm'
import { Company } from './company.entity'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { User, Role } from '../users/user.entity'
import { KeycloakAdminService } from '../keycloak-admin/keycloak-admin.service'

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly keycloakAdmin: KeycloakAdminService,
  ) {}

  findAll(): Promise<Company[]> {
    return this.repo.find()
  }

  findOne(id: string): Promise<Company | null> {
    return this.repo.findOne({ where: { id } })
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const exists = await this.repo.findOne({ where: { name: dto.name } })
    if (exists) throw new BadRequestException('Company name already exists')
    const c = this.repo.create(dto as any)
    const saved = await this.repo.save(c)
    return (saved as unknown) as Company
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const c = await this.findOne(id)
    if (!c) throw new NotFoundException('Company not found')
    Object.assign(c, dto)
    return this.repo.save(c)
  }

  async remove(id: string): Promise<void> {
    const usersCount = await this.userRepo.count({ where: { company: { id } } as any })
    if (usersCount > 0) throw new BadRequestException('Cannot delete company with users')
    await this.repo.delete(id)
  }

  // create company and admin in a transaction with keycloak
  async createCompanyWithAdmin(dto: CreateCompanyDto & { adminPassword: string; adminEmail: string; adminUsername?: string }) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      const company = queryRunner.manager.create(Company, dto)
      await queryRunner.manager.save(company)

      // create local user
      const localUser = queryRunner.manager.create(User, {
        keycloakId: '',
        username: dto.name + '_admin',
        email: dto.adminEmail,
        tenantId: company.id,
        role: Role.ADMIN,
        company: company,
      })
      const savedUser = await queryRunner.manager.save(localUser)

      // create in keycloak
      const kcUser = await this.keycloakAdmin.createUserInKeycloak({
        username: dto.adminUsername ?? savedUser.username ?? savedUser.email ?? `admin-${company.id}`,
        email: dto.adminEmail,
        password: dto.adminPassword,
        attributes: { tenant_id: company.id },
      })

      // assign realm role
      await this.keycloakAdmin.assignRealmRole(kcUser.id, 'ADMIN')

      // update local user with keycloakId
      savedUser.keycloakId = kcUser.id
      await queryRunner.manager.save(savedUser)

      await queryRunner.commitTransaction()
      return { company, admin: savedUser }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
