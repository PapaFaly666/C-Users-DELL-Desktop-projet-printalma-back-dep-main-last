// Test spécifique pour la variation 42
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVariation42() {
  console.log('🧪 Test spécifique de la variation 42\n');

  try {
    // Vérifier la variation 42
    const variation = await prisma.variation.findUnique({
      where: { id: 42 },
      include: {
        subCategory: true
      }
    });

    if (!variation) {
      console.log('❌ Variation 42 non trouvée');
      return;
    }

    console.log(`📋 Variation: ${variation.name}`);
    console.log(`   Sous-catégorie: ${variation.subCategory.name}`);

    // Vérifier les produits qui utilisent directement cette variation
    const productsWithVariation = await prisma.product.count({
      where: {
        variationId: 42,
        isDelete: false
      }
    });

    console.log(`   Produits utilisant directement cette variation: ${productsWithVariation}`);

    // NOUVELLE LOGIQUE : Seulement vérifier les produits directs
    if (productsWithVariation > 0) {
      console.log('\n🛡️  PROTECTION ACTIVÉE (nouvelle logique)');
      console.log(`   La variation est utilisée par ${productsWithVariation} produit(s) directement`);
      console.log('   -> Suppression BLOQUÉE');
    } else {
      console.log('\n✅ PAS DE PROTECTION (nouvelle logique)');
      console.log('   La variation n\'est utilisée par aucun produit directement');
      console.log('   -> Suppression AUTORISÉE');
    }

    // Ancienne logique (pour comparaison)
    const parentSubCategoryProducts = await prisma.product.count({
      where: {
        subCategoryId: variation.subCategoryId,
        variationId: null,
        isDelete: false
      }
    });

    const oldTotal = productsWithVariation + parentSubCategoryProducts;
    console.log('\n📊 Comparaison avec l\'ancienne logique:');
    console.log(`   Ancienne logique total: ${oldTotal} (${productsWithVariation} directs + ${parentSubCategoryProducts} sous-catégorie)`);
    if (oldTotal > 0) {
      console.log('   Ancienne logique: BLOQUERAIT la suppression');
    } else {
      console.log('   Ancienne logique: AUTORISERAIT la suppression');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testVariation42();