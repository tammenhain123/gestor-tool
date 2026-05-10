import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import {
  ComplianceDocumentStatus,
  OrganogramDocument,
  ReportItem,
} from "../compliance-validation.entity";

export class CreateOrganogramDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @IsOptional()
  @IsString()
  s3Key?: string;

  @IsOptional()
  @IsString()
  originalName?: string;
}

export class UpdateComplianceDocumentDto {
  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @IsOptional()
  @IsString()
  validationDate?: string;

  @IsOptional()
  @IsString()
  validator?: string;
}

export class CreateReportDto {
  @IsString()
  type!: string; // 'relatorio-endividamento' | 'relatorio-scr' | etc

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @IsOptional()
  @IsString()
  s3Key?: string;

  @IsOptional()
  @IsString()
  originalName?: string;
}

export class SaveComplianceValidationDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrganogramDto)
  organograms?: CreateOrganogramDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportDto)
  reports?: CreateReportDto[];
}
