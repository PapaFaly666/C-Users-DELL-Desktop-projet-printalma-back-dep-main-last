const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateBestSellers() {
  try {
    console.log('🏆 Remplissage des meilleures ventes...\n');

    // 1. Vérifier les produits existants
    console.log('📊 Vérification des produits existants...');
    const allProducts = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        isBestSeller: true,
        salesCount: true,
        totalRevenue: true,
        bestSellerRank: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total: ${allProducts.length} produits trouvés`);

    if (allProducts.length === 0) {
      console.log('❌ Aucun produit trouvé. Impossible de marquer des meilleures ventes.');
      return;
    }

    // 2. Marquer les premiers produits comme meilleures ventes (pour test)
    const productsToMark = allProducts.slice(0, Math.min(5, allProducts.length));
    
    console.log(`\n🎯 Marquage de ${productsToMark.length} produits comme meilleures ventes...`);
    
    for (let i = 0; i < productsToMark.length; i++) {
      const product = productsToMark[i];
      
      // Simuler des données de vente
      const salesCount = Math.floor(Math.random() * 50) + 10; // 10-59 ventes
      const totalRevenue = salesCount * (product.price || 2500); // Prix * nombre de ventes
      
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: {
          isBestSeller: true,
          bestSellerRank: i + 1,
          salesCount: salesCount,
          totalRevenue: totalRevenue,
          // Ajouter d'autres champs si nécessaire
          isValidated: true
        }
      });
      
      console.log(`✅ Produit ${product.id} (${product.name}) marqué comme best-seller #${i + 1}`);
      console.log(`   - Ventes: ${salesCount}`);
      console.log(`   - Revenus: ${totalRevenue}`);
    }

    // 3. Vérifier le résultat
    console.log('\n🔍 Vérification du résultat...');
    const bestSellers = await prisma.vendorProduct.findMany({
      where: {
        isBestSeller: true,
        isDelete: false
      },
      select: {
        id: true,
        name: true,
        isBestSeller: true,
        bestSellerRank: true,
        salesCount: true,
        totalRevenue: true
      },
      orderBy: {
        bestSellerRank: 'asc'
      }
    });

    console.log(`\n🏆 Total des meilleures ventes: ${bestSellers.length}`);
    bestSellers.forEach(product => {
      console.log(`   ${product.bestSellerRank}. ${product.name} (ID: ${product.id})`);
      console.log(`      - Ventes: ${product.salesCount}`);
      console.log(`      - Revenus: ${product.totalRevenue}`);
    });

    console.log('\n✅ Remplissage terminé avec succès !');
    console.log('\n🎯 Maintenant vous pouvez tester:');
    console.log('   curl -X GET "http://localhost:3004/public/best-sellers"');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateBestSellers(); 