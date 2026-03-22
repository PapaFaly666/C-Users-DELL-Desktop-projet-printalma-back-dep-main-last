-- Migration: Add featured payment fields to VendorProduct
-- Date: 2026-03-20

ALTER TABLE "vendor_products"
  ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "featured_rank" INTEGER,
  ADD COLUMN IF NOT EXISTS "featured_until" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "featured_paid_at" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "vendor_products_is_featured_idx" ON "vendor_products"("is_featured");
CREATE INDEX IF NOT EXISTS "vendor_products_featured_rank_idx" ON "vendor_products"("featured_rank");
