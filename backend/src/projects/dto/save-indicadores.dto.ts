import {
  IsOptional,
  IsString,
  IsBoolean,
  IsDate,
  IsNumber,
} from "class-validator";

/**
 * Structure for a single document item
 */
export class DocumentItemDto {
  @IsBoolean()
  @IsOptional()
  isRequested?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDate()
  @IsOptional()
  validationDate?: Date;

  @IsString()
  @IsOptional()
  originalName?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  size?: number;

  @IsString()
  @IsOptional()
  s3Key?: string;
}

/**
 * Structure for a historic section (multiple rows)
 */
export class HistoricoSectionDto {
  rows: DocumentItemDto[] = [];
}

/**
 * Main structure for saving all indicadores de desempenho
 */
export class SaveIndicadoresDto {
  @IsOptional()
  vendasPorCliente?: DocumentItemDto;

  @IsOptional()
  historicoProdução?: HistoricoSectionDto;

  @IsOptional()
  historicoPagamentos?: HistoricoSectionDto;

  @IsOptional()
  historicoVendas?: HistoricoSectionDto;

  @IsOptional()
  paretoVendas?: DocumentItemDto;

  @IsOptional()
  paretoFornecedores?: DocumentItemDto;

  @IsOptional()
  relatorioCusto?: DocumentItemDto;

  @IsOptional()
  relatorioCentroCusto?: DocumentItemDto;
}
