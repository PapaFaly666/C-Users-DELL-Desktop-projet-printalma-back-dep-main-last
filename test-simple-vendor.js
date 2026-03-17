const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Test simple sans authentification pour voir l'erreur exacte
async function testSimpleVendorCreation() {
  try {
    console.log('🚀 Test simple de création vendeur\n');

    // Test 1: Tenter de créer un vendeur avec vendeur_type_id
    console.log('1️⃣ Test: Création vendeur avec vendeur_type_id');
    try {
      const formData = new FormData();
      formData.append('firstName', 'Jean');
      formData.append('lastName', 'Photographe');
      formData.append('email', 'jean.photo@test.com');
      formData.append('vendeur_type_id', '1');
      formData.append('shop_name', 'Boutique Photo Pro');

      const response = await axios.post(`${API_BASE}/auth/admin/create-vendor-extended`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('✅ Succès:', response.data);
    } catch (error) {
      console.log('❌ Erreur:', error.response?.status, error.response?.data || error.message);
      if (error.response?.data) {
        console.log('Détails de l\'erreur:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\n📝 Test terminé !');
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testSimpleVendorCreation();