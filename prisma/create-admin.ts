import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'pfdiagne35@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@2024!';
  const firstName = process.env.ADMIN_FIRST_NAME || 'Papa Faly';
  const lastName = process.env.ADMIN_LAST_NAME || 'Diagne';

  console.log(`Creating/updating admin user: ${email}`);

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: true,
      userStatus: 'ACTIVE',
      email_verified: true,
      must_change_password: false,
    },
    create: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: true,
      userStatus: 'ACTIVE',
      email_verified: true,
      must_change_password: false,
    },
  });

  console.log(`✅ Admin created/updated: id=${admin.id}, email=${admin.email}, role=${admin.role}`);
  console.log(`   Password set to: ${password}`);
  await prisma.$disconnect();
}

createAdmin().catch((e) => {
  console.error('❌ Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
