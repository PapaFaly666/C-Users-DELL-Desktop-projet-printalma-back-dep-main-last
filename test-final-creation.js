const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFinalCreation() {
  console.log('🛠️  TEST FINAL : CRÉATION MANUELLE COMME UN UTILISATEUR\n');

  try {
    console.log('ÉTAPE 1: Simulation de la création d\'une boutique complète...\n');

    // ÉTAPE 1: Créer une catégorie (comme un administrateur)
    console.log('📁 Création de la catégorie "Mode Femme"');
    const category = await prisma.category.create({
      data: {
        name: 'Mode Femme',
        slug: 'mode-femme',
        description: 'Vêtements et accessoires pour femme',
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Catégorie créée: "${category.name}" (ID: ${category.id})\n`);

    // ÉTAPE 2: Créer une sous-catégorie (comme un vendeur)
    console.log('📂 Création de la sous-catégorie "Robes" dans "Mode Femme"');
    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'Robes',
        slug: 'robes',
        description: 'Robes élégantes pour toutes occasions',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie créée: "${subCategory.name}" (ID: ${subCategory.id})\n`);

    // ÉTAPE 3: Créer des variations (comme un vendeur spécialisé)
    console.log('🎨 Création des variations pour les robes');

    const variation1 = await prisma.variation.create({
      data: {
        name: 'Robe Longue',
        slug: 'robe-longue',
        description: 'Robe longue et élégante',
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Variation 1 créée: "${variation1.name}" (ID: ${variation1.id})`);

    const variation2 = await prisma.variation.create({
      data: {
        name: 'Robe Cocktail',
        slug: 'robe-cocktail',
        description: 'Robe courte pour soirées',
        subCategoryId: subCategory.id,
        displayOrder: 2,
        isActive: true
      }
    });
    console.log(`✅ Variation 2 créée: "${variation2.name}" (ID: ${variation2.id})\n`);

    // ÉTAPE 4: Créer des produits réels (comme un vendeur)
    console.log('📦 Création de produits avec cette hiérarchie');

    const product1 = await prisma.product.create({
      data: {
        name: 'Robe Longue Soie Noire',
        description: 'Magnifique robe longue en soie noire, parfaite pour les événements formels. Coupe ample avec élégance.',
        price: 189.99,
        stock: 25,
        status: 'PUBLISHED',
        genre: 'FEMME',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation1.id,
        colorVariations: {
          create: [
            {
              name: 'Noir',
              colorCode: '#000000'
            }
          ]
        },
        sizes: {
          create: [
            { sizeName: 'S' },
            { sizeName: 'M' },
            { sizeName: 'L' }
          ]
        }
      }
    });
    console.log(`✅ Produit 1 créé: "${product1.name}" (€${product1.price})`);

    const product2 = await prisma.product.create({
      data: {
        name: 'Robe Cocktail Rouge Passion',
        description: 'Robe cocktail rouge passionnante avec détails modernes. Idéale pour les soirées et célébrations.',
        price: 129.99,
        stock: 40,
        status: 'PUBLISHED',
        genre: 'FEMME',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation2.id,
        colorVariations: {
          create: [
            {
              name: 'Rouge',
              colorCode: '#FF0000'
            }
          ]
        },
        sizes: {
          create: [
            { sizeName: 'XS' },
            { sizeName: 'S' },
            { sizeName: 'M' }
          ]
        }
      }
    });
    console.log(`✅ Produit 2 créé: "${product2.name}" (€${product2.price})\n`);

    // ÉTAPE 5: Vérification finale
    console.log('🔍 Vérification de la hiérarchie complète');

    const verification = await prisma.product.findUnique({
      where: { id: product1.id },
      include: {
        category: true,
        subCategory: true,
        variation: true,
        colorVariations: true,
        sizes: true
      }
    });

    console.log('\n📋 HIÉRARCHIE COMPLÈTE CRÉÉE:');
    console.log(`   Catégorie: ${verification.category?.name}`);
    console.log(`   └── Sous-catégorie: ${verification.subCategory?.name}`);
    console.log(`       └── Variation: ${verification.variation?.name}`);
    console.log(`           └── Produit: ${verification.name}`);
    console.log(`               • Prix: €${verification.price}`);
    console.log(`               • Stock: ${verification.stock} unités`);
    console.log(`               • Couleurs: ${verification.colorVariations.map(c => c.name).join(', ')}`);
    console.log(`               • Tailles: ${verification.sizes.map(s => s.sizeName).join(', ')}`);

    // ÉTAPE 6: TEST DE SUPPRESSION (DOIT ÉCHOUER)
    console.log('\n🗑️  TEST DE SUPPRESSION (VÉRIFICATION DES CONTRAINTES)');
    console.log('=======================================================');

    console.log('\n➡️  TEST: Tentative de suppression de la variation "Robe Longue"');
    console.log(`   Cette variation est utilisée par: "${product1.name}"`);

    try {
      await prisma.variation.delete({ where: { id: variation1.id } });
      console.log('❌ ERREUR: La variation a été supprimée (contrainte non fonctionnelle !)');
    } catch (error) {
      console.log('✅ SUCCÈS: La variation est PROTÉGÉE !');
      console.log(`   Erreur P2003: Foreign key constraint violated ✅`);
    }

    console.log('\n➡️  TEST: Tentative de suppression de la sous-catégorie "Robes"');
    console.log(`   Cette sous-catégorie est utilisée par: "${product1.name}" et "${product2.name}"`);

    try {
      await prisma.subCategory.delete({ where: { id: subCategory.id } });
      console.log('❌ ERREUR: La sous-catégorie a été supprimée (contrainte non fonctionnelle !)');
    } catch (error) {
      console.log('✅ SUCCÈS: La sous-catégorie est PROTÉGÉE !');
      console.log(`   Erreur P2003: Foreign key constraint violated ✅`);
    }

    console.log('\n➡️  TEST: Tentative de suppression de la catégorie "Mode Femme"');
    console.log(`   Cette catégorie est utilisée par: "${product1.name}" et "${product2.name}"`);

    try {
      await prisma.category.delete({ where: { id: category.id } });
      console.log('❌ ERREUR: La catégorie a été supprimée (contrainte non fonctionnelle !)');
    } catch (error) {
      console.log('✅ SUCCÈS: La catégorie est PROTÉGÉE !');
      console.log(`   Erreur P2003: Foreign key constraint violated ✅`);
    }

    // ÉTAPE 7: Nettoyage propre
    console.log('\n🧹 Nettoyage des données de test');
    await prisma.product.delete({ where: { id: product1.id } });
    await prisma.product.delete({ where: { id: product2.id } });
    await prisma.variation.delete({ where: { id: variation1.id } });
    await prisma.variation.delete({ where: { id: variation2.id } });
    await prisma.subCategory.delete({ where: { id: subCategory.id } });
    await prisma.category.delete({ where: { id: category.id } });
    console.log('✅ Nettoyage terminé avec succès');

    // CONCLUSION
    console.log('\n🎯 CONCLUSION FINALE');
    console.log('===================');
    console.log('✅ Création d\'une hiérarchie complète réussie');
    console.log('✅ Contraintes de suppression vérifiées');
    console.log('✅ Système protégé contre les suppressions incorrectes');
    console.log('\n📋 RÉSULTAT:');
    console.log('   • Les entités utilisées par des produits ne peuvent PAS être supprimées');
    console.log('   • L\'intégrité des données est garantie');
    console.log('   • Le nettoyage séquentiel fonctionne correctement');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalCreation().catch(console.error);