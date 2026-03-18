import { IsString, IsOptional, IsBoolean, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateFontDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value: string; // valeur CSS font-family

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleFontUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
