-- CreateEnum (safe)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PhoneNumberStatus') THEN
    CREATE TYPE "PhoneNumberStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
  END IF;
END $$;

-- CreateTable (safe)
CREATE TABLE IF NOT EXISTS "vendor_phone_numbers" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "country_code" VARCHAR(5) NOT NULL DEFAULT '+221',
    "phone_number" VARCHAR(20) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "status" "PhoneNumberStatus" NOT NULL DEFAULT 'PENDING',
    "security_hold_until" TIMESTAMP(3),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_for_withdrawal" TIMESTAMP(3),

    CONSTRAINT "vendor_phone_numbers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "phone_otp_codes" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "phone_otp_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "security_logs" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "phone_number" VARCHAR(20),
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (safe)
CREATE INDEX IF NOT EXISTS "idx_vendor_phone_vendor" ON "vendor_phone_numbers"("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_vendor_phone_status" ON "vendor_phone_numbers"("status");
CREATE INDEX IF NOT EXISTS "idx_vendor_phone_primary" ON "vendor_phone_numbers"("vendor_id", "is_primary");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_vendor_phone_number" ON "vendor_phone_numbers"("vendor_id", "phone_number");
CREATE INDEX IF NOT EXISTS "idx_phone_otp_vendor" ON "phone_otp_codes"("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_phone_otp_expires" ON "phone_otp_codes"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_phone_otp_used" ON "phone_otp_codes"("is_used");
CREATE INDEX IF NOT EXISTS "idx_security_logs_vendor" ON "security_logs"("vendor_id");
CREATE INDEX IF NOT EXISTS "idx_security_logs_action" ON "security_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_security_logs_created" ON "security_logs"("created_at");

-- AddForeignKey (safe) - table "User" avec majuscule
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_phone_numbers_vendor_id_fkey') THEN
    ALTER TABLE "vendor_phone_numbers" ADD CONSTRAINT "vendor_phone_numbers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'phone_otp_codes_vendor_id_fkey') THEN
    ALTER TABLE "phone_otp_codes" ADD CONSTRAINT "phone_otp_codes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_logs_vendor_id_fkey') THEN
    ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
