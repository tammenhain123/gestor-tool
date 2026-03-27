import { IsString, IsOptional, IsEnum, IsArray, ArrayUnique, IsUUID } from 'class-validator'
import { ProjectType } from '../project.entity'

export class UpdateProjectDto {
	@IsOptional()
	@IsString()
	name?: string

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsUUID('4', { each: true })
	userIds?: string[]

	@IsOptional()
	@IsString()
	imageUrl?: string
	// adminIds and viewerIds removed — not used any more

	@IsOptional()
	@IsEnum(ProjectType)
	type?: ProjectType

	@IsOptional()
	@IsString()
	description?: string
}
