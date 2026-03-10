import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { User } from './user.entity'
import { Company } from '../company/company.entity'
import { KeycloakAdminModule } from '../keycloak-admin/keycloak-admin.module'
import { AdminUsersController } from './admin-users.controller'

@Module({
  imports: [TypeOrmModule.forFeature([User, Company]), KeycloakAdminModule],
  providers: [UsersService],
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService]
})
export class UsersModule {}
