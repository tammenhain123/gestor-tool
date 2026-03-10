import { Controller, Get, UseGuards, Put, Param } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtPayload } from '../auth/jwt.strategy'
import { UsersService } from '../users/users.service'
import { DiligencesService } from '../diligences/diligences.service'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly diligences: DiligencesService, private readonly usersService: UsersService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    const sub = (user as any)?.sub
    if (!sub) return []

    const actor = await this.usersService.findByAnyId(sub)
    if (!actor) return []

    const digs = await this.diligences.findForUser(actor.id)
    // map diligences to notification-like payload
    return digs.map((d) => ({
      id: d.id,
      message: `Diligência solicitada no projeto ${d.project?.name ?? ''}`,
      read: false,
      link: `/projects/${d.project?.id}`,
      createdAt: d.createdAt,
    }))
  }

  @Put(':id/read')
  async markRead(@Param('id') id: string) {
    // markRead not applicable for diligences; no-op
    return { success: true }
  }
}
