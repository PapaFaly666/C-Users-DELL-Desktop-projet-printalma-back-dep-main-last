/**
 * Script de test pour l'endpoint /vendor/stats enrichi
 * Usage: node test-vendor-enhanced-stats.js
 */

const https = require('https');

// ⚙️ Configuration
const CONFIG = {
  API_BASE: 'https://printalma-backend.onrender.com',  // Remplacer par votre URL
  // API_BASE: 'http://localhost:3000',  // Pour test local

  // Cookie JWT du vendeur (obtenu après connexion)
  VENDOR_JWT: 'votre_jwt_cookie_ici',  // À remplacer par un vrai token

  // ID du vendeur pour le test (optionnel)
  VENDOR_ID: 2  // À adapter selon vos données
};

/**
 * 🧪 Test de l'endpoint /vendor/stats
 */
async function testVendorStats() {
  console.log('🚀 Test des statistiques vendeur enrichies...\n');

  try {
    const response = await fetch(`${CONFIG.API_BASE}/vendor/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': CONFIG.VENDOR_JWT  // Auth par cookie
      },
      credentials: 'include'
    });

    console.log(`📡 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', errorText);
      return;
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Succès! Données reçues:\n');

      // 📊 Affichage formaté des statistiques
      const stats = data.data;

      console.log('📦 PRODUITS & DESIGNS:');
      console.log(`   Produits: ${stats.totalProducts} (${stats.publishedProducts} publiés)`);
      console.log(`   Designs:  ${stats.totalDesigns} (${stats.validatedDesigns} validés)\n`);

      console.log('💰 FINANCES:');
      console.log(`   CA annuel:        ${formatMoney(stats.yearlyRevenue)} FCFA`);
      console.log(`   CA mensuel:       ${formatMoney(stats.monthlyRevenue)} FCFA`);
      console.log(`   Solde disponible: ${formatMoney(stats.availableBalance)} FCFA`);
      console.log(`   En attente:       ${formatMoney(stats.pendingAmount)} FCFA`);
      console.log(`   Gains totaux:     ${formatMoney(stats.totalEarnings)} FCFA`);
      console.log(`   Commission moy:   ${stats.averageCommissionRate}%\n`);

      console.log('📊 ACTIVITÉ:');
      console.log(`   Vues boutique:    ${stats.shopViews.toLocaleString()}`);
      console.log(`   Commandes:        ${stats.totalOrders}\n`);

      console.log('📅 DATES:');
      console.log(`   Membre depuis:    ${stats.memberSinceFormatted || '—'}`);
      console.log(`   Dernière conn.:   ${stats.lastLoginAtFormatted || '—'}\n`);

      console.log(`🏗️  Architecture:     ${stats.architecture}`);

      // ✅ Vérifications de cohérence
      console.log('\n🔍 VÉRIFICATIONS DE COHÉRENCE:');

      if (stats.availableBalance >= 0) {
        console.log('✅ Solde disponible positif ou nul');
      } else {
        console.log('⚠️  Solde disponible négatif (incohérent)');
      }

      if (stats.totalEarnings >= stats.availableBalance + stats.pendingAmount) {
        console.log('✅ Cohérence financière: totalEarnings >= disponible + en attente');
      } else {
        console.log('⚠️  Incohérence financière détectée');
      }

      if (stats.publishedProducts <= stats.totalProducts) {
        console.log('✅ Cohérence produits: publiés <= total');
      } else {
        console.log('⚠️  Incohérence produits détectée');
      }

    } else {
      console.error('❌ Échec API:', data.message || 'Erreur inconnue');
    }

  } catch (error) {
    console.error('💥 Erreur de connexion:', error.message);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestions:');
      console.log('   - Vérifiez que le serveur est démarré');
      console.log('   - Vérifiez l\'URL dans CONFIG.API_BASE');
      console.log('   - Pour test local: npm run start:dev');
    }
  }
}

/**
 * 💰 Formater un montant en FCFA
 */
function formatMoney(amount) {
  if (typeof amount !== 'number') return '0';
  return new Intl.NumberFormat('fr-FR').format(amount);
}

/**
 * 🧪 Test de cohérence avec l'endpoint funds
 */
async function testFinancialConsistency() {
  console.log('\n🔗 Test de cohérence avec /vendor/earnings...');

  try {
    const response = await fetch(`${CONFIG.API_BASE}/vendor/earnings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': CONFIG.VENDOR_JWT
      }
    });

    if (response.ok) {
      const earningsData = await response.json();
      console.log('✅ Endpoint /vendor/earnings accessible');

      if (earningsData.success && earningsData.data) {
        console.log(`   Solde selon earnings: ${formatMoney(earningsData.data.availableAmount)} FCFA`);
      }
    } else {
      console.log('⚠️  Endpoint /vendor/earnings non accessible (normal si pas implémenté)');
    }

  } catch (error) {
    console.log('ℹ️  Test de cohérence ignoré (endpoint earnings optionnel)');
  }
}

/**
 * 🎯 Fonction principale
 */
async function main() {
  console.log('=' .repeat(60));
  console.log('🧪 TEST DES STATISTIQUES VENDEUR ENRICHIES');
  console.log('=' .repeat(60));

  // Vérification de la configuration
  if (CONFIG.VENDOR_JWT === 'votre_jwt_cookie_ici') {
    console.log('⚠️  ATTENTION: Configurez un vrai JWT dans CONFIG.VENDOR_JWT');
    console.log('💡 Pour obtenir un JWT:');
    console.log('   1. Connectez-vous en tant que vendeur');
    console.log('   2. Copiez le cookie JWT depuis les DevTools');
    console.log('   3. Remplacez la valeur dans ce script\n');
  }

  await testVendorStats();
  await testFinancialConsistency();

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Test terminé');
  console.log('=' .repeat(60));
}

// Exécution
main().catch(console.error);