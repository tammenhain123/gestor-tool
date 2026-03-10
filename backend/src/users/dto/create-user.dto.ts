import { IsEmail, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator'
import { Role } from '../user.entity'

export class CreateUserDto {
  @IsString()
  username!: string

  @IsEmail()
  email!: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @IsOptional()
  @IsUUID()
  companyId?: string
}
