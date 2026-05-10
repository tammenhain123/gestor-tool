import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
} from "class-validator";
import { Currency, PatrimonialGoodData } from "../patrimonial-good.entity";

export class CreatePatrimonialGoodDto implements Partial<PatrimonialGoodData> {
  @IsString()
  presentacaoFisica!: string;

  @IsOptional()
  @IsString()
  presentacaoHistorica?: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsOptional()
  @IsNumber()
  valorAtual?: number;

  @IsOptional()
  @IsNumber()
  valorProjetado5anos?: number;

  @IsOptional()
  @IsNumber()
  valorHistorico5anos?: number;

  @IsOptional()
  @IsNumber()
  valorNaCompra?: number;

  @IsOptional()
  @IsString()
  dataCompra?: string;

  @IsOptional()
  @IsString()
  dataUltimaAvaliacao?: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsObject()
  ocupante?: {
    cpfCnpj: string;
    telefone?: string;
  };

  @IsOptional()
  @IsObject()
  attachments?: {
    apresentacaoBem?: string;
    matricula?: string;
    itr?: string;
    car?: string;
    topografia?: string;
  };
}

export class UpdatePatrimonialGoodDto extends CreatePatrimonialGoodDto {}
