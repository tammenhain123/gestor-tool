import { IsString, IsOptional, IsNumber } from "class-validator";
import { Transform } from "class-transformer";
import { BankStatementStatus } from "./bank-entry.entity";

export class CreateBankEntryDto {
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  banco!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  numeroConta?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  agencia?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  ano?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  mes?: string;

  @IsOptional()
  @IsString()
  status?: BankStatementStatus;

  @IsOptional()
  @IsString()
  validationDate?: string;

  @IsOptional()
  @IsString()
  validatorId?: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}

export class UpdateBankEntryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  banco?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  numeroConta?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  agencia?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  ano?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim?.())
  mes?: string;

  @IsOptional()
  @IsString()
  status?: BankStatementStatus;

  @IsOptional()
  @IsString()
  validationDate?: string;

  @IsOptional()
  @IsString()
  validatorId?: string;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}
