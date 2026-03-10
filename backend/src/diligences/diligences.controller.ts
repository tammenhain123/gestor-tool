import { Controller, Post, UseGuards, Body, Get } from '@nestjs/common'
import { DiligencesService } from './diligences.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt.strategy'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CreateDiligenceDto } from './dto/create-diligence.dto'
import { UsersService } from '../users/users.service'

@Controller('diligences')
@UseGuards(JwtAuthGuard)
export class DiligencesController {
  constructor(private readonly diligences: DiligencesService, private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateDiligenceDto, @CurrentUser() user: JwtPayload) {
    // pass through sub (can be local DB id or keycloak id); service will resolve
    return this.diligences.create(dto, user.sub)
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const actor = await this.usersService.findByAnyId((user as any).sub)
    if (!actor) return []
    return this.diligences.findForUser(actor.id)
  }
}
