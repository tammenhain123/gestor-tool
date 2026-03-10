import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, BadRequestException } from '@nestjs/common'
import { CompanyService } from './company.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@UseGuards(RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly svc: CompanyService) {}

  // MASTER only
  @Roles('MASTER')
  @Get()
  findAll() {
    return this.svc.findAll()
  }

  @Roles('MASTER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id)
  }

  @Roles('MASTER')
  @Post()
  async create(@Body() dto: CreateCompanyDto) {
    return this.svc.create(dto)
  }

  @Roles('MASTER')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.svc.update(id, dto)
  }

  @Roles('MASTER')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.svc.remove(id)
      return { success: true }
    } catch (err) {
      const message = (err as any)?.message ?? String(err)
      throw new BadRequestException(message)
    }
  }
}

/**
 * Front-end flow (comments):
 * MASTER: /admin/companies -> list companies, create company, create admin
 * ADMIN: /dashboard -> sees data for own company
 */
