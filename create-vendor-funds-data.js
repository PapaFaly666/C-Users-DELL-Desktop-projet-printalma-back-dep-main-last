const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Création des données de test pour le système de fonds vendeur...');

    // 1. Récupérer le vendeur existant
    const vendor = await prisma.user.findUnique({
      where: { email: 'pf.d@zig.univ.sn' }
    });

    if (!vendor) {
      throw new Error('Vendeur pf.d@zig.univ.sn non trouvé');
    }

    console.log(`✅ Vendeur trouvé: ${vendor.firstName} ${vendor.lastName}`);

    // 2. Créer quelques commandes livrées pour générer des gains
    const products = await prisma.product.findMany({
      include: { vendorProducts: true },
      take: 3
    });

    if (products.length === 0) {
      console.log('⚠️  Aucun produit trouvé, création de produits test...');

      // Créer des produits vendeur si nécessaire
      const testProduct = await prisma.product.create({
        data: {
          name: 'T-shirt Test Vendeur',
          description: 'Produit test pour le système de fonds',
          price: 25.00,
          stock: 100,
          isActive: true,
          vendorProducts: {
            create: {
              vendorId: vendor.id,
              commission: 15.0,
              isActive: true
            }
          }
        },
        include: { vendorProducts: true }
      });

      products.push(testProduct);
      console.log('✅ Produit test créé');
    }

    // 3. Créer des commandes livrées
    const deliveredOrders = [];
    for (let i = 0; i < 3; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `VF-${Date.now()}-${i}`,
          userId: vendor.id,
          totalAmount: 50.00 + (i * 10),
          phoneNumber: '+221771234567',
          status: 'DELIVERED',
          deliveredAt: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)), // Dernières semaines
          orderItems: {
            create: {
              productId: products[0].id,
              quantity: 2,
              unitPrice: 25.00
            }
          }
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: { vendorProducts: true }
              }
            }
          }
        }
      });
      deliveredOrders.push(order);
    }

    console.log(`✅ ${deliveredOrders.length} commandes livrées créées`);

    // 4. Calculer et créer les gains vendeur
    let totalEarnings = 0;
    for (const order of deliveredOrders) {
      for (const item of order.orderItems) {
        const vendorProduct = item.product.vendorProducts.find(vp => vp.vendorId === vendor.id);
        if (vendorProduct) {
          const commission = (item.quantity * item.unitPrice * vendorProduct.commission) / 100;
          totalEarnings += commission;

          await prisma.vendorEarnings.create({
            data: {
              vendorId: vendor.id,
              orderId: order.id,
              amount: commission,
              commissionRate: vendorProduct.commission,
              earningDate: order.deliveredAt
            }
          });
        }
      }
    }

    console.log(`✅ Gains créés: ${totalEarnings.toFixed(2)} €`);

    // 5. Créer des demandes de fonds variées
    const fundsRequests = [
      {
        amount: 100.00,
        requestedAmount: 100.00,
        description: 'Demande de retrait de fonds',
        paymentMethod: 'BANK_TRANSFER',
        phoneNumber: '+221771234567',
        availableBalance: totalEarnings,
        status: 'PENDING'
      },
      {
        amount: 50.00,
        requestedAmount: 50.00,
        description: 'Retrait partiel des gains',
        paymentMethod: 'ORANGE_MONEY',
        phoneNumber: '+221771234567',
        availableBalance: totalEarnings,
        status: 'APPROVED',
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        adminNote: 'Demande approuvée par admin'
      },
      {
        amount: 75.00,
        requestedAmount: 75.00,
        description: 'Retrait de gains mensuels',
        paymentMethod: 'BANK_TRANSFER',
        phoneNumber: '+221771234567',
        availableBalance: totalEarnings,
        status: 'PAID',
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        adminNote: 'Paiement effectué'
      }
    ];

    for (const requestData of fundsRequests) {
      const request = await prisma.vendorFundsRequest.create({
        data: {
          vendorId: vendor.id,
          ...requestData
        }
      });

      // Associer quelques commandes à chaque demande
      await prisma.vendorFundsRequestOrder.createMany({
        data: deliveredOrders.slice(0, 2).map(order => ({
          fundsRequestId: request.id,
          orderId: order.id
        }))
      });
    }

    console.log(`✅ ${fundsRequests.length} demandes de fonds créées`);

    // 6. Récapitulatif final
    const summary = await prisma.vendorFundsRequest.groupBy({
      by: ['status'],
      where: { vendorId: vendor.id },
      _count: { id: true }
    });

    console.log('\n📊 Récapitulatif des données créées:');
    console.log(`👤 Vendeur: ${vendor.email}`);
    console.log(`💰 Total des gains: ${totalEarnings.toFixed(2)} €`);
    console.log(`📦 Commandes livrées: ${deliveredOrders.length}`);

    summary.forEach(stat => {
      console.log(`📋 Demandes ${stat.status}: ${stat._count.id}`);
    });

    console.log('\n🎉 Données de test créées avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });