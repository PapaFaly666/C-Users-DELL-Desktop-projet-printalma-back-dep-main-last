const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testContraintesCorrigees() {
  console.log('🔧 TEST DES CONTRAINTES APRÈS CORRECTION\n');

  try {
    // ÉTAPE 1: Créer une hiérarchie complète
    console.log('📁 ÉTAPE 1: Création de la hiérarchie de test');

    const category = await prisma.category.create({
      data: {
        name: 'Catégorie Test Corrigé',
        slug: 'categorie-test-corrige',
        description: 'Test après correction des contraintes',
        displayOrder: 9999,
        isActive: true
      }
    });
    console.log(`✅ Catégorie créée: "${category.name}" (ID: ${category.id})`);

    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'Sous-catégorie Test Corrigé',
        slug: 'sous-categorie-test-corrige',
        description: 'Test après correction',
        categoryId: category.id,
        displayOrder: 9999,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie créée: "${subCategory.name}" (ID: ${subCategory.id})`);

    const variation = await prisma.variation.create({
      data: {
        name: 'Variation Test Corrigé',
        slug: 'variation-test-corrige',
        description: 'Test après correction',
        subCategoryId: subCategory.id,
        displayOrder: 9999,
        isActive: true
      }
    });
    console.log(`✅ Variation créée: "${variation.name}" (ID: ${variation.id})`);

    // ÉTAPE 2: Créer un produit avec toutes les relations
    console.log('\n📦 ÉTAPE 2: Création d\'un produit avec la hiérarchie complète');

    const product = await prisma.product.create({
      data: {
        name: 'Produit Test Contraintes Corrigées',
        description: 'Produit pour tester les contraintes après correction',
        price: 39.99,
        stock: 75,
        status: 'PUBLISHED',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id,
        colorVariations: {
          create: {
            name: 'Rouge',
            colorCode: '#FF0000'
          }
        },
        sizes: {
          create: [
            { sizeName: 'S' },
            { sizeName: 'M' }
          ]
        }
      }
    });
    console.log(`✅ Produit créé: "${product.name}" (ID: ${product.id})`);
    console.log(`   🏷️  Catégorie: ${category.name} (ID: ${category.id})`);
    console.log(`   📂 Sous-catégorie: ${subCategory.name} (ID: ${subCategory.id})`);
    console.log(`   🎨 Variation: ${variation.name} (ID: ${variation.id})`);

    // Vérification des liaisons
    const productVerification = await prisma.product.findUnique({
      where: { id: product.id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        subCategoryId: true,
        variationId: true
      }
    });

    console.log('\n🔍 Vérification des liaisons:');
    console.log(`   categoryId: ${productVerification.categoryId} ✅`);
    console.log(`   subCategoryId: ${productVerification.subCategoryId} ✅`);
    console.log(`   variationId: ${productVerification.variationId} ✅`);

    // ÉTAPE 3: TESTS DE SUPPRESSION (doivent échouer maintenant)
    console.log('\n🗑️  ÉTAPE 3: TESTS DE SUPPRESSION (doivent échouer)');
    console.log('=====================================================');

    // Test 1: Tenter de supprimer la variation
    console.log('\n➡️  TEST 1: Suppression de la VARIATION');
    console.log(`   Tentative de suppression: "${variation.name}" utilisée par "${product.name}"`);
    console.log('   🚨 ATTENDU: Doit échouer avec erreur de contrainte');

    try {
      await prisma.variation.delete({ where: { id: variation.id } });
      console.log('   ❌ ÉCHEC DU TEST: La variation a été supprimée ! (PROBLÈME NON CORRIGÉ)');

      // Vérifier l'impact
      const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
      console.log(`   📊 Impact: variationId = ${productAfter.variationId} (devrait être ${variation.id})`);

    } catch (error) {
      console.log('   ✅ SUCCÈS: La variation est PROTÉGÉE !');
      console.log(`   ✅ Erreur: ${error.code}`);
      console.log(`   ✅ Message: ${error.message.split('\n')[0]}`);
    }

    // Test 2: Tenter de supprimer la sous-catégorie
    console.log('\n➡️  TEST 2: Suppression de la SOUS-CATÉGORIE');
    console.log(`   Tentative de suppression: "${subCategory.name}" utilisée par "${product.name}"`);
    console.log('   🚨 ATTENDU: Doit échouer avec erreur de contrainte');

    try {
      await prisma.subCategory.delete({ where: { id: subCategory.id } });
      console.log('   ❌ ÉCHEC DU TEST: La sous-catégorie a été supprimée ! (PROBLÈME NON CORRIGÉ)');

      // Vérifier l'impact
      const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
      console.log(`   📊 Impact: subCategoryId = ${productAfter.subCategoryId} (devrait être ${subCategory.id})`);

    } catch (error) {
      console.log('   ✅ SUCCÈS: La sous-catégorie est PROTÉGÉE !');
      console.log(`   ✅ Erreur: ${error.code}`);
      console.log(`   ✅ Message: ${error.message.split('\n')[0]}`);
    }

    // Test 3: Tenter de supprimer la catégorie
    console.log('\n➡️  TEST 3: Suppression de la CATÉGORIE');
    console.log(`   Tentative de suppression: "${category.name}" utilisée par "${product.name}"`);
    console.log('   🚨 ATTENDU: Doit échouer avec erreur de contrainte');

    try {
      await prisma.category.delete({ where: { id: category.id } });
      console.log('   ❌ ÉCHEC DU TEST: La catégorie a été supprimée ! (PROBLÈME NON CORRIGÉ)');

      // Vérifier l'impact
      const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
      console.log(`   📊 Impact: categoryId = ${productAfter.categoryId} (devrait être ${category.id})`);

    } catch (error) {
      console.log('   ✅ SUCCÈS: La catégorie est PROTÉGÉE !');
      console.log(`   ✅ Erreur: ${error.code}`);
      console.log(`   ✅ Message: ${error.message.split('\n')[0]}`);
    }

    // ÉTAPE 4: Test de suppression correct (produit d'abord)
    console.log('\n🧹 ÉTAPE 4: Test de suppression CORRECTE');
    console.log('   Processus: Produit → Variation → Sous-catégorie → Catégorie');

    try {
      // Supprimer le produit en premier
      await prisma.product.delete({ where: { id: product.id } });
      console.log('✅ Produit supprimé (étape 1/4)');

      // Maintenant la variation peut être supprimée
      await prisma.variation.delete({ where: { id: variation.id } });
      console.log('✅ Variation supprimée (étape 2/4)');

      // Puis la sous-catégorie
      await prisma.subCategory.delete({ where: { id: subCategory.id } });
      console.log('✅ Sous-catégorie supprimée (étape 3/4)');

      // Et enfin la catégorie
      await prisma.category.delete({ where: { id: category.id } });
      console.log('✅ Catégorie supprimée (étape 4/4)');

      console.log('\n🎉 NETTOYAGE COMPLET RÉUSSI !');

    } catch (error) {
      console.log(`❌ Erreur lors du nettoyage: ${error.message}`);
    }

    // CONCLUSION FINALE
    console.log('\n🎯 CONCLUSION FINALE DE LA CORRECTION');
    console.log('=====================================');
    console.log('');
    console.log('✅ TOUS LES TESTS DEVRAIENT AVOIR ÉCHOUÉ (suppressions protégées)');
    console.log('✅ SEUL LE NETTOYAGE SÉQUENTIEL DEVRAIT AVOIR RÉUSSI');
    console.log('');
    console.log('🔧 CORRECTION APPLIQUÉE:');
    console.log('   - category: onDelete: Restrict');
    console.log('   - subCategory: onDelete: Restrict');
    console.log('   - variation: onDelete: Restrict');
    console.log('');
    console.log('📋 RÉSULTAT ATTENDU:');
    console.log('   Aucune entité utilisée par un produit ne peut être supprimée');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContraintesCorrigees().catch(console.error);