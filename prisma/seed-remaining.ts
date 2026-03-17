import { PrismaClient } from '@prisma/client';
import { seedOrders } from './seed-orders';
import { seedFundsRequests } from './seed-funds-requests';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding remaining data (Orders & Funds Requests)...\n');

  try {
    // Récupérer les données existantes
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDEUR' },
    });

    const clients = await prisma.user.findMany({
      where: { role: null },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const products = await prisma.product.findMany();

    console.log(`✅ Found ${vendors.length} vendors, ${clients.length} clients, ${products.length} products\n`);

    // Seed Orders
    console.log('📦 Step 1/2: Orders...');
    const orders = await seedOrders({ vendors, clients }, products);
    console.log('');

    // Seed Funds Requests
    console.log('💰 Step 2/2: Funds Requests...');
    await seedFundsRequests({ vendors, admins }, orders);
    console.log('');

    console.log('✅ Remaining data seeded successfully!\n');

    // Afficher un résumé
    console.log('📊 UPDATED SUMMARY:');
    console.log('═'.repeat(50));

    const counts = {
      orders: await prisma.order.count(),
      ordersPending: await prisma.order.count({ where: { status: 'PENDING' } }),
      ordersDelivered: await prisma.order.count({ where: { status: 'DELIVERED' } }),
      fundsRequests: await prisma.vendorFundsRequest.count(),
      fundsRequestsPending: await prisma.vendorFundsRequest.count({ where: { status: 'PENDING' } }),
      fundsRequestsPaid: await prisma.vendorFundsRequest.count({ where: { status: 'PAID' } }),
    };

    console.log(`📦 Orders: ${counts.orders}`);
    console.log(`   ├─ Pending: ${counts.ordersPending}`);
    console.log(`   └─ Delivered: ${counts.ordersDelivered}`);
    console.log('');

    console.log(`💰 Funds Requests: ${counts.fundsRequests}`);
    console.log(`   ├─ Pending: ${counts.fundsRequestsPending}`);
    console.log(`   └─ Paid: ${counts.fundsRequestsPaid}`);
    console.log('');

    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
