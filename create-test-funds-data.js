#!/usr/bin/env node

/**
 * Script pour créer des données de test pour vérifier le calcul des gains vendeur
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🛠️  Création de données de test pour les appels de fonds...\n');

  try {
    // 1. Trouver ou créer un vendeur de test
    const vendor = await prisma.user.findFirst({
      where: { role: 'VENDEUR' }
    });

    if (!vendor) {
      console.log('❌ Aucun vendeur trouvé. Créez d\'abord un vendeur.');
      return;
    }

    console.log(`📝 Vendeur de test: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id})`);

    // 2. Créer ou mettre à jour le cache des gains
    const totalEarnings = 700000; // 700,000 FCFA comme dans l'exemple

    await prisma.vendorEarnings.upsert({
      where: { vendorId: vendor.id },
      create: {
        vendorId: vendor.id,
        totalEarnings: totalEarnings,
        availableAmount: 0, // Sera recalculé dynamiquement
        pendingAmount: 0,   // Sera recalculé dynamiquement
        thisMonthEarnings: 150000,
        lastMonthEarnings: 120000,
        totalCommissionPaid: totalEarnings * 0.10,
        averageCommissionRate: 0.10,
      },
      update: {
        totalEarnings: totalEarnings,
        thisMonthEarnings: 150000,
        lastMonthEarnings: 120000,
        totalCommissionPaid: totalEarnings * 0.10,
        lastCalculatedAt: new Date(),
      }
    });

    console.log(`✅ Cache des gains créé: ${totalEarnings.toLocaleString()} FCFA`);

    // 3. Supprimer les anciennes demandes de test
    await prisma.vendorFundsRequest.deleteMany({
      where: {
        vendorId: vendor.id,
        description: { contains: '[TEST]' }
      }
    });

    // 4. Créer des demandes de test selon l'exemple du guide
    const testRequests = [
      // Demandes déjà payées
      { amount: 25000, status: 'PAID', description: '[TEST] Première demande payée' },
      { amount: 20000, status: 'PAID', description: '[TEST] Deuxième demande payée' },

      // Demandes en attente
      { amount: 23500, status: 'PENDING', description: '[TEST] Demande en attente 1' },
      { amount: 32000, status: 'PENDING', description: '[TEST] Demande en attente 2' },
    ];

    for (const requestData of testRequests) {
      await prisma.vendorFundsRequest.create({
        data: {
          vendorId: vendor.id,
          amount: requestData.amount,
          requestedAmount: requestData.amount,
          description: requestData.description,
          paymentMethod: 'WAVE',
          phoneNumber: '771234567',
          status: requestData.status,
          availableBalance: totalEarnings,
          commissionRate: 0.10,
          processedAt: requestData.status === 'PAID' ? new Date() : null,
        }
      });
    }

    console.log('✅ Demandes de test créées:');

    // 5. Calculer et afficher l'état attendu
    const paidAmount = testRequests.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = testRequests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
    const expectedAvailable = totalEarnings - paidAmount - pendingAmount;

    console.log(`   - Demandes payées: ${paidAmount.toLocaleString()} FCFA`);
    console.log(`   - Demandes en attente: ${pendingAmount.toLocaleString()} FCFA`);
    console.log(`   - Montant disponible attendu: ${expectedAvailable.toLocaleString()} FCFA`);

    console.log('\n🧪 Maintenant vous pouvez tester:');
    console.log('   1. node test-funds-calculation.js');
    console.log('   2. Marquer une demande en attente comme payée via l\'admin');
    console.log('   3. Vérifier que le montant disponible diminue correctement');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanTestData() {
  console.log('🧹 Nettoyage des données de test...\n');

  try {
    const vendor = await prisma.user.findFirst({
      where: { role: 'VENDEUR' }
    });

    if (!vendor) {
      console.log('❌ Aucun vendeur trouvé.');
      return;
    }

    // Supprimer les demandes de test
    const deletedRequests = await prisma.vendorFundsRequest.deleteMany({
      where: {
        vendorId: vendor.id,
        description: { contains: '[TEST]' }
      }
    });

    console.log(`✅ ${deletedRequests.count} demandes de test supprimées`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
const args = process.argv.slice(2);
if (args[0] === 'clean') {
  cleanTestData();
} else {
  createTestData();
}