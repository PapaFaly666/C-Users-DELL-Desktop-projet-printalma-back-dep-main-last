-- Migration: Add material fields to Product table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "material_name" VARCHAR(255);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "material_description" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "material_images" JSONB DEFAULT '[]';
