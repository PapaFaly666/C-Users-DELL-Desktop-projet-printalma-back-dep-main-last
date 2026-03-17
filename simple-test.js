const axios = require('axios');

async function simpleTest() {
  try {
    console.log('🧪 Test simple de login et endpoints vendor...\n');

    // Test 1: Login
    console.log('1. Test de login...');
    const loginResponse = await axios.post('http://localhost:3004/auth/login', {
      email: 'pf.d@zig.univ.sn',
      password: 'password123'
    });

    console.log('✅ Login réussi !');
    console.log('Response:', loginResponse.data);

    // Extraire le token
    const token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data.data?.token;

    if (!token) {
      console.log('❌ Aucun token trouvé dans la réponse');
      console.log('Structure de réponse:', Object.keys(loginResponse.data));
      return;
    }

    console.log('🔑 Token obtenu:', token.substring(0, 20) + '...');

    // Test 2: Statistics
    console.log('\n2. Test des statistiques...');
    const statsResponse = await axios.get('http://localhost:3004/vendor/orders/statistics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Statistiques récupérées !');
    console.log('Data:', JSON.stringify(statsResponse.data, null, 2));

    // Test 3: Orders list
    console.log('\n3. Test de la liste des commandes...');
    const ordersResponse = await axios.get('http://localhost:3004/vendor/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Commandes récupérées !');
    console.log(`📦 ${ordersResponse.data.data?.orders?.length || 0} commandes trouvées`);

    if (ordersResponse.data.data?.orders) {
      ordersResponse.data.data.orders.forEach((order, i) => {
        console.log(`   ${i+1}. ${order.orderNumber} - ${order.status} (${order.totalAmount} FCFA)`);
      });
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Erreur HTTP:', error.response.status);
      console.log('Message:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

simpleTest();