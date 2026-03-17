const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVendorEarnings() {
  try {
    console.log('🔄 Mise à jour des gains vendeur...');

    // Récupérer le vendeur
    const vendor = await prisma.user.findUnique({
      where: { email: 'pf.d@zig.univ.sn' }
    });

    if (!vendor) {
      throw new Error('Vendeur pf.d@zig.univ.sn non trouvé');
    }

    console.log(`✅ Vendeur trouvé: ${vendor.firstName} ${vendor.lastName}`);

    // Insérer ou mettre à jour les gains dans la table VendorEarnings
    const earningsData = {
      totalEarnings: 1500.00,           // Total des gains
      availableAmount: 1250.00,         // Montant disponible
      pendingAmount: 0.00,              // En attente
      thisMonthEarnings: 800.00,        // Ce mois-ci
      lastMonthEarnings: 700.00,        // Mois dernier
      totalCommissionPaid: 150.00,      // Commission payée
      averageCommissionRate: 0.10       // Taux moyen 10%
    };

    const vendorEarnings = await prisma.vendorEarnings.upsert({
      where: { vendorId: vendor.id },
      update: earningsData,
      create: {
        vendorId: vendor.id,
        ...earningsData
      }
    });

    console.log('✅ Gains mis à jour dans la base de données:');
    console.log(`💰 Total des gains: ${vendorEarnings.totalEarnings} FCFA`);
    console.log(`💸 Montant disponible: ${vendorEarnings.availableAmount} FCFA`);
    console.log(`📊 Ce mois: ${vendorEarnings.thisMonthEarnings} FCFA`);
    console.log(`📊 Mois dernier: ${vendorEarnings.lastMonthEarnings} FCFA`);

    // Vérifier les demandes en attente pour ajuster le pendingAmount
    const pendingRequests = await prisma.vendorFundsRequest.findMany({
      where: {
        vendorId: vendor.id,
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    });

    const totalPending = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

    if (totalPending > 0) {
      await prisma.vendorEarnings.update({
        where: { vendorId: vendor.id },
        data: {
          pendingAmount: totalPending,
          availableAmount: Math.max(0, earningsData.totalEarnings - totalPending)
        }
      });

      console.log(`⏳ Ajusté pour demandes en attente: ${totalPending} FCFA`);
      console.log(`✅ Nouveau montant disponible: ${Math.max(0, earningsData.totalEarnings - totalPending)} FCFA`);
    }

    console.log('\n🎉 Gains vendeur mis à jour avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateVendorEarnings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });