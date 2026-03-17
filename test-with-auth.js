const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testVendorEndpointsWithAuth() {
  try {
    console.log('🔑 Test des endpoints vendor avec authentification...\n');

    // 1. Login pour obtenir le token
    console.log('1. Tentative de connexion...');

    // Tu devras remplacer le mot de passe par le vrai
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pf.d@zig.univ.sn',
      password: 'ton_mot_de_passe' // Remplace par le vrai mot de passe
    }).catch(error => {
      console.log('❌ Échec de connexion:', error.response?.data || error.message);
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifier le mot de passe');
      console.log('2. Créer un nouveau mot de passe avec le script ci-dessous');
      return null;
    });

    if (!loginResponse) {
      console.log('\n📝 Script pour créer/mettre à jour le mot de passe:');
      console.log(`
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function updatePassword() {
  const prisma = new PrismaClient();
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.update({
    where: { email: 'pf.d@zig.univ.sn' },
    data: { password: hashedPassword }
  });

  console.log('✅ Mot de passe mis à jour: password123');
  await prisma.$disconnect();
}

updatePassword();
      `);
      return;
    }

    const token = loginResponse.data.token || loginResponse.data.access_token;
    console.log('✅ Connexion réussie, token obtenu');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Test des différents endpoints
    const endpoints = [
      { method: 'GET', url: '/vendor/orders', name: 'Liste des commandes' },
      { method: 'GET', url: '/vendor/orders/statistics', name: 'Statistiques vendeur' },
      { method: 'GET', url: '/vendor/orders/notifications', name: 'Notifications' },
      { method: 'GET', url: '/vendor/orders?status=PENDING', name: 'Commandes en attente' },
      { method: 'GET', url: '/vendor/orders?page=1&limit=5', name: 'Commandes paginées' },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n2. Test: ${endpoint.name}`);
        console.log(`   ${endpoint.method} ${endpoint.url}`);

        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.url}`,
          headers
        });

        console.log(`   ✅ Status: ${response.status}`);

        if (endpoint.url === '/vendor/orders/statistics') {
          console.log('   📊 Statistiques:', JSON.stringify(response.data.data, null, 2));
        } else if (endpoint.url === '/vendor/orders') {
          console.log(`   📦 Commandes trouvées: ${response.data.data?.orders?.length || 0}`);
          if (response.data.data?.orders?.length > 0) {
            response.data.data.orders.forEach((order, index) => {
              console.log(`      ${index + 1}. ${order.orderNumber} - ${order.status} (${order.totalAmount} FCFA)`);
            });
          }
        } else if (endpoint.url.includes('status=PENDING')) {
          console.log(`   ⏳ Commandes en attente: ${response.data.data?.orders?.length || 0}`);
        }

      } catch (error) {
        console.log(`   ❌ Erreur: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

    // 3. Test de mise à jour de statut si commande PENDING disponible
    console.log('\n3. Test de mise à jour de statut...');
    try {
      const ordersResponse = await axios.get(`${BASE_URL}/vendor/orders?status=PENDING`, { headers });

      if (ordersResponse.data.data?.orders?.length > 0) {
        const pendingOrder = ordersResponse.data.data.orders[0];
        console.log(`   Mise à jour de la commande: ${pendingOrder.orderNumber}`);

        const updateResponse = await axios.patch(
          `${BASE_URL}/vendor/orders/${pendingOrder.id}/status`,
          {
            status: 'CONFIRMED',
            notes: 'Commande confirmée via test automatique'
          },
          { headers }
        );

        console.log(`   ✅ Statut mis à jour: ${updateResponse.data.data.status}`);
      } else {
        console.log('   ℹ️ Aucune commande PENDING à mettre à jour');
      }
    } catch (error) {
      console.log(`   ❌ Erreur mise à jour: ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testVendorEndpointsWithAuth();