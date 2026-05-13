import { IsString, IsOptional, IsNumber } from "class-validator";
import { Transform, Expose } from "class-transformer";
import { BankStatementStatus } from "./bank-entry.entity";

export class CreateBankEntryDto {
  @Expose()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  banco!: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  numeroConta?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  agencia?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  ano?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  mes?: string;

  @Expose()
  @IsOptional()
  @IsString()
  status?: BankStatementStatus;

  @Expose()
  @IsOptional()
  @IsString()
  validationDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  validatorId?: string;

  @Expose()
  @IsOptional()
  @IsString()
  validatorName?: string;

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
  @IsNumber()
  size?: number;
}

export class UpdateBankEntryDto {
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  banco?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  numeroConta?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  agencia?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  ano?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  mes?: string;

  @Expose()
  @IsOptional()
  @IsString()
  status?: BankStatementStatus;

  @Expose()
  @IsOptional()
  @IsString()
  validationDate?: string;

  @Expose()
  @IsOptional()
  @IsString()
  validatorId?: string;

  @Expose()
  @IsOptional()
  @IsString()
  validatorName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  originalName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}
