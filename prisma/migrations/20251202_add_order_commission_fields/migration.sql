-- AlterTable (safe - colonnes déjà incluses dans 20251214212855_add_design_revenue_system)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "commission_rate" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "commission_amount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "vendor_amount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "commission_applied_at" TIMESTAMP(3);
  END IF;
END $$;
