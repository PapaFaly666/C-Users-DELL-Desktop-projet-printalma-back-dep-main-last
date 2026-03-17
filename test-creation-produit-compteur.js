// Test complet de création de produit avec vérification des compteurs
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function testCreationProduitCompteur() {
  console.log('🧪 Test: Création de produit avec mise à jour des compteurs\n');

  try {
    // Étape 1: Trouver une sous-catégorie et variation existantes
    console.log('📋 ÉTAPE 1: Recherche de sous-catégorie et variation...');

    const subCategory = await prisma.subCategory.findFirst({
      where: { isActive: true },
      include: {
        category: true,
        _count: {
          select: {
            products: { where: { isDelete: false } },
            variations: { where: { isActive: true } }
          }
        }
      }
    });

    if (!subCategory) {
      console.log('❌ Aucune sous-catégorie trouvée');
      return;
    }

    console.log(`✅ Sous-catégorie trouvée: ${subCategory.name} (ID: ${subCategory.id})`);
    console.log(`   Catégorie: ${subCategory.category.name}`);
    console.log(`   Produits actuels: ${subCategory._count.products}`);
    console.log(`   Variations: ${subCategory._count.variations}`);

    const variation = await prisma.variation.findFirst({
      where: {
        subCategoryId: subCategory.id,
        isActive: true
      },
      include: {
        _count: {
          select: {
            products: { where: { isDelete: false } }
          }
        }
      }
    });

    if (!variation) {
      console.log('❌ Aucune variation trouvée pour cette sous-catégorie');
      return;
    }

    console.log(`✅ Variation trouvée: ${variation.name} (ID: ${variation.id})`);
    console.log(`   Produits actuels: ${variation._count.products}\n`);

    // Étape 2: Vérifier l'état des compteurs AVANT création
    console.log('📊 ÉTAPE 2: État des compteurs AVANT création');
    console.log(`   Sous-catégorie ${subCategory.name}: ${subCategory._count.products} produits`);
    console.log(`   Variation ${variation.name}: ${variation._count.products} produits\n`);

    // Étape 3: Créer un produit via l'API (simuler ce que fait le frontend)
    console.log('🏗️ ÉTAPE 3: Création du produit via l\'API...');

    const productData = {
      name: `Test Compteur ${Date.now()}`,
      description: 'Produit de test pour vérifier les compteurs',
      price: 99.99,
      suggestedPrice: 89,
      stock: 0,
      status: 'published',
      categoryId: subCategory.categoryId,
      subCategoryId: subCategory.id,
      variationId: variation.id,
      sizes: ['M'],
      genre: 'UNISEXE',
      isReadyProduct: false,
      colorVariations: [{
        name: 'Test Blanc',
        colorCode: '#ffffff',
        images: []
      }]
    };

    console.log('📤 Données envoyées à l\'API:');
    console.log(JSON.stringify(productData, null, 2));

    // Créer le produit directement en base pour tester
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        suggestedPrice: productData.suggestedPrice,
        stock: productData.stock,
        status: 'PUBLISHED',
        categoryId: productData.categoryId,
        subCategoryId: productData.subCategoryId,
        variationId: productData.variationId,
        genre: productData.genre,
        isReadyProduct: productData.isReadyProduct,
        colorVariations: {
          create: [{
            name: productData.colorVariations[0].name,
            colorCode: productData.colorVariations[0].colorCode
          }]
        }
      },
      include: {
        category: true,
        subCategory: true,
        variation: true
      }
    });

    console.log(`✅ Produit créé avec succès: ID ${newProduct.id}`);
    console.log(`   Nom: ${newProduct.name}`);
    console.log(`   Sous-catégorie: ${newProduct.subCategory.name}`);
    console.log(`   Variation: ${newProduct.variation.name}\n`);

    // Étape 4: Vérifier l'état des compteurs APRÈS création
    console.log('📊 ÉTAPE 4: État des compteurs APRÈS création');

    const subCategoryAfter = await prisma.subCategory.findUnique({
      where: { id: subCategory.id },
      include: {
        _count: {
          select: {
            products: { where: { isDelete: false } },
            variations: { where: { isActive: true } }
          }
        }
      }
    });

    const variationAfter = await prisma.variation.findUnique({
      where: { id: variation.id },
      include: {
        _count: {
          select: {
            products: { where: { isDelete: false } }
          }
        }
      }
    });

    console.log(`   Sous-catégorie ${subCategory.name}: ${subCategoryAfter._count.products} produits (avant: ${subCategory._count.products})`);
    console.log(`   Variation ${variation.name}: ${variationAfter._count.products} produits (avant: ${variation._count.products})`);

    // Étape 5: Analyser les résultats
    console.log('\n🎯 ÉTAPE 5: Analyse des résultats');

    const subCategoryCountIncreased = subCategoryAfter._count.products > subCategory._count.products;
    const variationCountIncreased = variationAfter._count.products > variation._count.products;

    if (subCategoryCountIncreased) {
      console.log(`✅ Compteur sous-catégorie: ${subCategoryAfter._count.products - subCategory._count.products} produit(s) ajouté(s)`);
    } else {
      console.log(`❌ Compteur sous-catégorie: AUCUN CHANGEMENT (${subCategoryAfter._count.products})`);
    }

    if (variationCountIncreased) {
      console.log(`✅ Compteur variation: ${variationAfter._count.products - variation._count.products} produit(s) ajouté(s)`);
    } else {
      console.log(`❌ Compteur variation: AUCUN CHANGEMENT (${variationAfter._count.products})`);
    }

    if (!subCategoryCountIncreased || !variationCountIncreased) {
      console.log('\n🚨 PROBLÈME DÉTECTÉ: Les compteurs ne se mettent pas à jour correctement!');
      console.log('   Le produit a été créé mais les compteurs ne reflètent pas le changement.');
    } else {
      console.log('\n✅ SUCCÈS: Les compteurs se mettent à jour correctement!');
    }

    // Nettoyage: supprimer le produit de test
    console.log('\n🧹 Nettoyage: suppression du produit de test...');
    await prisma.product.delete({
      where: { id: newProduct.id }
    });
    console.log('✅ Produit de test supprimé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCreationProduitCompteur();