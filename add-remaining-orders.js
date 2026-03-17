const { PrismaClient, OrderStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Ajout des 13 commandes restantes...\n');

  try {
    // Récupérer les données nécessaires
    const products = await prisma.product.findMany({
      include: { colorVariations: true }
    });

    const clients = await prisma.user.findMany({
      where: {
        role: null,
        email: { not: 'pf.d@zig.univ.sn' }
      }
    });

    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED
    ];

    const startIndex = 37;
    const createdOrders = [];

    for (let i = startIndex; i < 50; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const colorVariation = product.colorVariations[Math.floor(Math.random() * product.colorVariations.length)];
        selectedProducts.push({ product, colorVariation });
      }

      let status;
      const rand = Math.random();
      if (rand < 0.3) status = OrderStatus.PENDING;
      else if (rand < 0.6) status = OrderStatus.CONFIRMED;
      else if (rand < 0.75) status = OrderStatus.PROCESSING;
      else if (rand < 0.85) status = OrderStatus.SHIPPED;
      else if (rand < 0.95) status = OrderStatus.DELIVERED;
      else status = OrderStatus.CANCELLED;

      const totalAmount = selectedProducts.reduce((sum, item) => sum + item.product.price * 2, 0);

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i.toString().padStart(3, '0')}`,
          userId: client.id,
          status,
          totalAmount,
          phoneNumber: client.phone || '+221700000000',
          notes: `Commande ${i + 1} - ${status}`,
          shippingName: `${client.firstName} ${client.lastName}`,
          shippingStreet: client.address,
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          shippingPostalCode: '10000',
          shippingCountry: 'Sénégal',
          shippingAddressFull: `${client.address}, Dakar, Sénégal`,
          createdAt,
          confirmedAt: status !== OrderStatus.PENDING ? new Date(createdAt.getTime() + 60000) : null,
          shippedAt: [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(status)
            ? new Date(createdAt.getTime() + 120000)
            : null,
          deliveredAt: status === OrderStatus.DELIVERED
            ? new Date(createdAt.getTime() + 180000)
            : null,
          orderItems: {
            create: selectedProducts.map(({ product, colorVariation }) => ({
              productId: product.id,
              quantity: 2,
              unitPrice: product.price,
              size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
              color: colorVariation.name,
              colorId: colorVariation.id
            }))
          }
        }
      });

      createdOrders.push(order);
      console.log(`✅ Commande ${i + 1}/50 créée`);
    }

    // Statistiques finales
    const totalOrders = await prisma.order.count();
    const byStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 STATISTIQUES FINALES');
    console.log('='.repeat(60));
    console.log(`\n📦 TOTAL COMMANDES: ${totalOrders}`);
    console.log(`\n📊 RÉPARTITION PAR STATUT:`);

    byStatus.forEach(s => {
      const emoji = {
        PENDING: '🟡',
        CONFIRMED: '🔵',
        PROCESSING: '🟣',
        SHIPPED: '🟠',
        DELIVERED: '🟢',
        CANCELLED: '🔴'
      };
      console.log(`   ${emoji[s.status] || '⚪'} ${s.status}: ${s._count}`);
    });

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
      }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    console.log(`\n💰 CHIFFRE D'AFFAIRES: ${totalRevenue.toLocaleString('fr-FR')} FCFA`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCÈS - 50 commandes au total!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
