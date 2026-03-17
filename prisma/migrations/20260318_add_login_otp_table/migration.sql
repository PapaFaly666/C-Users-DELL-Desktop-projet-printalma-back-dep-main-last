-- CreateTable login_otps (safe)
CREATE TABLE IF NOT EXISTS "login_otps" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "login_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (safe)
CREATE INDEX IF NOT EXISTS "login_otps_user_id_idx" ON "login_otps"("user_id");
CREATE INDEX IF NOT EXISTS "login_otps_code_idx" ON "login_otps"("code");
CREATE INDEX IF NOT EXISTS "login_otps_expires_at_idx" ON "login_otps"("expires_at");
CREATE INDEX IF NOT EXISTS "login_otps_verified_idx" ON "login_otps"("verified");

-- AddForeignKey (safe)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'login_otps_user_id_fkey') THEN
    ALTER TABLE "login_otps" ADD CONSTRAINT "login_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
