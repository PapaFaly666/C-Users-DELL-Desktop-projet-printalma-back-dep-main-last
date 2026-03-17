const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectAPIContraintes() {
  console.log('🚀 TEST DIRECT DES CONTRAINTES SANS AUTHENTIFICATION\n');

  try {
    // Testons si on peut vérifier directement les endpoints de suppression
    console.log('🔍 ÉTAPE 1: Vérification des routes disponibles');

    // D'abord, vérifions s'il existe déjà des données à tester
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            variations: true
          }
        },
        products: true
      }
    });

    console.log(`📊 Données existantes: ${categories.length} catégories trouvées`);

    // Cherchons une catégorie avec des produits
    let categoryWithProducts = null;
    for (const cat of categories) {
      if (cat.products.length > 0) {
        categoryWithProducts = cat;
        break;
      }
    }

    if (categoryWithProducts) {
      console.log(`✅ Catégorie trouvée avec des produits: "${categoryWithProducts.name}" (${categoryWithProducts.products.length} produits)`);

      // Testons directement la suppression via Prisma pour simuler l'API
      console.log('\n🗑️  TEST: Tentative de suppression de catégorie avec produits');

      try {
        await prisma.category.delete({
          where: { id: categoryWithProducts.id }
        });
        console.log('❌ PROBLÈME: Catégorie supprimée malgré les produits liés !');

        // Vérifions l'impact sur les produits
        const productsAfter = await prisma.product.findMany({
          where: { categoryId: categoryWithProducts.id }
        });

        console.log(`📊 Produits affectés: ${productsAfter.length} produits avec categoryId null`);
        productsAfter.forEach(p => {
          console.log(`   - Produit: ${p.name} (categoryId: ${p.categoryId})`);
        });

      } catch (error) {
        console.log('✅ BON: La catégorie est protégée contre la suppression !');
        console.log(`   Erreur: ${error.code} - ${error.message}`);
      }

    } else {
      console.log('ℹ️  Aucune catégorie avec des produits trouvée. Créons un test complet...');

      // Créons un test complet comme avant
      console.log('\n📁 Création de données de test...');

      const category = await prisma.category.create({
        data: {
          name: 'Catégorie Test API Simple',
          slug: 'categorie-test-api-simple',
          description: 'Test simple des contraintes API',
          displayOrder: 999,
          isActive: true
        }
      });

      const subCategory = await prisma.subCategory.create({
        data: {
          name: 'Sous-catégorie Test API Simple',
          slug: 'sous-categorie-test-api-simple',
          description: 'Test simple',
          categoryId: category.id,
          displayOrder: 999,
          isActive: true
        }
      });

      const variation = await prisma.variation.create({
        data: {
          name: 'Variation Test API Simple',
          slug: 'variation-test-api-simple',
          description: 'Test simple',
          subCategoryId: subCategory.id,
          displayOrder: 999,
          isActive: true
        }
      });

      const product = await prisma.product.create({
        data: {
          name: 'Produit Test API Simple',
          description: 'Produit pour test API simple',
          price: 19.99,
          stock: 50,
          status: 'PUBLISHED',
          categoryId: category.id,
          subCategoryId: subCategory.id,
          variationId: variation.id
        }
      });

      console.log(`✅ Hiérarchie créée: ${category.name} → ${subCategory.name} → ${variation.name}`);
      console.log(`✅ Produit créé: ${product.name}`);

      // Maintenant testons les suppressions
      console.log('\n🗑️  TESTS DE SUPPRESSION:');

      // Test variation
      try {
        await prisma.variation.delete({ where: { id: variation.id } });
        console.log('❌ Variation supprimée (PROBLÈME !)');

        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`   variationId après suppression: ${updatedProduct.variationId}`);

      } catch (error) {
        console.log('✅ Variation protégée (CORRECT !)');
      }

      // Test sous-catégorie
      try {
        await prisma.subCategory.delete({ where: { id: subCategory.id } });
        console.log('❌ Sous-catégorie supprimée (PROBLÈME !)');

        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`   subCategoryId après suppression: ${updatedProduct.subCategoryId}`);

      } catch (error) {
        console.log('✅ Sous-catégorie protégée (CORRECT !)');
      }

      // Test catégorie
      try {
        await prisma.category.delete({ where: { id: category.id } });
        console.log('❌ Catégorie supprimée (PROBLÈME !)');

        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`   categoryId après suppression: ${updatedProduct.categoryId}`);

      } catch (error) {
        console.log('✅ Catégorie protégée (CORRECT !)');
      }

      // Nettoyage
      console.log('\n🧹 Nettoyage...');
      await prisma.product.delete({ where: { id: product.id } });

      try { await prisma.variation.delete({ where: { id: variation.id } }); } catch {}
      try { await prisma.subCategory.delete({ where: { id: subCategory.id } }); } catch {}
      try { await prisma.category.delete({ where: { id: category.id } }); } catch {}

      console.log('✅ Nettoyage terminé');
    }

    console.log('\n🎯 CONCLUSION');
    console.log('Ce test direct confirme le comportement des contraintes de suppression.');
    console.log('Si les suppressions ont réussi: ❌ PROBLÈME DE SÉCURITÉ DES DONNÉES');
    console.log('Si les suppressions ont échoué: ✅ CONTRAINTES FONCTIONNELLES');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectAPIContraintes().catch(console.error);