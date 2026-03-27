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
  // adminIds and viewerIds removed — project creation no longer assigns these

  @IsEnum(ProjectType)
  type!: ProjectType

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUUID('4')
  creatorId?: string
}
