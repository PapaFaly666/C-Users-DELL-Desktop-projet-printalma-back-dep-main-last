-- CreateTable (safe)
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "dataType" VARCHAR(20) NOT NULL DEFAULT 'string',
    "category" VARCHAR(50),
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (safe)
CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_key_key" ON "app_settings"("key");
CREATE INDEX IF NOT EXISTS "app_settings_key_idx" ON "app_settings"("key");
CREATE INDEX IF NOT EXISTS "app_settings_category_idx" ON "app_settings"("category");

-- AddForeignKey (safe) - table "User" avec majuscule
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_updated_by_fkey') THEN
    ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Insert default values (safe)
INSERT INTO "app_settings" ("key", "value", "dataType", "category", "updated_at") VALUES
('appName', 'PrintAlma', 'string', 'company', NOW()),
('contactEmail', 'contact@printalma.com', 'string', 'company', NOW()),
('supportEmail', 'support@printalma.com', 'string', 'company', NOW()),
('contactPhone', '+221 77 123 45 67', 'string', 'company', NOW()),
('companyAddress', 'Dakar, Sénégal', 'string', 'company', NOW()),
('websiteUrl', 'https://printalma.com', 'string', 'company', NOW()),
('vendorRegistrationEnabled', 'true', 'boolean', 'vendors', NOW()),
('emailNotificationsEnabled', 'true', 'boolean', 'email', NOW()),
('defaultVendorCommission', '15', 'number', 'vendors', NOW()),
('minWithdrawalAmount', '5000', 'number', 'vendors', NOW()),
('currency', 'XOF', 'string', 'general', NOW()),
('maintenanceMode', 'false', 'boolean', 'maintenance', NOW()),
('maintenanceMessage', 'Le site est en maintenance. Nous revenons bientôt.', 'string', 'maintenance', NOW())
ON CONFLICT ("key") DO NOTHING;
