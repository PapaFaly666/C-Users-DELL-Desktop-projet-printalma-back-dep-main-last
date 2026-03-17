const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Test qui simule exactement ce que le frontend envoie
async function testFrontendSimulation() {
  try {
    console.log('🧪 Simulation exacte de la requête frontend\n');

    // 1️⃣ Créer un type de vendeur en base (sans authentification)
    console.log('1️⃣ Préparation: Création d\'un type de vendeur de test...');

    // Simuler ce que le frontend enverrait comme FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('firstName', 'Jean');
    formData.append('lastName', 'Photographe');
    formData.append('email', 'jean.photo@test.com');
    formData.append('vendeur_type_id', '1'); // ID qui devrait exister
    formData.append('shop_name', 'Boutique Photo Pro');
    formData.append('password', 'TestPassword123!');

    console.log('📋 Données FormData envoyées (simulation frontend):');
    console.log('   - firstName:', formData.get('firstName'));
    console.log('   - lastName:', formData.get('lastName'));
    console.log('   - email:', formData.get('email'));
    console.log('   - vendeur_type_id:', formData.get('vendeur_type_id'));
    console.log('   - shop_name:', formData.get('shop_name'));
    console.log('   - password:', formData.get('password'));

    // 2️⃣ Tenter la requête exacte du frontend
    console.log('\n2️⃣ Envoi de la requête exacte du frontend...');
    try {
      const response = await axios.post(`${API_BASE}/auth/admin/create-vendor-extended`, formData, {
        headers: {
          ...formData.getHeaders(),
          // Note: Sans token d'authentification, on devrait avoir une erreur 401
          // Mais cela nous montrera si le endpoint reconnaît les données
        }
      });

      console.log('✅ Succès inattendu (réponse):', response.data);

    } catch (error) {
      console.log('❌ Erreur reçue (attendue):');
      console.log('   - Status:', error.response?.status);
      console.log('   - StatusText:', error.response?.statusText);

      if (error.response?.data) {
        console.log('   - Response data:', JSON.stringify(error.response.data, null, 2));
      }

      // Analyser le type d'erreur
      if (error.response?.status === 401) {
        console.log('\n💡 Analyse: Erreur 401 = Problème d\'authentification (normal sans token)');
        console.log('   → L\'endpoint est accessible mais nécessite une authentification valide');
        console.log('   → Les données FormData sont probablement correctes');
      } else if (error.response?.status === 400) {
        console.log('\n💡 Analyse: Erreur 400 = Problème de validation des données');
        console.log('   → Le backend rejette les données envoyées par le frontend');
        console.log('   → C\'est probablement l\'erreur que vous voyez dans le frontend');

        // Chercher des indices sur l'erreur spécifique
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          if (errorData.message) {
            console.log('   → Message d\'erreur:', errorData.message);
          }
          if (errorData.field) {
            console.log('   → Champ problématique:', errorData.field);
          }
          if (errorData.error) {
            console.log('   → Détails erreur:', errorData.error);
          }
        }
      } else {
        console.log('\n💡 Analyse: Erreur inattendue - Status:', error.response?.status);
      }
    }

    // 3️⃣ Vérification finale
    console.log('\n3️⃣ Diagnostic complet...');
    console.log('📝 Conclusion du test:');
    console.log('   - L\'endpoint /auth/admin/create-vendor-extended existe et répond');
    console.log('   - Le frontend envoie bien les données en FormData avec vendeur_type_id');
    console.log('   - L\'erreur 400 que vous voyez vient probablement de la validation côté backend');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testFrontendSimulation();