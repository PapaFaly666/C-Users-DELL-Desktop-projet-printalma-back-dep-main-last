const http = require('http');

async function quickTest() {
  console.log('🔍 Test rapide du serveur et de l\'endpoint...\n');
  
  // Test 1: Vérifier si le serveur répond
  try {
    console.log('1. Test de connectivité serveur...');
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/', (res) => {
        console.log(`✅ Serveur répond avec status: ${res.statusCode}`);
        resolve();
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log('❌ Serveur ne répond pas:', error.message);
    return;
  }
  
  // Test 2: Vérifier l'endpoint health
  try {
    console.log('\n2. Test de l\'endpoint health...');
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/vendor/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ Health endpoint répond: ${res.statusCode}`);
          if (data) {
            try {
              const response = JSON.parse(data);
              console.log('📊 Réponse health:', response);
            } catch (e) {
              console.log('📄 Réponse brute:', data.substring(0, 200));
            }
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log('❌ Health endpoint ne répond pas:', error.message);
  }
  
  // Test 3: Vérifier l'endpoint groupé (sans auth)
  try {
    console.log('\n3. Test de l\'endpoint groupé (sans auth - doit échouer)...');
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/vendor/products/grouped', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ Endpoint groupé répond: ${res.statusCode}`);
          if (res.statusCode === 401) {
            console.log('🔒 Correctement protégé (401 Unauthorized)');
          } else {
            console.log('⚠️ Status inattendu, réponse:', data.substring(0, 200));
          }
          resolve();
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log('❌ Endpoint groupé ne répond pas:', error.message);
  }
  
  // Test 4: Vérifier la documentation Swagger
  try {
    console.log('\n4. Test de la documentation Swagger...');
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api', (res) => {
        console.log(`✅ Swagger UI répond: ${res.statusCode}`);
        resolve();
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log('❌ Swagger UI ne répond pas:', error.message);
  }
  
  console.log('\n🎉 Tests de connectivité terminés !');
  console.log('\n📝 Instructions pour tester l\'endpoint complet:');
  console.log('1. Connectez-vous pour obtenir un token JWT');
  console.log('2. Utilisez le token pour accéder à GET /api/vendor/products/grouped');
  console.log('3. Consultez la documentation Swagger: http://localhost:3000/api');
}

// Ajouter une fonction pour tester avec authentification
async function testWithAuth() {
  console.log('\n🔐 Tentative de test avec authentification...');
  
  const querystring = require('querystring');
  const https = require('https');
  
  // Données de connexion (à adapter selon vos credentials de test)
  const loginData = querystring.stringify({
    email: 'admin@printalma.com',
    password: 'admin123'
  });
  
  try {
    console.log('🔑 Tentative de connexion...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              const response = JSON.parse(data);
              if (response.access_token) {
                console.log('✅ Connexion réussie, token obtenu');
                // Test avec le token
                testGroupedEndpointWithToken(response.access_token);
              } else {
                console.log('⚠️ Connexion réussie mais pas de token:', response);
              }
            } catch (e) {
              console.log('❌ Erreur parsing réponse login:', e.message);
            }
          } else {
            console.log(`❌ Échec connexion (${res.statusCode}):`, data);
          }
          resolve();
        });
      });
      
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
  } catch (error) {
    console.log('❌ Erreur lors de la connexion:', error.message);
  }
}

async function testGroupedEndpointWithToken(token) {
  console.log('\n📦 Test de l\'endpoint groupé avec authentification...');
  
  try {
    await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/vendor/products/grouped',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`✅ Endpoint groupé avec auth: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              console.log('🎉 SUCCÈS ! Endpoint fonctionne parfaitement');
              console.log('📊 Statistiques:', response.statistics);
              console.log('🏷️ Groupes trouvés:', Object.keys(response.data));
            } catch (e) {
              console.log('❌ Erreur parsing réponse:', e.message);
              console.log('📄 Réponse brute:', data.substring(0, 500));
            }
          } else {
            console.log('❌ Erreur endpoint:', data);
          }
          resolve();
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
  } catch (error) {
    console.log('❌ Erreur test endpoint avec token:', error.message);
  }
}

// Exécution des tests
async function runAllTests() {
  await quickTest();
  await testWithAuth();
}

if (require.main === module) {
  runAllTests().catch(console.error);
} 