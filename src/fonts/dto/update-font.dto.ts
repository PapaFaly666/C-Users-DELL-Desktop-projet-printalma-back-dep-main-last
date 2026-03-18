import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateFontDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleFontUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
