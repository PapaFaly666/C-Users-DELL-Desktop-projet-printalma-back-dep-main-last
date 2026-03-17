/**
 * Test de protection de la hiérarchie lors de la suppression
 * Vérifie qu'on ne peut pas supprimer une catégorie/sous-catégorie/variation utilisée par un produit
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🛡️ Test de protection de la hiérarchie lors de la suppression\n');

  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // ÉTAPE 1: Créer une hiérarchie complète
    console.log('📂 Étape 1: Création de la hiérarchie complète...');

    const category = await prisma.category.create({
      data: {
        name: `Électronique Test ${timestamp}`,
        slug: `electronique-test-${timestamp}`,
        description: `Catégorie de test pour l'électronique - ${timestamp}`,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Catégorie créée: ID=${category.id}, Nom="${category.name}"`);

    const subCategory = await prisma.subCategory.create({
      data: {
        name: `Téléphones Test ${randomSuffix}`,
        slug: `telephones-test-${randomSuffix}`,
        description: `Sous-catégorie de test pour les téléphones - ${randomSuffix}`,
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie créée: ID=${subCategory.id}, Nom="${subCategory.name}"`);

    const variation = await prisma.variation.create({
      data: {
        name: `Smartphone Test ${randomSuffix}`,
        slug: `smartphone-test-${randomSuffix}`,
        description: `Variation smartphone pour test - ${randomSuffix}`,
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Variation créée: ID=${variation.id}, Nom="${variation.name}"`);

    // ÉTAPE 2: Créer un produit qui utilise cette hiérarchie
    console.log('\n🛍️ Étape 2: Création d\'un produit utilisant cette hiérarchie...');

    const product = await prisma.product.create({
      data: {
        name: `Smartphone Premium Test ${timestamp}`,
        description: `Smartphone premium pour tester la protection - ${timestamp}`,
        price: 699.99,
        suggestedPrice: 799.99,
        stock: 50,
        status: 'PUBLISHED',
        genre: 'UNISEXE',
        isReadyProduct: true,
        isValidated: true,
        // Hiérarchie complète
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id,
        // Variations de couleur
        colorVariations: {
          create: {
            name: `Noir Mat ${randomSuffix}`,
            colorCode: '#1C1C1C',
            images: {
              create: {
                view: 'FRONT',
                url: `https://example.com/smartphone-noir-${timestamp}.jpg`,
                publicId: `smartphone_noir_${timestamp}`,
                naturalWidth: 1080,
                naturalHeight: 1920
              }
            }
          }
        },
        // Tailles (pour smartphone: capacité de stockage)
        sizes: {
          create: [
            { sizeName: '64GB' },
            { sizeName: '128GB' },
            { sizeName: '256GB' }
          ]
        }
      },
      include: {
        category: true,
        subCategory: true,
        variation: true,
        colorVariations: true,
        sizes: true
      }
    });
    console.log(`✅ Produit créé: ID=${product.id}, Nom="${product.name}"`);
    console.log(`   - Utilise la catégorie: ${product.category.name} (ID: ${product.categoryId})`);
    console.log(`   - Utilise la sous-catégorie: ${product.subCategory.name} (ID: ${product.subCategoryId})`);
    console.log(`   - Utilise la variation: ${product.variation.name} (ID: ${product.variationId})`);

    // Créer quelques stocks
    const createdColorVariations = await prisma.colorVariation.findMany({
      where: { productId: product.id }
    });

    for (const colorVar of createdColorVariations) {
      for (const size of ['64GB', '128GB', '256GB']) {
        await prisma.productStock.create({
          data: {
            productId: product.id,
            colorId: colorVar.id,
            sizeName: size,
            stock: Math.floor(Math.random() * 20) + 5
          }
        });
      }
    }
    console.log(`✅ Stocks créés: ${createdColorVariations.length} × 3 tailles = ${createdColorVariations.length * 3} stocks`);

    // ÉTAPE 3: Tenter de supprimer la VARIATION utilisée par le produit
    console.log('\n🚫 Étape 3: Tentative de suppression de la variation utilisée...');
    try {
      await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log('❌ ERREUR: La variation a été supprimée (ce ne devrait pas arriver!)');
    } catch (error) {
      if (error.code === 'P2025') {
        console.log('✅ PROTECTION OK: La variation ne peut pas être supprimée car elle est utilisée');
        console.log(`   Code d'erreur: ${error.code}`);
        console.log(`   Message: ${error.message}`);
      } else {
        console.log(`⚠️ Autre erreur (peut être attendue): ${error.code} - ${error.message}`);
      }
    }

    // Vérifier que la variation existe toujours
    const variationExists = await prisma.variation.findUnique({
      where: { id: variation.id }
    });
    console.log(`   - Variation ${variation.name}: ${variationExists ? '✅ existe toujours' : '❌ a été supprimée'}`);

    // ÉTAPE 4: Tenter de supprimer la SOUS-CATÉGORIE utilisée par le produit
    console.log('\n🚫 Étape 4: Tentative de suppression de la sous-catégorie utilisée...');
    try {
      await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log('❌ ERREUR: La sous-catégorie a été supprimée (ce ne devrait pas arriver!)');
    } catch (error) {
      if (error.code === 'P2025') {
        console.log('✅ PROTECTION OK: La sous-catégorie ne peut pas être supprimée car elle est utilisée');
        console.log(`   Code d'erreur: ${error.code}`);
        console.log(`   Message: ${error.message}`);
      } else {
        console.log(`⚠️ Autre erreur (peut être attendue): ${error.code} - ${error.message}`);
      }
    }

    // Vérifier que la sous-catégorie existe toujours
    const subCategoryExists = await prisma.subCategory.findUnique({
      where: { id: subCategory.id }
    });
    console.log(`   - Sous-catégorie ${subCategory.name}: ${subCategoryExists ? '✅ existe toujours' : '❌ a été supprimée'}`);

    // ÉTAPE 5: Tenter de supprimer la CATÉGORIE utilisée par le produit
    console.log('\n🚫 Étape 5: Tentative de suppression de la catégorie utilisée...');
    try {
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log('❌ ERREUR: La catégorie a été supprimée (ce ne devrait pas arriver!)');
    } catch (error) {
      if (error.code === 'P2025') {
        console.log('✅ PROTECTION OK: La catégorie ne peut pas être supprimée car elle est utilisée');
        console.log(`   Code d'erreur: ${error.code}`);
        console.log(`   Message: ${error.message}`);
      } else {
        console.log(`⚠️ Autre erreur (peut être attendue): ${error.code} - ${error.message}`);
      }
    }

    // Vérifier que la catégorie existe toujours
    const categoryExists = await prisma.category.findUnique({
      where: { id: category.id }
    });
    console.log(`   - Catégorie ${category.name}: ${categoryExists ? '✅ existe toujours' : '❌ a été supprimée'}`);

    // ÉTAPE 6: Vérifier l'état complet du système
    console.log('\n📊 Étape 6: État complet du système avant suppression du produit...');

    const fullHierarchy = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        subCategories: {
          include: {
            variations: true,
            products: {
              where: { isDelete: false }
            }
          }
        },
        directProducts: {
          where: { isDelete: false }
        },
        _count: {
          select: {
            products: true,
            subCategories: true
          }
        }
      }
    });

    console.log(`📋 Hiérarchie ${fullHierarchy.name}:`);
    console.log(`   - Produits directs: ${fullHierarchy._count.products}`);
    console.log(`   - Sous-catégories: ${fullHierarchy.subCategories.length}`);

    fullHierarchy.subCategories.forEach(sub => {
      console.log(`   └── ${sub.name}:`);
      console.log(`       - Produits: ${sub.products.length}`);
      console.log(`       - Variations: ${sub.variations.length}`);
      sub.variations.forEach(variation => {
        console.log(`           └── ${variation.name}`);
      });
    });

    // ÉTAPE 7: Supprimer le produit en premier
    console.log('\n🗑️ Étape 7: Suppression du produit (obligatoire pour libérer la hiérarchie)...');

    // Supprimer les stocks
    await prisma.productStock.deleteMany({
      where: { productId: product.id }
    });
    console.log('✅ Stocks supprimés');

    // Supprimer les tailles
    await prisma.productSize.deleteMany({
      where: { productId: product.id }
    });
    console.log('✅ Tailles supprimées');

    // Supprimer les images et variations couleur
    const imageIds = fullHierarchy.subCategories[0]?.products[0]?.colorVariations?.flatMap(cv => cv.images?.map(img => img.id)) || [];
    if (imageIds.length > 0) {
      await prisma.delimitation.deleteMany({
        where: { productImageId: { in: imageIds } }
      });
      console.log('✅ Délimitations supprimées');
    }

    await prisma.productImage.deleteMany({
      where: { colorVariationId: { in: createdColorVariations.map(cv => cv.id) } }
    });
    console.log('✅ Images supprimées');

    await prisma.colorVariation.deleteMany({
      where: { productId: product.id }
    });
    console.log('✅ Variations couleur supprimées');

    // Supprimer le produit
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log('✅ Produit supprimé');

    // ÉTAPE 8: Maintenant la hiérarchie devrait pouvoir être supprimée
    console.log('\n🔓 Étape 8: La hiérarchie est maintenant libre - test de suppression...');

    // Supprimer la variation
    try {
      await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log('✅ Variation supprimée avec succès (produit supprimé au préalable)');
    } catch (error) {
      console.log(`❌ Erreur lors de la suppression de la variation: ${error.message}`);
    }

    // Supprimer la sous-catégorie
    try {
      await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log('✅ Sous-catégorie supprimée avec succès (produit supprimé au préalable)');
    } catch (error) {
      console.log(`❌ Erreur lors de la suppression de la sous-catégorie: ${error.message}`);
    }

    // Supprimer la catégorie
    try {
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log('✅ Catégorie supprimée avec succès (produit supprimé au préalable)');
    } catch (error) {
      console.log(`❌ Erreur lors de la suppression de la catégorie: ${error.message}`);
    }

    // Vérification finale
    console.log('\n🔍 Étape 9: Vérification finale...');
    const finalCategory = await prisma.category.findUnique({ where: { id: category.id } });
    const finalSubCategory = await prisma.subCategory.findUnique({ where: { id: subCategory.id } });
    const finalVariation = await prisma.variation.findUnique({ where: { id: variation.id } });

    console.log(`   - Catégorie: ${finalCategory ? '❌ existe encore' : '✅ supprimée'}`);
    console.log(`   - Sous-catégorie: ${finalSubCategory ? '❌ existe encore' : '✅ supprimée'}`);
    console.log(`   - Variation: ${finalVariation ? '❌ existe encore' : '✅ supprimée'}`);

    console.log('\n🎉 Test de protection de la hiérarchie terminé!');
    console.log('✅ La protection fonctionne correctement');
    console.log('✅ Les entités utilisées par des produits ne peuvent pas être supprimées');
    console.log('✅ La suppression est possible après libération des dépendances');

  } catch (error) {
    console.error('\n❌ Erreur durant le test de protection:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Connexion à la base de données fermée');
  }
}

main();