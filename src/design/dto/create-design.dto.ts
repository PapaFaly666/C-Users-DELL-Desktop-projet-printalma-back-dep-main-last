import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateDesignDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Fichier image du design (PNG, JPG, JPEG, SVG)',
    example: 'logo.png',
    required: true
  })
  file: any;

  @ApiProperty({
    description: 'Nom du design',
    example: 'Logo moderne entreprise',
    minLength: 3,
    maxLength: 255,
    type: 'string'
  })
  @IsNotEmpty({ message: 'Le nom du design est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le nom doit contenir au moins 3 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Description du design',
    example: 'Un logo épuré et moderne pour entreprises tech',
    required: false,
    maxLength: 1000,
    type: 'string'
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
    type: 'number',
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
    description: 'ID de la catégorie du design (créée par l\'admin)',
    example: 1,
    type: 'number'
  })
  @IsNotEmpty({ message: 'La catégorie est requise' })
  @Type(() => Number)
  @IsInt({ message: 'L\'ID de la catégorie doit être un nombre entier' })
  @Min(1, { message: 'L\'ID de la catégorie doit être supérieur à 0' })
  categoryId: number;

  @ApiProperty({
    description: 'Tags optionnels (JSON stringified array depuis FormData)',
    example: '["moderne","entreprise","tech"]',
    required: false,
    type: 'string'
  })
  @IsOptional()
  @IsString()
  tags?: string;
} 