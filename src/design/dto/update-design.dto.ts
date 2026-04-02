import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateDesignDto {
  @ApiProperty({
    description: 'Nom du design',
    example: 'Logo moderne entreprise',
    minLength: 3,
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le nom doit contenir au moins 3 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({
    description: 'Description du design',
    example: 'Un logo épuré et moderne pour entreprises tech',
    required: false,
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(1000, { message: 'La description ne peut pas dépasser 1000 caractères' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    description: 'Prix en FCFA (0 pour gratuit, vide = 0 par défaut)',
    example: 2500,
    minimum: 0,
    maximum: 1000000,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  @Min(0, { message: 'Le prix ne peut pas être négatif' })
  @Max(1000000, { message: 'Le prix maximum est de 1,000,000 FCFA' })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    if (typeof value === 'string') {
      const numeric = value.replace(/[^0-9.-]/g, '');
      return Number(numeric) || 0;
    }
    return value;
  })
  price?: number;

  @ApiProperty({
    description: 'ID de la nouvelle catégorie du design',
    example: 2,
    type: 'number',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID de la catégorie doit être un nombre entier' })
  @Min(1, { message: 'L\'ID de la catégorie doit être supérieur à 0' })
  categoryId?: number;

  @ApiProperty({
    description: 'Tags optionnels (JSON stringified array)',
    example: '["moderne","entreprise","tech"]',
    required: false
  })
  @IsOptional()
  @IsString()
  tags?: string;
} 