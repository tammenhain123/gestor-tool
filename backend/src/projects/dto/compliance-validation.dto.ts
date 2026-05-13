import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsUUID,
} from "class-validator";
import { Type, Expose } from "class-transformer";
import {
  ComplianceDocumentStatus,
  OrganogramDocument,
  ReportItem,
} from "../compliance-validation.entity";

export class CreateOrganogramDto {
  @Expose()
  @IsOptional()
  @IsString()
  id?: string;

  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  type?: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @Expose()
  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @Expose()
  @IsOptional()
  @IsString()
  validationDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  validator?: string;

  @Expose()
  @IsOptional()
  @IsString()
  s3Key?: string;

  @Expose()
  @IsOptional()
  @IsString()
  originalName?: string;

  @Expose()
  @IsOptional()
  isRequested?: boolean;
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
  @Expose()
  @IsOptional()
  @IsString()
  id?: string;

  @Expose()
  @IsString()
  type!: string; // 'relatorio-endividamento' | 'relatorio-scr' | etc

  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string;

  @Expose()
  @IsOptional()
  @IsEnum(ComplianceDocumentStatus)
  status?: ComplianceDocumentStatus;

  @Expose()
  @IsOptional()
  @IsString()
  validationDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  validator?: string;

  @Expose()
  @IsOptional()
  @IsString()
  s3Key?: string;

  @Expose()
  @IsOptional()
  @IsString()
  originalName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @Expose()
  @IsOptional()
  size?: number;

  @Expose()
  @IsOptional()
  @IsString()
  uploadedBy?: string;

  @Expose()
  @IsOptional()
  @IsString()
  uploadDate?: string;

  @Expose()
  @IsOptional()
  isRequested?: boolean;
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
