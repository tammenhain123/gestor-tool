import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { Project } from "./project.entity";
import { Qualification } from "./qualification.entity";
import { ProjectFile } from "./file.entity";
import { Capacity } from "./capacity.entity";
import { Strategy } from "./strategy.entity";
import { BankEntry } from "./bank-entry.entity";
import { Asset } from "./asset.entity";
import { FinancialDoc } from "./financial-doc.entity";
import { Indicator } from "./indicator.entity";
import { Requirement } from "./requirement.entity";
import { ComplianceValidation } from "./compliance-validation.entity";
import { PatrimonialGood } from "./patrimonial-good.entity";
import { User } from "../users/user.entity";
import { Company } from "../company/company.entity";
import { UsersModule } from "../users/users.module";
import { S3Module } from "../s3/s3.module";
import { ProjectFilesController } from "./files.controller";
import { ProjectFilesService } from "./files.service";
import { ComplianceValidationService } from "./compliance-validation.service";
import { ComplianceValidationController } from "./compliance-validation.controller";
import { PatrimonialGoodService } from "./patrimonial-good.service";
import { PatrimonialGoodController } from "./patrimonial-good.controller";
import { BankEntryService } from "./bank-entry.service";
import { BankEntryController } from "./bank-entry.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      User,
      Company,
      Qualification,
      ProjectFile,
      BankEntry,
      Asset,
      FinancialDoc,
      Capacity,
      Strategy,
      Indicator,
      Requirement,
      ComplianceValidation,
      PatrimonialGood,
    ]),
    UsersModule,
    S3Module,
  ],
  providers: [
    ProjectsService,
    ProjectFilesService,
    ComplianceValidationService,
    PatrimonialGoodService,
    BankEntryService,
  ],
  controllers: [
    ProjectsController,
    ProjectFilesController,
    ComplianceValidationController,
    PatrimonialGoodController,
    BankEntryController,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
