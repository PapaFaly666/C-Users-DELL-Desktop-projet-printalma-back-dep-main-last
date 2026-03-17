// Script de test simple pour vérifier que nos endpoints fonctionnent
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVendorOrdersSetup() {
  console.log('🧪 Test de l\'installation des données...');

  try {
    // Test 1: Vérifier qu'on peut se connecter à la base de données
    const userCount = await prisma.user.count();
    console.log('✅ Connexion DB OK - Utilisateurs:', userCount);

    // Test 2: Chercher un vendeur
    const vendor = await prisma.user.findFirst({
      where: { role: 'VENDEUR' }
    });

    if (vendor) {
      console.log('✅ Vendeur trouvé:', vendor.email, `(ID: ${vendor.id})`);

      // Test 3: Chercher les commandes pour ce vendeur
      const orders = await prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              product: {
                vendorProducts: {
                  some: {
                    vendorId: vendor.id
                  }
                }
              }
            }
          }
        },
        include: {
          user: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      console.log('✅ Commandes trouvées pour le vendeur:', orders.length);
      orders.forEach(order => {
        console.log(`  - ${order.orderNumber}: ${order.status} (${order.totalAmount} FCFA)`);
      });

    } else {
      console.log('⚠️ Aucun vendeur trouvé - exécutez le script de seed');
    }

    // Test 4: Vérifier les produits
    const products = await prisma.product.count();
    console.log('✅ Produits dans la DB:', products);

    // Test 5: Vérifier les produits vendeur
    const vendorProducts = await prisma.vendorProduct.count();
    console.log('✅ Produits vendeur dans la DB:', vendorProducts);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVendorOrdersSetup();