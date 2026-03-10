import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Diligence } from './diligence.entity'
import { DiligencesService } from './diligences.service'
import { DiligencesController } from './diligences.controller'
import { ProjectsModule } from '../projects/projects.module'
import { UsersModule } from '../users/users.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([Diligence]), ProjectsModule, UsersModule, forwardRef(() => NotificationsModule)],
  providers: [DiligencesService],
  controllers: [DiligencesController],
  exports: [DiligencesService],
})
export class DiligencesModule {}
