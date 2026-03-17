import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaytechOrders() {
  console.log('🔍 VÉRIFICATION DES PAIEMENTS PAYTECH');
  console.log('=====================================\n');

  try {
    // 1. Toutes les commandes avec statuts de paiement
    console.log('1️⃣ TOUS LES PAIEMENTS PAYTECH :');
    const allPaytechOrders = await prisma.order.findMany({
      where: {
        paymentStatus: {
          not: null
        }
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        transactionId: true,
        paymentMethod: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Nombre total : ${allPaytechOrders.length}\n`);

    if (allPaytechOrders.length > 0) {
      console.log('Liste des paiements :');
      allPaytechOrders.forEach(order => {
        console.log(`📋 Commande #${order.orderNumber}`);
        console.log(`   Status paiement : ${order.paymentStatus}`);
        console.log(`   Transaction ID : ${order.transactionId || 'N/A'}`);
        console.log(`   Méthode : ${order.paymentMethod || 'N/A'}`);
        console.log(`   Montant : ${order.totalAmount} XOF`);
        console.log(`   Client : ${order.user.firstName} ${order.user.lastName}`);
        console.log(`   Date : ${order.createdAt.toLocaleString()}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ Aucun paiement Paytech trouvé');
    }

    // 2. Paiements réussis uniquement
    console.log('\n2️⃣ PAIEMENTS RÉUSSIS (PAID) :');
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID'
      },
      select: {
        id: true,
        orderNumber: true,
        transactionId: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Nombre de paiements réussis : ${paidOrders.length}\n`);

    paidOrders.forEach(order => {
      console.log(`✅ Commande #${order.orderNumber} - ${order.totalAmount} XOF`);
      console.log(`   Transaction : ${order.transactionId}`);
      console.log(`   Client : ${order.user.firstName} ${order.user.lastName}`);
      console.log(`   Date : ${order.createdAt.toLocaleString()}`);
      console.log('   ---');
    });

    // 3. Paiements échoués
    console.log('\n3️⃣ PAIEMENTS ÉCHOUÉS (FAILED) :');
    const failedOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'FAILED'
      },
      select: {
        id: true,
        orderNumber: true,
        transactionId: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Nombre de paiements échoués : ${failedOrders.length}\n`);

    failedOrders.forEach(order => {
      console.log(`❌ Commande #${order.orderNumber} - ${order.totalAmount} XOF`);
      console.log(`   Transaction : ${order.transactionId || 'N/A'}`);
      console.log(`   Client : ${order.user.firstName} ${order.user.lastName}`);
      console.log(`   Date : ${order.createdAt.toLocaleString()}`);
      console.log('   ---');
    });

    // 4. Paiements en attente
    console.log('\n4️⃣ PAIEMENTS EN ATTENTE (PENDING) :');
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING'
      },
      select: {
        id: true,
        orderNumber: true,
        transactionId: true,
        totalAmount: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Nombre de paiements en attente : ${pendingOrders.length}\n`);

    pendingOrders.forEach(order => {
      console.log(`⏳ Commande #${order.orderNumber} - ${order.totalAmount} XOF`);
      console.log(`   Transaction : ${order.transactionId || 'N/A'}`);
      console.log(`   Client : ${order.user.firstName} ${order.user.lastName}`);
      console.log(`   Date : ${order.createdAt.toLocaleString()}`);
      console.log('   ---');
    });

    // 5. Statistiques
    console.log('\n📊 STATISTIQUES PAYTECH :');
    const stats = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        paymentStatus: {
          not: null
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    console.log('Répartition par statut :');
    stats.forEach(stat => {
      console.log(`   ${stat.paymentStatus}: ${stat._count.id} commandes (${stat._sum.totalAmount || 0} XOF)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPaytechOrders();