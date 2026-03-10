import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectsService } from './projects.service'
import { ProjectsController } from './projects.controller'
import { Project } from './project.entity'
import { Qualification } from './qualification.entity'
import { ProjectFile } from './file.entity'
import { Capacity } from './capacity.entity'
import { BankEntry } from './bank-entry.entity'
import { Asset } from './asset.entity'
import { FinancialDoc } from './financial-doc.entity'
import { User } from '../users/user.entity'
import { Company } from '../company/company.entity'
import { UsersModule } from '../users/users.module'
import { S3Module } from '../s3/s3.module'
import { ProjectFilesController } from './files.controller'
import { ProjectFilesService } from './files.service'

@Module({
  imports: [TypeOrmModule.forFeature([Project, User, Company, Qualification, ProjectFile, BankEntry, Asset, FinancialDoc, Capacity]), UsersModule, S3Module],
  providers: [ProjectsService, ProjectFilesService],
  controllers: [ProjectsController, ProjectFilesController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
