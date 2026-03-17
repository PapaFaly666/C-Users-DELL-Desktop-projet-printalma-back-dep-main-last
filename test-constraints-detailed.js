const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDetailedConstraints() {
  console.log('🔍 TEST DÉTAILLÉ DES CONTRAINTES\n');

  try {
    // Créer une hiérarchie complète
    console.log('📁 Création de la hiérarchie...');

    const category = await prisma.category.create({
      data: {
        name: 'Catégorie Test Détaillé',
        slug: 'categorie-test-detaille',
        description: 'Test détaillé des contraintes',
        displayOrder: 1,
        isActive: true
      }
    });

    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'Sous-catégorie Test Détaillé',
        slug: 'sous-categorie-test-detaille',
        description: 'Test détaillé des contraintes',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });

    const variation = await prisma.variation.create({
      data: {
        name: 'Variation Test Détaillé',
        slug: 'variation-test-detaille',
        description: 'Test détaillé des contraintes',
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });

    console.log(`✅ Hiérarchie créée: Catégorie(${category.id}) → Sous-catégorie(${subCategory.id}) → Variation(${variation.id})`);

    // Créer un produit avec toutes les relations
    console.log('\n📦 Création d\'un produit avec la hiérarchie complète...');

    const product = await prisma.product.create({
      data: {
        name: 'Produit Test Détaillé',
        description: 'Produit pour test détaillé',
        price: 29.99,
        stock: 50,
        status: 'PUBLISHED',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id
      }
    });

    console.log(`✅ Produit créé: ${product.name} (ID: ${product.id})`);
    console.log(`   - categoryId: ${product.categoryId}`);
    console.log(`   - subCategoryId: ${product.subCategoryId}`);
    console.log(`   - variationId: ${product.variationId}`);

    // État des lieux avant suppression
    console.log('\n📊 État des lieux avant suppression:');
    const countsBefore = await Promise.all([
      prisma.category.count(),
      prisma.subCategory.count(),
      prisma.variation.count(),
      prisma.product.count()
    ]);
    console.log(`   Categories: ${countsBefore[0]}`);
    console.log(`   SubCategories: ${countsBefore[1]}`);
    console.log(`   Variations: ${countsBefore[2]}`);
    console.log(`   Products: ${countsBefore[3]}`);

    // Test 1: Suppression de la variation
    console.log('\n🗑️  Test 1: Suppression de la variation...');
    try {
      await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log('❌ VARIATION SUPPRIMÉE - PROBLÈME !');

      // Vérifier l'état du produit après suppression
      const productAfterVariationDeletion = await prisma.product.findUnique({
        where: { id: product.id }
      });
      console.log(`   Produit après suppression variation:`);
      console.log(`   - categoryId: ${productAfterVariationDeletion.categoryId}`);
      console.log(`   - subCategoryId: ${productAfterVariationDeletion.subCategoryId}`);
      console.log(`   - variationId: ${productAfterVariationDeletion.variationId} (devrait être null)`);

    } catch (error) {
      console.log(`✅ VARIATION PROTÉGÉE - Erreur: ${error.code} - ${error.meta?.field_name || ''}`);
    }

    // Test 2: Suppression de la sous-catégorie
    console.log('\n🗑️  Test 2: Suppression de la sous-catégorie...');
    try {
      await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log('❌ SOUS-CATÉGORIE SUPPRIMÉE - PROBLÈME !');

      // Vérifier l'état du produit après suppression
      const productAfterSubCategoryDeletion = await prisma.product.findUnique({
        where: { id: product.id }
      });
      console.log(`   Produit après suppression sous-catégorie:`);
      console.log(`   - categoryId: ${productAfterSubCategoryDeletion.categoryId}`);
      console.log(`   - subCategoryId: ${productAfterSubCategoryDeletion.subCategoryId} (devrait être null)`);
      console.log(`   - variationId: ${productAfterSubCategoryDeletion.variationId}`);

    } catch (error) {
      console.log(`✅ SOUS-CATÉGORIE PROTÉGÉE - Erreur: ${error.code} - ${error.meta?.field_name || ''}`);
    }

    // Test 3: Suppression de la catégorie
    console.log('\n🗑️  Test 3: Suppression de la catégorie...');
    try {
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log('❌ CATÉGORIE SUPPRIMÉE - PROBLÈME !');

      // Vérifier l'état du produit après suppression
      const productAfterCategoryDeletion = await prisma.product.findUnique({
        where: { id: product.id }
      });
      console.log(`   Produit après suppression catégorie:`);
      console.log(`   - categoryId: ${productAfterCategoryDeletion.categoryId} (devrait être null)`);
      console.log(`   - subCategoryId: ${productAfterCategoryDeletion.subCategoryId}`);
      console.log(`   - variationId: ${productAfterCategoryDeletion.variationId}`);

    } catch (error) {
      console.log(`✅ CATÉGORIE PROTÉGÉE - Erreur: ${error.code} - ${error.meta?.field_name || ''}`);
    }

    // Nettoyage final
    console.log('\n🧹 Nettoyage final...');
    await prisma.product.delete({ where: { id: product.id } });

    // Tenter de supprimer ce qui reste
    try {
      await prisma.variation.delete({ where: { id: variation.id } });
      console.log('✅ Variation supprimée après suppression du produit');
    } catch (error) {
      console.log(`❌ Variation impossible à supprimer: ${error.message}`);
    }

    try {
      await prisma.subCategory.delete({ where: { id: subCategory.id } });
      console.log('✅ Sous-catégorie supprimée');
    } catch (error) {
      console.log(`❌ Sous-catégorie impossible à supprimer: ${error.message}`);
    }

    try {
      await prisma.category.delete({ where: { id: category.id } });
      console.log('✅ Catégorie supprimée');
    } catch (error) {
      console.log(`❌ Catégorie impossible à supprimer: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDetailedConstraints().catch(console.error);