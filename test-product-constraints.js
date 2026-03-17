const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'hamdouche.alami@gmail.com',
      password: 'Azerty@123'
    });

    console.log('✅ Connexion réussie');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    throw error;
  }
}

async function createCategory(token, name) {
  try {
    const response = await axios.post(`${API_BASE}/categories`, {
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Description pour ${name}`,
      displayOrder: 1,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Catégorie "${name}" créée avec ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur création catégorie "${name}":`, error.response?.data || error.message);
    throw error;
  }
}

async function createSubCategory(token, name, categoryId) {
  try {
    const response = await axios.post(`${API_BASE}/sub-categories`, {
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Description pour ${name}`,
      categoryId: categoryId,
      displayOrder: 1,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Sous-catégorie "${name}" créée avec ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur création sous-catégorie "${name}":`, error.response?.data || error.message);
    throw error;
  }
}

async function createVariation(token, name, subCategoryId) {
  try {
    const response = await axios.post(`${API_BASE}/variations`, {
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Description pour ${name}`,
      subCategoryId: subCategoryId,
      displayOrder: 1,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Variation "${name}" créée avec ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur création variation "${name}":`, error.response?.data || error.message);
    throw error;
  }
}

async function createProduct(token, productData) {
  try {
    const response = await axios.post(`${API_BASE}/products`, productData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Produit "${productData.name}" créé avec ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur création produit "${productData.name}":`, error.response?.data || error.message);
    throw error;
  }
}

async function deleteEntity(token, entityType, entityId, entityName) {
  try {
    await axios.delete(`${API_BASE}/${entityType}/${entityId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`❌ ERREUR: La ${entityType} "${entityName}" (ID: ${entityId}) a été supprimée - CE N'EST PAS NORMAL!`);
    return true;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 409 || error.response?.status === 500) {
      console.log(`✅ BON: La ${entityType} "${entityName}" (ID: ${entityId}) ne peut pas être supprimée car elle est utilisée par un produit`);
      return false;
    } else {
      console.error(`❌ Erreur inattendue lors de la suppression de la ${entityType}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

async function testProductConstraints() {
  console.log('🚀 DÉBUT DU TEST DE CONTRAINTES DE PRODUIT\n');

  let token;
  try {
    token = await login();
  } catch (error) {
    console.log('❌ Impossible de se connecter. Arrêt du test.');
    return;
  }

  // Étape 1: Créer la hiérarchie complète
  console.log('\n📁 ÉTAPE 1: CRÉATION DE LA HIÉRARCHIE DE CATÉGORIES');

  let category, subCategory, variation, product;

  try {
    // Créer une catégorie
    category = await createCategory(token, 'Vêtements de Test');

    // Créer une sous-catégorie
    subCategory = await createSubCategory(token, 'T-shirts de Test', category.id);

    // Créer une variation
    variation = await createVariation(token, 'Col rond de Test', subCategory.id);

  } catch (error) {
    console.log('❌ Erreur lors de la création de la hiérarchie. Arrêt du test.');
    return;
  }

  // Étape 2: Créer un produit avec cette hiérarchie
  console.log('\n📦 ÉTAPE 2: CRÉATION D\'UN PRODUIT AVEC LA HIÉRARCHIE');

  try {
    product = await createProduct(token, {
      name: 'T-shirt Test Contrainte',
      description: 'T-shirt pour tester les contraintes de suppression',
      price: 25.99,
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
    });

  } catch (error) {
    console.log('❌ Erreur lors de la création du produit. Arrêt du test.');
    return;
  }

  // Étape 3: Tester les suppressions
  console.log('\n🗑️  ÉTAPE 3: TEST DES SUPPRESSIONS (DEVRAIENT ÉCHOUER)');

  // Test 1: Essayer de supprimer la sous-catégorie
  console.log('\n➡️  Test 1: Tentative de suppression de la sous-catégorie...');
  await deleteEntity(token, 'sub-categories', subCategory.id, subCategory.name);

  // Test 2: Essayer de supprimer la variation
  console.log('\n➡️  Test 2: Tentative de suppression de la variation...');
  await deleteEntity(token, 'variations', variation.id, variation.name);

  // Test 3: Essayer de supprimer la catégorie
  console.log('\n➡️  Test 3: Tentative de suppression de la catégorie...');
  await deleteEntity(token, 'categories', category.id, category.name);

  // Étape 4: Nettoyage propre (supprimer le produit d'abord)
  console.log('\n🧹 ÉTAPE 4: NETTOYAGE PROPRE (SUPPRESSION SÉQUENTIELLE)');

  try {
    // Supprimer le produit en premier
    await axios.delete(`${API_BASE}/products/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Produit "${product.name}" supprimé avec succès`);

    // Maintenant on devrait pouvoir supprimer la variation
    await deleteEntity(token, 'variations', variation.id, variation.name);

    // Puis la sous-catégorie
    await deleteEntity(token, 'sub-categories', subCategory.id, subCategory.name);

    // Et enfin la catégorie
    await deleteEntity(token, 'categories', category.id, category.name);

  } catch (error) {
    console.log('❌ Erreur lors du nettoyage:', error.response?.data || error.message);
  }

  console.log('\n🏁 FIN DU TEST');
  console.log('\n📋 RÉSUMÉ:');
  console.log('- Si les suppressions des ÉTAPES 3 ont échoué: ✅ Les contraintes fonctionnent CORRECTEMENT');
  console.log('- Si les suppressions des ÉTAPES 3 ont réussi: ❌ Les contraintes NE fonctionnent PAS');
  console.log('- Le nettoyage de l\'ÉTAPE 4 devrait fonctionner séquentiellement');
}

// Exécuter le test
testProductConstraints().catch(console.error);