import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaytechData() {
  console.log('🔍 VÉRIFICATION PRISMA DES DONNÉES PAYTECH');
  console.log('==========================================');

  try {
    // 1. Vérifier les tables
    console.log('\n📋 1. Tables disponibles:');
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;
    console.log('Tables trouvées:', (tables as any[]).map((t: any) => t.table_name).join(', '));

    // 2. Vérifier la table orders
    console.log('\n📦 2. Table orders:');
    try {
      const orderCount = await prisma.order.count();
      console.log(`✅ Table orders existe avec ${orderCount} commande(s)`);
    } catch (error) {
      console.log('❌ Table orders non accessible:', error);
      return;
    }

    // 3. Commandes Paytech
    console.log('\n💳 3. Commandes Paytech:');
    const paytechOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PAYTECH'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Nombre de commandes Paytech: ${paytechOrders.length}`);

    if (paytechOrders.length > 0) {
      paytechOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. 📦 Commande: ${order.orderNumber}`);
        console.log(`   👤 Client ID: ${order.userId}`);
        console.log(`   💰 Montant: ${order.totalAmount} XOF`);
        console.log(`   📞 Téléphone: ${order.phoneNumber}`);
        console.log(`   💳 Méthode: ${order.paymentMethod}`);
        console.log(`   📊 Statut paiement: ${order.paymentStatus || 'NON DÉFINI'}`);
        console.log(`   🆔 Transaction ID: ${order.transactionId || 'NON DÉFINI'}`);
        console.log(`   📦 Statut commande: ${order.status}`);
        console.log(`   📅 Créée le: ${order.createdAt.toLocaleString('fr-FR')}`);
        console.log(`   📝 Notes: ${order.notes || 'Aucune'}`);
      });

      // 4. Statistiques
      console.log('\n📈 4. Statistiques:');
      const stats = await prisma.order.groupBy({
        by: ['paymentStatus'],
        where: {
          paymentMethod: 'PAYTECH'
        },
        _count: {
          paymentStatus: true
        },
        _sum: {
          totalAmount: true
        }
      });

      console.log('Répartition par statut:');
      stats.forEach(stat => {
        const status = stat.paymentStatus || 'NON DÉFINI';
        const count = stat._count.paymentStatus;
        const total = stat._sum.totalAmount || 0;
        console.log(`  ${status}: ${count} commande(s), ${total} XOF`);
      });

      // 5. URLs actives
      console.log('\n🔗 5. URLs de paiement actives:');
      const pendingOrders = paytechOrders.filter(order => order.paymentStatus === 'PENDING' && order.transactionId);

      if (pendingOrders.length > 0) {
        pendingOrders.forEach(order => {
          console.log(`💳 ${order.orderNumber}: https://paytech.sn/payment/checkout/${order.transactionId}`);
          console.log(`   💰 Montant: ${order.totalAmount} XOF`);
        });
      } else {
        console.log('❌ Aucune URL de paiement active');
      }

    } else {
      console.log('❌ Aucune commande Paytech trouvée');
    }

    // 6. Vérifier les utilisateurs
    console.log('\n👤 6. Utilisateurs:');
    const userCount = await prisma.user.count();
    console.log(`✅ Nombre d'utilisateurs: ${userCount}`);

    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'paytech'
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (testUsers.length > 0) {
      console.log('👥 Utilisateurs de test Paytech:');
      testUsers.forEach(user => {
        console.log(`  • ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
      });
    }

    console.log('\n✅ VÉRIFICATION TERMINÉE !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
checkPaytechData();