import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Company } from './company.entity'
import { CompanyService } from './company.service'
import { CompanyController } from './company.controller'
import { User } from '../users/user.entity'
import { KeycloakAdminModule } from '../keycloak-admin/keycloak-admin.module'

@Module({
  imports: [TypeOrmModule.forFeature([Company, User]), KeycloakAdminModule],
  providers: [CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
