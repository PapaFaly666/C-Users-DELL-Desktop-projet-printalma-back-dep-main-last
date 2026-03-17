-- CreateEnum (safe)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DesignUsagePaymentStatus') THEN
    CREATE TYPE "DesignUsagePaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY_FOR_PAYOUT', 'PAID', 'CANCELLED');
  END IF;
END $$;

-- CreateTable (safe - skipped if already exists from 20251214)
CREATE TABLE IF NOT EXISTS "design_usages" (
    "id" SERIAL NOT NULL,
    "design_id" INTEGER NOT NULL,
    "design_name" VARCHAR(255) NOT NULL,
    "design_price" DECIMAL(10,2) NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255),
    "product_id" INTEGER NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    "vendor_revenue" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "payment_status" "DesignUsagePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "ready_for_payout_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "customization_id" INTEGER,
    "view_key" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (safe)
CREATE INDEX IF NOT EXISTS "idx_vendor_payment_status" ON "design_usages"("vendor_id", "payment_status");
CREATE INDEX IF NOT EXISTS "idx_order_id" ON "design_usages"("order_id");
CREATE INDEX IF NOT EXISTS "idx_design_id" ON "design_usages"("design_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_design_order_item" ON "design_usages"("design_id", "order_item_id");

-- AddForeignKey (safe) - noms de tables avec majuscules
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_usages_design_id_fkey') THEN
    ALTER TABLE "design_usages" ADD CONSTRAINT "design_usages_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_usages_vendor_id_fkey') THEN
    ALTER TABLE "design_usages" ADD CONSTRAINT "design_usages_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_usages_order_id_fkey') THEN
    ALTER TABLE "design_usages" ADD CONSTRAINT "design_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'design_usages_order_item_id_fkey') THEN
    ALTER TABLE "design_usages" ADD CONSTRAINT "design_usages_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
