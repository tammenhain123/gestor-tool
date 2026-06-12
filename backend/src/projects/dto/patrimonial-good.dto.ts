import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
} from "class-validator";
import { Transform } from "class-transformer";
import { Currency, PatrimonialGoodData } from "../patrimonial-good.entity";

const toOptionalNumber = ({ value }: { value: any }) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

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
  @Transform(toOptionalNumber)
  valorAtual?: number;

  @IsOptional()
  @IsNumber()
  @Transform(toOptionalNumber)
  valorProjetado5anos?: number;

  @IsOptional()
  @IsNumber()
  @Transform(toOptionalNumber)
  valorHistorico5anos?: number;

  @IsOptional()
  @IsNumber()
  @Transform(toOptionalNumber)
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
