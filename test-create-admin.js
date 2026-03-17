const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Créer un admin et tester la création de vendeur
async function testAdminAndVendorCreation() {
  try {
    console.log('🚀 Test création admin et vendeur\n');

    // 1️⃣ Créer un admin (si nécessaire)
    console.log('1️⃣ Tentative de connexion admin...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'superadmin@printalma.com',
        password: 'printalmatest123'
      });

      if (loginResponse.data?.access_token) {
        const token = loginResponse.data.access_token;
        console.log('✅ Connexion admin réussie');

        const authHeaders = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 2️⃣ Créer un type de vendeur d'abord
        console.log('\n2️⃣ Création d\'un type de vendeur...');
        try {
          const vendorTypeResponse = await axios.post(`${API_BASE}/vendor-types`, {
            label: "Photographe",
            description: "Spécialiste de la photographie professionnelle"
          }, { headers: authHeaders });
          console.log('✅ Type vendeur créé:', vendorTypeResponse.data.vendorType?.id);
          const vendorTypeId = vendorTypeResponse.data.vendorType?.id;

          // 3️⃣ Créer un vendeur avec vendeur_type_id
          console.log('\n3️⃣ Création vendeur avec vendeur_type_id...');
          try {
            const formData = new FormData();
            formData.append('firstName', 'Jean');
            formData.append('lastName', 'Photographe');
            formData.append('email', 'jean.photo@test.com');
            formData.append('vendeur_type_id', vendorTypeId.toString());
            formData.append('shop_name', 'Boutique Photo Pro');

            const vendorResponse = await axios.post(`${API_BASE}/auth/admin/create-vendor-extended`, formData, {
              headers: {
                ...authHeaders,
                'Content-Type': 'multipart/form-data',
              }
            });

            console.log('✅ Vendeur créé avec succès:', vendorResponse.data);
            console.log('✅ ID vendeur:', vendorResponse.data.user?.id);
            console.log('✅ vendeur_type_id:', vendorResponse.data.user?.vendorTypeId);

          } catch (vendorError) {
            console.log('❌ Erreur création vendeur:', vendorError.response?.status, vendorError.response?.data || vendorError.message);
            if (vendorError.response?.data) {
              console.log('Détails:', JSON.stringify(vendorError.response.data, null, 2));
            }
          }

        } catch (typeError) {
          console.log('❌ Erreur création type vendeur:', typeError.response?.status, typeError.response?.data || typeError.message);
        }

      } else {
        console.log('❌ Échec de la connexion: Token non reçu');
      }
    } catch (loginError) {
      console.log('❌ Échec de la connexion admin:', loginError.response?.status, loginError.response?.data || loginError.message);

      // Si la connexion échoue, essayer de créer un admin via le endpoint register-vendeur
      if (loginError.response?.status === 401) {
        console.log('\n💡 Tentative de créer un admin via inscription...');
        try {
          const registerResponse = await axios.post(`${API_BASE}/auth/register-vendeur`, {
            email: 'superadmin@printalma.com',
            password: 'printalmatest123',
            firstName: 'Super',
            lastName: 'Admin',
            vendeur_type: 'DESIGNER'
          });
          console.log('✅ Inscription réussie:', registerResponse.data);
          console.log('ℹ️ Veuillez activer le compte manuellement dans la base de données');
        } catch (registerError) {
          console.log('❌ Erreur inscription:', registerError.response?.status, registerError.response?.data || registerError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testAdminAndVendorCreation();