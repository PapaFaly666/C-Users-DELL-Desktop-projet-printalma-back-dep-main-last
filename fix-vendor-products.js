const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixVendorProducts() {
  console.log('🔧 Correction des VendorProduct pour les Best Sellers...\n');

  try {
    // Mettre à jour tous les VendorProduct pour qu'ils passent les conditions
    const updatedProducts = await prisma.vendorProduct.updateMany({
      where: {
        isBestSeller: true,
        salesCount: { gte: 1 }
      },
      data: {
        isValidated: true,
        status: 'PUBLISHED',
        isDelete: false
      }
    });

    console.log(`✅ ${updatedProducts.count} produits mis à jour`);

    // Vérifier les conditions après mise à jour
    const bestSellerConditions = await prisma.vendorProduct.findMany({
      where: {
        isBestSeller: true,
        isValidated: true,
        status: 'PUBLISHED',
        isDelete: false,
        salesCount: {
          gte: 1
        }
      },
      include: {
        baseProduct: true,
        vendor: true
      }
    });

    console.log(`\n📊 Produits avec conditions best-seller: ${bestSellerConditions.length}`);

    for (const product of bestSellerConditions) {
      console.log(`\n🏆 Best Seller #${product.bestSellerRank}:`);
      console.log(`   Nom: ${product.name}`);
      console.log(`   Ventes: ${product.salesCount}`);
      console.log(`   CA: ${product.totalRevenue}€`);
      console.log(`   Vues: ${product.viewsCount}`);
      console.log(`   Vendeur: ${product.vendor?.firstName} ${product.vendor?.lastName}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Validé: ${product.isValidated}`);
    }

    console.log('\n🎉 Correction terminée !');
    console.log('🚀 Vous pouvez maintenant tester l\'API:');
    console.log('   - node quick-test-endpoints.js');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixVendorProducts();
}

module.exports = { fixVendorProducts }; 