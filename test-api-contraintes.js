const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'hamdouche.alami@gmail.com',
      password: 'Azerty@123'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    throw error;
  }
}

async function testAPIContraintes() {
  console.log('🌐 TEST DES CONTRAINTES VIA API REST\n');

  let token;
  try {
    token = await getAuthToken();
    console.log('✅ Authentification réussie');
  } catch (error) {
    console.log('❌ Impossible de s\'authentifier. Test arrêté.');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // ÉTAPE 1: Créer la hiérarchie via l'API
    console.log('\n📁 ÉTAPE 1: Création de la hiérarchie via API');

    // Créer la catégorie
    const categoryResponse = await axios.post(`${API_BASE}/categories`, {
      name: 'Vêtements API Test',
      slug: 'vetements-api-test',
      description: 'Catégorie pour test API des contraintes',
      displayOrder: 1,
      isActive: true
    }, { headers });

    const category = categoryResponse.data;
    console.log(`✅ Catégorie créée via API: "${category.name}" (ID: ${category.id})`);

    // Créer la sous-catégorie
    const subCategoryResponse = await axios.post(`${API_BASE}/sub-categories`, {
      name: 'T-shirts API Test',
      slug: 't-shirts-api-test',
      description: 'Sous-catégorie pour test API',
      categoryId: category.id,
      displayOrder: 1,
      isActive: true
    }, { headers });

    const subCategory = subCategoryResponse.data;
    console.log(`✅ Sous-catégorie créée via API: "${subCategory.name}" (ID: ${subCategory.id})`);

    // Créer la variation
    const variationResponse = await axios.post(`${API_BASE}/variations`, {
      name: 'Col Rond API Test',
      slug: 'col-rond-api-test',
      description: 'Variation pour test API',
      subCategoryId: subCategory.id,
      displayOrder: 1,
      isActive: true
    }, { headers });

    const variation = variationResponse.data;
    console.log(`✅ Variation créée via API: "${variation.name}" (ID: ${variation.id})`);

    console.log('\n📊 Hiérarchie API créée:');
    console.log(`   ${category.name} → ${subCategory.name} → ${variation.name}`);

    // ÉTAPE 2: Créer un produit via l'API
    console.log('\n📦 ÉTAPE 2: Création d\'un produit via API');

    const productResponse = await axios.post(`${API_BASE}/products`, {
      name: 'T-shirt Test API Contraintes',
      description: 'T-shirt créé via API pour tester les contraintes de suppression',
      price: 29.99,
      stock: 100,
      status: 'PUBLISHED',
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id,
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF'
        }
      ],
      sizes: ['M', 'L']
    }, { headers });

    const product = productResponse.data;
    console.log(`✅ Produit créé via API: "${product.name}" (ID: ${product.id})`);
    console.log(`   🏷️  Catégorie: ${product.categoryId} (${category.name})`);
    console.log(`   📂 Sous-catégorie: ${product.subCategoryId} (${subCategory.name})`);
    console.log(`   🎨 Variation: ${product.variationId} (${variation.name})`);

    // ÉTAPE 3: Vérifier que le produit est bien lié
    console.log('\n🔍 ÉTAPE 3: Vérification du produit créé');

    const productCheckResponse = await axios.get(`${API_BASE}/products/${product.id}`, { headers });
    const productCheck = productCheckResponse.data;

    console.log(`Produit vérifié: ${productCheck.name}`);
    console.log(`   - categoryId: ${productCheck.categoryId} (${productCheck.categoryId ? '✅ LIÉ' : '❌ NON LIÉ'})`);
    console.log(`   - subCategoryId: ${productCheck.subCategoryId} (${productCheck.subCategoryId ? '✅ LIÉ' : '❌ NON LIÉ'})`);
    console.log(`   - variationId: ${productCheck.variationId} (${productCheck.variationId ? '✅ LIÉ' : '❌ NON LIÉ'})`);

    // ÉTAPE 4: TESTS DE SUPPRESSION VIA API
    console.log('\n🗑️  ÉTAPE 4: TESTS DE SUPPRESSION VIA API');
    console.log('==========================================');

    // Test 1: Supprimer la variation utilisée par le produit
    console.log('\n➡️  TEST 1: Suppression de la VARIATION via API');
    console.log(`   URL: DELETE ${API_BASE}/variations/${variation.id}`);
    console.log(`   Variation: "${variation.name}" utilisée par le produit "${product.name}"`);
    console.log(`   🚨 ATTENDU: Devrait échouer car la variation est utilisée`);

    try {
      await axios.delete(`${API_BASE}/variations/${variation.id}`, { headers });
      console.log('   ❌ 🚨 PROBLÈME: La variation a été supprimée via API !');

      // Vérifier l'impact sur le produit
      const productAfterVariationDeletion = await axios.get(`${API_BASE}/products/${product.id}`, { headers });
      const updatedProduct = productAfterVariationDeletion.data;

      console.log('   📊 État du produit après suppression de la variation:');
      console.log(`      - variationId: ${updatedProduct.variationId} (devrait être ${variation.id})`);
      console.log(`      - État: ${updatedProduct.variationId === null ? '❌ PERDU' : '✅ CONSERVÉ'}`);

    } catch (error) {
      console.log('   ✅ BON: La variation est protégée par l\'API !');
      console.log(`   ✅ Statut: ${error.response?.status}`);
      console.log(`   ✅ Message: ${error.response?.data?.message || error.message}`);
    }

    // Test 2: Supprimer la sous-catégorie utilisée par le produit
    console.log('\n➡️  TEST 2: Suppression de la SOUS-CATÉGORIE via API');
    console.log(`   URL: DELETE ${API_BASE}/sub-categories/${subCategory.id}`);
    console.log(`   Sous-catégorie: "${subCategory.name}" utilisée par le produit "${product.name}"`);
    console.log(`   🚨 ATTENDU: Devrait échouer car la sous-catégorie est utilisée`);

    try {
      await axios.delete(`${API_BASE}/sub-categories/${subCategory.id}`, { headers });
      console.log('   ❌ 🚨 PROBLÈME: La sous-catégorie a été supprimée via API !');

      // Vérifier l'impact sur le produit
      const productAfterSubCategoryDeletion = await axios.get(`${API_BASE}/products/${product.id}`, { headers });
      const updatedProduct2 = productAfterSubCategoryDeletion.data;

      console.log('   📊 État du produit après suppression de la sous-catégorie:');
      console.log(`      - subCategoryId: ${updatedProduct2.subCategoryId} (devrait être ${subCategory.id})`);
      console.log(`      - État: ${updatedProduct2.subCategoryId === null ? '❌ PERDU' : '✅ CONSERVÉ'}`);

    } catch (error) {
      console.log('   ✅ BON: La sous-catégorie est protégée par l\'API !');
      console.log(`   ✅ Statut: ${error.response?.status}`);
      console.log(`   ✅ Message: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Supprimer la catégorie utilisée par le produit
    console.log('\n➡️  TEST 3: Suppression de la CATÉGORIE via API');
    console.log(`   URL: DELETE ${API_BASE}/categories/${category.id}`);
    console.log(`   Catégorie: "${category.name}" utilisée par le produit "${product.name}"`);
    console.log(`   🚨 ATTENDU: Devrait échouer car la catégorie est utilisée`);

    try {
      await axios.delete(`${API_BASE}/categories/${category.id}`, { headers });
      console.log('   ❌ 🚨 PROBLÈME: La catégorie a été supprimée via API !');

      // Vérifier l'impact sur le produit
      const productAfterCategoryDeletion = await axios.get(`${API_BASE}/products/${product.id}`, { headers });
      const updatedProduct3 = productAfterCategoryDeletion.data;

      console.log('   📊 État du produit après suppression de la catégorie:');
      console.log(`      - categoryId: ${updatedProduct3.categoryId} (devrait être ${category.id})`);
      console.log(`      - État: ${updatedProduct3.categoryId === null ? '❌ PERDU' : '✅ CONSERVÉ'}`);

    } catch (error) {
      console.log('   ✅ BON: La catégorie est protégée par l\'API !');
      console.log(`   ✅ Statut: ${error.response?.status}`);
      console.log(`   ✅ Message: ${error.response?.data?.message || error.message}`);
    }

    // ÉTAPE 5: Nettoyage via API (processus correct)
    console.log('\n🧹 ÉTAPE 5: Nettoyage via API (processus correct)');
    console.log('Suppression du produit en premier...');

    try {
      await axios.delete(`${API_BASE}/products/${product.id}`, { headers });
      console.log('✅ Produit supprimé via API (processus correct)');

      // Maintenant essayer de supprimer la hiérarchie
      try {
        await axios.delete(`${API_BASE}/variations/${variation.id}`, { headers });
        console.log('✅ Variation supprimée après suppression du produit');
      } catch (error) {
        console.log(`ℹ️  Variation: ${error.response?.data?.message || 'Déjà supprimée'}`);
      }

      try {
        await axios.delete(`${API_BASE}/sub-categories/${subCategory.id}`, { headers });
        console.log('✅ Sous-catégorie supprimée');
      } catch (error) {
        console.log(`ℹ️  Sous-catégorie: ${error.response?.data?.message || 'Déjà supprimée'}`);
      }

      try {
        await axios.delete(`${API_BASE}/categories/${category.id}`, { headers });
        console.log('✅ Catégorie supprimée');
      } catch (error) {
        console.log(`ℹ️  Catégorie: ${error.response?.data?.message || 'Déjà supprimée'}`);
      }

    } catch (error) {
      console.log(`❌ Erreur lors du nettoyage: ${error.response?.data?.message || error.message}`);
    }

    // CONCLUSION FINALE
    console.log('\n🎯 CONCLUSION DU TEST API');
    console.log('=========================');
    console.log('');
    console.log('Ce test simule un cas d\'usage réel via l\'API REST.');
    console.log('');
    console.log('📋 COMPORTEMENT ATTENDU:');
    console.log('   • Les entités utilisées par des produits ne doivent PAS pouvoir être supprimées');
    console.log('   • L\'API doit retourner une erreur 400/409/500');
    console.log('');
    console.log('🚨 SI LES SUPPRESSIONS ONT RÉUSSI: PROBLÈME CRITIQUE DE SÉCURITÉ API');
    console.log('✅ SI LES SUPPRESSIONS ONT ÉCHOUÉ: API SÉCURISÉE CORRECTEMENT');
    console.log('');
    console.log('🔍 TEST EFFECTUÉ: Création → Liaison → Tentatives de suppression → Vérification');

  } catch (error) {
    console.error('❌ Erreur générale lors du test API:', error.response?.data || error.message);
  }
}

// Exécuter le test
testAPIContraintes().catch(console.error);