// Test des services NestJS pour la protection contre la suppression
const axios = require('axios');

const API_BASE = 'http://localhost:3001'; // Adapter selon votre configuration

async function testServicesProtection() {
  console.log('🧪 Test de protection des services NestJS...\n');

  try {
    // 1. Récupérer une sous-catégorie avec des variations
    console.log('1️⃣ Recherche d\'une sous-catégorie avec des variations...');
    const subCategoriesResponse = await axios.get(`${API_BASE}/sub-categories`);
    const subCategories = subCategoriesResponse.data;

    const subCategoryWithVariations = subCategories.find(sub =>
      sub.variations && sub.variations.length > 0
    );

    if (!subCategoryWithVariations) {
      console.log('❌ Aucune sous-catégorie avec variations trouvée');
      return;
    }

    console.log(`✅ Sous-catégorie trouvée: ${subCategoryWithVariations.name} (ID: ${subCategoryWithVariations.id})`);
    console.log(`   - Variations: ${subCategoryWithVariations.variations?.length || 0}`);

    // 2. Test de suppression de la sous-catégorie (devrait échouer)
    console.log('\n2️⃣ Test de suppression de la sous-catégorie via API (devrait échouer)...');
    try {
      await axios.delete(`${API_BASE}/sub-categories/${subCategoryWithVariations.id}`);
      console.log('❌ ERREUR: La sous-catégorie a été supprimée !');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Succès: La sous-catégorie est protégée contre la suppression');
        console.log(`   Message: ${error.response.data.message}`);
      } else if (error.response && error.response.status === 404) {
        console.log('⚠️  La sous-catégorie n\'existe pas (peut-être déjà supprimée)');
      } else {
        console.log('⚠️  Erreur inattendue:', error.message);
      }
    }

    // 3. Tester une variation spécifique
    if (subCategoryWithVariations.variations && subCategoryWithVariations.variations.length > 0) {
      const variation = subCategoryWithVariations.variations[0];
      console.log(`\n3️⃣ Test de suppression de la variation "${variation.name}" (ID: ${variation.id})...`);

      try {
        await axios.delete(`${API_BASE}/variations/${variation.id}`);
        console.log('ℹ️  La variation a été supprimée (elle n\'avait probablement pas de produits)');
      } catch (error) {
        if (error.response && error.response.status === 409) {
          console.log('✅ Succès: La variation est protégée contre la suppression');
          console.log(`   Message: ${error.response.data.message}`);
          console.log(`   Détails: ${JSON.stringify(error.response.data.details, null, 2)}`);
        } else {
          console.log('⚠️  Erreur lors de la suppression de la variation:', error.message);
        }
      }
    }

    // 4. Test avec une sous-catégorie sans variations
    console.log('\n4️⃣ Recherche d\'une sous-catégorie sans variations...');
    const subCategoryWithoutVariations = subCategories.find(sub =>
      !sub.variations || sub.variations.length === 0
    );

    if (subCategoryWithoutVariations) {
      console.log(`✅ Sous-catégorie sans variations trouvée: ${subCategoryWithoutVariations.name} (ID: ${subCategoryWithoutVariations.id})`);

      try {
        await axios.delete(`${API_BASE}/sub-categories/${subCategoryWithoutVariations.id}`);
        console.log('ℹ️  La sous-catégorie sans variations a été supprimée avec succès');
      } catch (error) {
        if (error.response && error.response.status === 409) {
          console.log('ℹ️  La sous-catégorie est utilisée par des produits (protection fonctionnelle)');
          console.log(`   Message: ${error.response.data.message}`);
        } else {
          console.log('⚠️  Erreur lors de la suppression:', error.message);
        }
      }
    } else {
      console.log('ℹ️  Toutes les sous-catégories ont des variations');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Vérifier si le serveur est disponible avant de tester
async function checkServerAvailability() {
  try {
    await axios.get(`${API_BASE}/variations`);
    return true;
  } catch (error) {
    console.error('❌ Serveur non disponible. Veuillez démarrer l\'application avec npm run start:dev');
    return false;
  }
}

async function main() {
  const serverAvailable = await checkServerAvailability();
  if (serverAvailable) {
    await testServicesProtection();
  }
}

main();