import { IsEmail, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator'
import { Role } from '../user.entity'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsUUID()
  companyId?: string
}
