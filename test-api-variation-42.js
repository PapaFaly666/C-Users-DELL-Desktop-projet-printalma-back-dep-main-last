// Test de l'API pour simuler la suppression de la variation 42
const { PrismaClient } = require('@prisma/client');
const { ConflictException } = require('@nestjs/common');

const prisma = new PrismaClient();

async function testApiSuppressionVariation42() {
  console.log('🔧 Test API: Simulation de la suppression de la variation 42\n');

  try {
    // Étape 1: Récupérer la variation 42
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

    console.log(`📋 Variation trouvée: ${variation.name}`);
    console.log(`   Sous-catégorie: ${variation.subCategory.name}\n`);

    // Étape 2: Simuler la logique du service corrigé
    const productsCount = await prisma.product.count({
      where: {
        variationId: 42,
        isDelete: false
      }
    });

    console.log(`🔍 Produits utilisant directement cette variation: ${productsCount}`);

    // Étape 3: Simuler la réponse du service
    if (productsCount > 0) {
      // Simulation de l'erreur que le backend retournerait
      const errorResponse = {
        success: false,
        error: 'VARIATION_IN_USE',
        message: `La variation est utilisée par ${productsCount} produit(s). Elle ne peut pas être supprimée.`,
        details: {
          variationId: 42,
          subCategoryId: variation.subCategoryId,
          productsCount,
          message: `${productsCount} produit(s) utilisent directement cette variation`
        }
      };

      console.log('\n🛡️  RÉPONSE API (erreur 409):');
      console.log(JSON.stringify(errorResponse, null, 2));

    } else {
      // Simulation de la réussite
      const successResponse = {
        success: true,
        message: 'Variation désactivée avec succès',
        data: {
          id: 42,
          name: variation.name,
          isActive: false,
          updatedAt: new Date()
        }
      };

      console.log('\n✅ RÉPONSE API (succès 200):');
      console.log(JSON.stringify(successResponse, null, 2));
    }

    console.log('\n🎯 Test terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiSuppressionVariation42();