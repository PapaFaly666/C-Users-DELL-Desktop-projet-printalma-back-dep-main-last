const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConstraints() {
  console.log('🚀 DÉBUT DU TEST DE CONTRAINTES DE BASE DE DONNÉES\n');

  try {
    // Étape 1: Créer la hiérarchie complète
    console.log('📁 ÉTAPE 1: CRÉATION DE LA HIÉRARCHIE DE CATÉGORIES');

    // Créer une catégorie
    const category = await prisma.category.create({
      data: {
        name: 'Vêtements de Test DB',
        slug: 'vetements-test-db',
        description: 'Description pour test des contraintes',
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Catégorie "${category.name}" créée avec ID: ${category.id}`);

    // Créer une sous-catégorie
    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'T-shirts de Test DB',
        slug: 'tshirts-test-db',
        description: 'Description pour test des contraintes',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie "${subCategory.name}" créée avec ID: ${subCategory.id}`);

    // Créer une variation
    const variation = await prisma.variation.create({
      data: {
        name: 'Col rond de Test DB',
        slug: 'col-rond-test-db',
        description: 'Description pour test des contraintes',
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Variation "${variation.name}" créée avec ID: ${variation.id}`);

    // Étape 2: Créer un produit avec cette hiérarchie
    console.log('\n📦 ÉTAPE 2: CRÉATION D\'UN PRODUIT AVEC LA HIÉRARCHIE');

    const product = await prisma.product.create({
      data: {
        name: 'T-shirt Test Contrainte DB',
        description: 'T-shirt pour tester les contraintes de suppression en base de données',
        price: 25.99,
        stock: 100,
        status: 'PUBLISHED',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id,
        colorVariations: {
          create: {
            name: 'Blanc',
            colorCode: '#FFFFFF'
          }
        },
        sizes: {
          create: [
            { sizeName: 'M' },
            { sizeName: 'L' }
          ]
        }
      },
      include: {
        colorVariations: true,
        sizes: true
      }
    });
    console.log(`✅ Produit "${product.name}" créé avec ID: ${product.id}`);

    // Étape 3: Tester les suppressions (devraient échouer)
    console.log('\n🗑️  ÉTAPE 3: TEST DES SUPPRESSIONS (DEVRAIENT ÉCHOUER)');

    // Test 1: Essayer de supprimer la sous-catégorie
    console.log('\n➡️  Test 1: Tentative de suppression de la sous-catégorie...');
    try {
      await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log(`❌ ERREUR: La sous-catégorie "${subCategory.name}" a été supprimée - CE N'EST PAS NORMAL!`);
    } catch (error) {
      console.log(`✅ BON: La sous-catégorie "${subCategory.name}" ne peut pas être supprimée (Erreur: ${error.code})`);
    }

    // Test 2: Essayer de supprimer la variation
    console.log('\n➡️  Test 2: Tentative de suppression de la variation...');
    try {
      await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log(`❌ ERREUR: La variation "${variation.name}" a été supprimée - CE N'EST PAS NORMAL!`);
    } catch (error) {
      console.log(`✅ BON: La variation "${variation.name}" ne peut pas être supprimée (Erreur: ${error.code})`);
    }

    // Test 3: Essayer de supprimer la catégorie
    console.log('\n➡️  Test 3: Tentative de suppression de la catégorie...');
    try {
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log(`❌ ERREUR: La catégorie "${category.name}" a été supprimée - CE N'EST PAS NORMAL!`);
    } catch (error) {
      console.log(`✅ BON: La catégorie "${category.name}" ne peut pas être supprimée (Erreur: ${error.code})`);
    }

    // Étape 4: Nettoyage propre (suppression séquentielle)
    console.log('\n🧹 ÉTAPE 4: NETTOYAGE PROPRE (SUPPRESSION SÉQUENTIELLE)');

    // Supprimer le produit en premier
    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log(`✅ Produit "${product.name}" supprimé avec succès`);

    // Maintenant on devrait pouvoir supprimer la variation
    try {
      await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log(`✅ Variation "${variation.name}" supprimée avec succès`);
    } catch (error) {
      console.log(`❌ Impossible de supprimer la variation même après avoir supprimé le produit: ${error.message}`);
    }

    // Puis la sous-catégorie
    try {
      await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log(`✅ Sous-catégorie "${subCategory.name}" supprimée avec succès`);
    } catch (error) {
      console.log(`❌ Impossible de supprimer la sous-catégorie: ${error.message}`);
    }

    // Et enfin la catégorie
    try {
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log(`✅ Catégorie "${category.name}" supprimée avec succès`);
    } catch (error) {
      console.log(`❌ Impossible de supprimer la catégorie: ${error.message}`);
    }

    console.log('\n🏁 FIN DU TEST');
    console.log('\n📋 RÉSUMÉ:');
    console.log('- Si les suppressions des ÉTAPES 3 ont échoué: ✅ Les contraintes fonctionnent CORRECTEMENT');
    console.log('- Si les suppressions des ÉTAPES 3 ont réussi: ❌ Les contraintes NE fonctionnent PAS');
    console.log('- Le nettoyage de l\'ÉTAPE 4 devrait fonctionner séquentiellement');

  } catch (error) {
    console.error('❌ Erreur générale lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testDatabaseConstraints().catch(console.error);