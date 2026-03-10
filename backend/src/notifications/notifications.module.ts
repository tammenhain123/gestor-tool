import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Notification } from './notification.entity'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { UsersModule } from '../users/users.module'
import { DiligencesModule } from '../diligences/diligences.module'

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), UsersModule, forwardRef(() => DiligencesModule)],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
