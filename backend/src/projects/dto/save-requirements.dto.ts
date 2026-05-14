import { Allow, IsOptional } from "class-validator";

export class SaveRequirementsDto {
  @Allow()
  @IsOptional()
  certidoes?: any[];

  @Allow()
  @IsOptional()
  obrigacoes?: any[];

  @Allow()
  @IsOptional()
  topDocs?: any[];

  @Allow()
  @IsOptional()
  years?: any[];
}
