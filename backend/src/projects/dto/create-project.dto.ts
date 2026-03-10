import { IsString, IsOptional, IsEnum, IsArray, ArrayUnique, IsUUID } from 'class-validator'
import { ProjectType } from '../project.entity'

export class CreateProjectDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  userIds?: string[]

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  adminIds?: string[]

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  viewerIds?: string[]

  @IsEnum(ProjectType)
  type!: ProjectType

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUUID('4')
  creatorId?: string
}
