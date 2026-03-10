import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator'

export class UpdateCompanyDto {
	@IsOptional()
	@IsString()
	@Length(2, 255)
	name?: string

	@IsOptional()
	@IsString()
	// allow either a remote URL (http/https) or a base64 data URI (data:image/...) so frontend can send images inline
	@Matches(/^(data:image\/[a-zA-Z]+;base64,.+|https?:\/\/[^\s]+)$/)
	logoUrl?: string

	@IsOptional()
	@IsString()
	primaryColor?: string

	@IsOptional()
	@IsString()
	secondaryColor?: string
}
