const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalyseCompleteContraintes() {
  console.log('🔍 ANALYSE COMPLÈTE DES CONTRAINTES DE SUPPRESSION\n');

  try {
    // ÉTAPE 1: Analyser la structure existante
    console.log('📊 ÉTAPE 1: Analyse des données existantes');

    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            variations: true,
            products: true
          }
        },
        directProducts: true,
        products: true
      }
    });

    console.log(`Trouvé ${categories.length} catégories:`);

    for (const cat of categories.slice(0, 3)) {
      console.log(`\n📁 Catégorie: "${cat.name}" (ID: ${cat.id})`);
      console.log(`   - Sous-catégories: ${cat.subCategories.length}`);
      console.log(`   - Produits directs (relation directProducts): ${cat.directProducts.length}`);
      console.log(`   - Produits (relation products): ${cat.products.length}`);

      // Analyser les sous-catégories
      for (const subCat of cat.subCategories.slice(0, 2)) {
        console.log(`   📂 Sous-catégorie: "${subCat.name}" (ID: ${subCat.id})`);
        console.log(`      - Variations: ${subCat.variations.length}`);
        console.log(`      - Produits: ${subCat.products.length}`);

        // Analyser les variations
        for (const variation of subCat.variations.slice(0, 2)) {
          console.log(`   🎨 Variation: "${variation.name}" (ID: ${variation.id})`);
          const variationProducts = await prisma.product.count({
            where: { variationId: variation.id }
          });
          console.log(`      - Produits utilisant cette variation: ${variationProducts}`);
        }
      }
    }

    // ÉTAPE 2: Test systématique des suppressions
    console.log('\n🗑️  ÉTAPE 2: Tests systématiques de suppression');

    // Cherchons une catégorie avec différentes configurations
    let categoryToTest = null;
    let subCategoryToTest = null;
    let variationToTest = null;

    // Chercher une configuration avec tous les niveaux
    for (const cat of categories) {
      for (const subCat of cat.subCategories) {
        if (subCat.variations.length > 0 && subCat.products.length > 0) {
          const variation = subCat.variations[0];
          const variationProducts = await prisma.product.count({
            where: { variationId: variation.id }
          });

          if (variationProducts > 0) {
            categoryToTest = cat;
            subCategoryToTest = subCat;
            variationToTest = variation;
            break;
          }
        }
      }
      if (categoryToTest) break;
    }

    if (!categoryToTest) {
      console.log('⚠️  Aucune configuration complète trouvée. Créons des données de test...');

      // Créer une hiérarchie complète
      categoryToTest = await prisma.category.create({
        data: {
          name: 'Catégorie Test Analyse',
          slug: 'categorie-test-analyse',
          description: 'Test analyse complète',
          displayOrder: 9999,
          isActive: true
        }
      });

      subCategoryToTest = await prisma.subCategory.create({
        data: {
          name: 'Sous-catégorie Test Analyse',
          slug: 'sous-categorie-test-analyse',
          description: 'Test analyse complète',
          categoryId: categoryToTest.id,
          displayOrder: 9999,
          isActive: true
        }
      });

      variationToTest = await prisma.variation.create({
        data: {
          name: 'Variation Test Analyse',
          slug: 'variation-test-analyse',
          description: 'Test analyse complète',
          subCategoryId: subCategoryToTest.id,
          displayOrder: 9999,
          isActive: true
        }
      });

      // Créer des produits avec différentes relations
      console.log('📦 Création de produits test...');

      // Produit 1: Toutes les relations
      const product1 = await prisma.product.create({
        data: {
          name: 'Produit Test Complet',
          description: 'Test avec toutes les relations',
          price: 29.99,
          stock: 50,
          status: 'PUBLISHED',
          categoryId: categoryToTest.id,
          subCategoryId: subCategoryToTest.id,
          variationId: variationToTest.id
        }
      });

      // Produit 2: Seulement catégorie et sous-catégorie
      const product2 = await prisma.product.create({
        data: {
          name: 'Produit Test Partiel',
          description: 'Test sans variation',
          price: 19.99,
          stock: 30,
          status: 'PUBLISHED',
          categoryId: categoryToTest.id,
          subCategoryId: subCategoryToTest.id
        }
      });

      // Produit 3: Seulement catégorie
      const product3 = await prisma.product.create({
        data: {
          name: 'Produit Test Catégorie Seule',
          description: 'Test avec seulement catégorie',
          price: 15.99,
          stock: 20,
          status: 'PUBLISHED',
          categoryId: categoryToTest.id
        }
      });

      console.log(`✅ 3 produits créés avec différentes configurations`);
    }

    console.log(`\n🎯 Configuration de test trouvée/créée:`);
    console.log(`   Catégorie: "${categoryToTest.name}" (ID: ${categoryToTest.id})`);
    console.log(`   Sous-catégorie: "${subCategoryToTest.name}" (ID: ${subCategoryToTest.id})`);
    console.log(`   Variation: "${variationToTest.name}" (ID: ${variationToTest.id})`);

    // Compter les produits liés
    const productsWithVariation = await prisma.product.count({
      where: { variationId: variationToTest.id }
    });
    const productsWithSubCategory = await prisma.product.count({
      where: { subCategoryId: subCategoryToTest.id }
    });
    const productsWithCategory = await prisma.product.count({
      where: { categoryId: categoryToTest.id }
    });

    console.log(`   Produits liés:`);
    console.log(`      - À la variation: ${productsWithVariation}`);
    console.log(`      - À la sous-catégorie: ${productsWithSubCategory}`);
    console.log(`      - À la catégorie: ${productsWithCategory}`);

    // ÉTAPE 3: Tests de suppression individuels
    console.log('\n🧪 ÉTAPE 3: Tests de suppression individuels');

    // Test 1: Supprimer la variation
    console.log('\n➡️  TEST 1: Suppression de la VARIATION');
    try {
      await prisma.variation.delete({ where: { id: variationToTest.id } });
      console.log('❌ VARIATION SUPPRIMÉE (PROBLÈME !)');

      const remainingProducts = await prisma.product.count({
        where: { variationId: variationToTest.id }
      });
      console.log(`   Produits avec variationId null: ${productsWithVariation - remainingProducts}`);

    } catch (error) {
      console.log('✅ VARIATION PROTÉGÉE (CORRECT !)');
      console.log(`   Erreur: ${error.code} - ${error.message.split('\n')[0]}`);
    }

    // Test 2: Supprimer la sous-catégorie
    console.log('\n➡️  TEST 2: Suppression de la SOUS-CATÉGORIE');
    try {
      await prisma.subCategory.delete({ where: { id: subCategoryToTest.id } });
      console.log('❌ SOUS-CATÉGORIE SUPPRIMÉE (PROBLÈME !)');

      const remainingProducts = await prisma.product.count({
        where: { subCategoryId: subCategoryToTest.id }
      });
      console.log(`   Produits avec subCategoryId null: ${productsWithSubCategory - remainingProducts}`);

    } catch (error) {
      console.log('✅ SOUS-CATÉGORIE PROTÉGÉE (CORRECT !)');
      console.log(`   Erreur: ${error.code} - ${error.message.split('\n')[0]}`);
    }

    // Test 3: Supprimer la catégorie
    console.log('\n➡️  TEST 3: Suppression de la CATÉGORIE');
    try {
      await prisma.category.delete({ where: { id: categoryToTest.id } });
      console.log('❌ CATÉGORIE SUPPRIMÉE (PROBLÈME !)');

      const remainingProducts = await prisma.product.count({
        where: { categoryId: categoryToTest.id }
      });
      console.log(`   Produits avec categoryId null: ${productsWithCategory - remainingProducts}`);

    } catch (error) {
      console.log('✅ CATÉGORIE PROTÉGÉE (CORRECT !)');
      console.log(`   Erreur: ${error.code} - ${error.message.split('\n')[0]}`);
    }

    // ÉTAPE 4: Nettoyage
    console.log('\n🧹 ÉTAPE 4: Nettoyage des données de test');

    // Supprimer les produits d'abord
    const productsToDelete = await prisma.product.findMany({
      where: {
        OR: [
          { categoryId: categoryToTest.id },
          { subCategoryId: subCategoryToTest.id },
          { variationId: variationToTest.id }
        ]
      }
    });

    for (const product of productsToDelete) {
      await prisma.product.delete({ where: { id: product.id } });
    }
    console.log(`✅ ${productsToDelete.length} produits supprimés`);

    // Maintenant supprimer la hiérarchie
    try {
      await prisma.variation.delete({ where: { id: variationToTest.id } });
      await prisma.subCategory.delete({ where: { id: subCategoryToTest.id } });
      await prisma.category.delete({ where: { id: categoryToTest.id } });
      console.log('✅ Hiérarchie supprimée avec succès');
    } catch (error) {
      console.log(`ℹ️  Certaines entités déjà supprimées ou erreurs: ${error.message}`);
    }

    console.log('\n🎯 CONCLUSION FINALE');
    console.log('===================');
    console.log('Ce test analyse en détail quelles contraintes fonctionnent réellement.');
    console.log('Les résultats montrent la complexité des relations dans le système actuel.');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalyseCompleteContraintes().catch(console.error);