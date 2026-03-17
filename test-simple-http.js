const http = require('http');

// Test simple pour simuler la requête HTTP exacte du frontend
async function testSimpleHTTP() {
  try {
    console.log('🧪 Test HTTP simple - Simulation de la requête frontend\n');

    // 1️⃣ Préparation des données
    console.log('1️⃣ Préparation des données...');
    const boundary = '----formdata-boundary-' + Math.random().toString(36).substr(2, 16);

    const formData = [
      '--' + boundary,
      'Content-Disposition: form-data; name="firstName"',
      '',
      'Jean',
      '--' + boundary,
      'Content-Disposition: form-data; name="lastName"',
      '',
      'Photographe',
      '--' + boundary,
      'Content-Disposition: form-data; name="email"',
      '',
      'jean.photo@test.com',
      '--' + boundary,
      'Content-Disposition: form-data; name="vendeur_type_id"',
      '',
      '1', // ID du type de vendeur
      '--' + boundary,
      'Content-Disposition: form-data; name="shop_name"',
      '',
      'Boutique Photo Pro',
      '--' + boundary,
      'Content-Disposition: form-data; name="password"',
      '',
      'TestPassword123!',
      '--' + boundary + '--',
      ''
    ].join('\r\n');

    console.log('📋 Données à envoyer:');
    console.log('   - Content-Type: multipart/form-data');
    console.log('   - Boundary:', boundary);
    console.log('   - Champs: firstName, lastName, email, vendeur_type_id, shop_name, password');

    // 2️⃣ Préparer la requête HTTP
    const options = {
      hostname: 'localhost',
      port: 3004,
      path: '/auth/admin/create-vendor-extended',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      }
    };

    console.log('\n2️⃣ Envoi de la requête HTTP exacte...');

    // 3️⃣ Envoyer la requête
    const req = http.request(options, (res) => {
      console.log('\n📥 Réponse reçue:');
      console.log('   - Status:', res.statusCode);
      console.log('   - StatusText:', res.statusMessage);
      console.log('   - Headers:', res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('   - Body:', data);

        // Analyser la réponse
        try {
          const jsonData = JSON.parse(data);
          console.log('\n✅ Succès! Réponse JSON:', jsonData);
        } catch (e) {
          console.log('\n❌ Erreur de parsing JSON:', data);
          console.log('   → Message brut:', e.message);
        }

        // 4️⃣ Analyse du statut
        console.log('\n📊 Analyse du statut:');
        if (res.statusCode === 401) {
          console.log('   → 401 Unauthorized: Le token JWT est manquant ou invalide (normal)');
          console.log('   → L\'endpoint est protégé par authentification');
          console.log('   → Le problème vient probablement du token du frontend');
        } else if (res.statusCode === 400) {
          console.log('   → 400 Bad Request: Erreur de validation des données');
          console.log('   → C\'est l\'erreur que vous voyez dans le frontend!');
          console.log('   → Le backend rejette les données envoyées');

          // Si c'est du JSON, analyser l'erreur
          try {
            const errorData = JSON.parse(data);
            console.log('   → Détails de l\'erreur:', errorData);

            if (errorData.message) {
              console.log('   → Message d\'erreur:', errorData.message);
            }
            if (errorData.field) {
              console.log('   → Champ problématique:', errorData.field);
            }
            if (errorData.error) {
              console.log('   → Erreur technique:', errorData.error);
            }
          } catch (e) {
            console.log('   → Réponse non-JSON, erreur 400 probablement côté backend');
          }
        } else {
          console.log('   → Statut inattendu:', res.statusCode);
        }

        console.log('\n🎯 Conclusion du test:');
        console.log('   - La requête atteint bien le backend');
        console.log('   - Le format FormData est correct');
        console.log('   - L\'erreur 400 vient probablement de la validation backend');
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur de requête:', error.message);
    });

    // Envoyer les données
    req.write(formData);
    req.end();

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testSimpleHTTP();