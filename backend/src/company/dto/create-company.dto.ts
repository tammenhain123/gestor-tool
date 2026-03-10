import { IsString, IsOptional, Length } from 'class-validator'

export class CreateCompanyDto {
  @IsString()
  @Length(2, 255)
  name!: string

  // accepts either a URL or a base64 data URI
  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsString()
  primaryColor?: string

  @IsOptional()
  @IsString()
  secondaryColor?: string
}
