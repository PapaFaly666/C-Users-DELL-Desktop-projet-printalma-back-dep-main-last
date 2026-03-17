import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSimplePaytechOrders() {
  console.log('🚀 Création simple de commandes Paytech...');

  try {
    // 1. Créer un utilisateur simple
    console.log('👤 Création d\'un utilisateur test...');

    const testUser = await prisma.user.findFirst({
      where: { email: 'testuser1@paytech.com' }
    });

    if (!testUser) {
      throw new Error('Utilisateur test non trouvé. Exécutez d\'abord le script précédent.');
    }

    console.log(`✅ Utilisateur trouvé: ${testUser.id} (${testUser.email})`);

    // 2. Créer directement des commandes Paytech
    console.log('💳 Création des commandes Paytech...');

    // Commande 1 - En attente de paiement
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'PAYTECH-SIMPLE-001',
        userId: testUser.id,
        status: 'PENDING',
        totalAmount: 5000,
        phoneNumber: testUser.phone || '221770000001',
        paymentMethod: 'PAYTECH',
        paymentStatus: 'PENDING',
        transactionId: '405gzopmh98s6qc',
        notes: 'Commande de test Paytech - En attente',
        shippingName: `${testUser.firstName} ${testUser.lastName}`,
        shippingStreet: 'Rue du Test Paytech',
        shippingCity: 'Dakar',
        shippingCountry: 'Sénégal',
        shippingAmount: 1000,
        subtotal: 5000,
        taxAmount: 500
      }
    });

    // Commande 2 - Paiement réussi
    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'PAYTECH-SIMPLE-002',
        userId: testUser.id,
        status: 'CONFIRMED',
        totalAmount: 7500,
        phoneNumber: testUser.phone || '221770000001',
        paymentMethod: 'PAYTECH',
        paymentStatus: 'PAID',
        transactionId: 'eey3kpmh98snn8',
        confirmedAt: new Date(),
        notes: 'Commande de test Paytech - Payée',
        shippingName: `${testUser.firstName} ${testUser.lastName}`,
        shippingStreet: 'Avenue du Succès Paytech',
        shippingCity: 'Thiès',
        shippingCountry: 'Sénégal',
        shippingAmount: 1500,
        subtotal: 7500,
        taxAmount: 750
      }
    });

    // Commande 3 - Échec de paiement
    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'PAYTECH-SIMPLE-003',
        userId: testUser.id,
        status: 'CANCELLED',
        totalAmount: 10000,
        phoneNumber: testUser.phone || '221770000001',
        paymentMethod: 'PAYTECH',
        paymentStatus: 'FAILED',
        transactionId: 'fail-test-001',
        notes: 'Commande de test Paytech - Échec',
        shippingName: `${testUser.firstName} ${testUser.lastName}`,
        shippingStreet: 'Boulevard de l\'Échec',
        shippingCity: 'Saint-Louis',
        shippingCountry: 'Sénégal',
        shippingAmount: 2000,
        subtotal: 10000,
        taxAmount: 1000
      }
    });

    console.log('✅ Commandes Paytech créées avec succès !');

    // 3. Afficher le résumé
    console.log('\n📊 RÉSUMÉ DES COMMANDES PAYTECH:');
    console.log('==================================');

    const orders = [order1, order2, order3];

    for (const order of orders) {
      console.log(`\n📦 Commande: ${order.orderNumber}`);
      console.log(`   👤 Client ID: ${order.userId}`);
      console.log(`   💰 Montant: ${order.totalAmount} XOF`);
      console.log(`   📞 Téléphone: ${order.phoneNumber}`);
      console.log(`   💳 Méthode: ${order.paymentMethod}`);
      console.log(`   📊 Statut paiement: ${order.paymentStatus}`);
      console.log(`   🆔 Transaction ID: ${order.transactionId}`);
      console.log(`   📦 Statut commande: ${order.status}`);
      console.log(`   📅 Créée le: ${order.createdAt}`);
    }

    // 4. Afficher les URLs de paiement
    console.log('\n🔗 URLS DE PAIEMENT ACTIVES:');
    console.log('===========================');
    console.log(`💳 Commande ${order1.orderNumber} (En attente): https://paytech.sn/payment/checkout/${order1.transactionId}`);
    console.log(`💰 Montant: ${order1.totalAmount} XOF`);

    console.log('\n✅ TEST TERMINÉ - Commandes Paytech créées !');

    return { orders };

  } catch (error) {
    console.error('❌ Erreur lors de la création des commandes:', error);
    throw error;
  }
}

// Exécuter la création
createSimplePaytechOrders()
  .then((result) => {
    console.log('\n🎉 Succès total !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec:', error);
    process.exit(1);
  });