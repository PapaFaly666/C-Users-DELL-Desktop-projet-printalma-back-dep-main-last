const axios = require('axios');

// Configuration simple pour test rapide
const API_URL = 'http://localhost:3004/auth/login';
const TEST_EMAIL = 'vendeur@printalma.com'; // Changez par un email existant
const WRONG_PASSWORD = 'motdepasseincorrect';

console.log('🚀 TEST RAPIDE DES MESSAGES DE CONNEXION');
console.log('==========================================');
console.log(`📧 Email de test: ${TEST_EMAIL}`);
console.log(`🔑 Mot de passe (incorrect): ${WRONG_PASSWORD}`);
console.log(`🎯 API: ${API_URL}\n`);

const api = axios.create({
    withCredentials: true,
    timeout: 5000
});

async function testSingleLogin(attempt = 1) {
    try {
        console.log(`\n📋 Tentative ${attempt}:`);
        
        const response = await api.post(API_URL, {
            email: TEST_EMAIL,
            password: WRONG_PASSWORD
        });
        
        console.log('✅ Connexion réussie!', response.data);
        return { success: true, data: response.data };
        
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            const message = data.message || 'Pas de message';
            
            console.log(`❌ Erreur ${status}: ${message}`);
            
            // Analyser le type de message
            if (message.includes('Email ou mot de passe incorrect')) {
                if (message.includes('Il vous reste')) {
                    const match = message.match(/Il vous reste (\d+) tentative/);
                    const remaining = match ? match[1] : '?';
                    console.log(`   🔢 Tentatives restantes: ${remaining}`);
                } else if (message.includes('Dernière tentative')) {
                    console.log(`   ⚠️  Dernière tentative avant verrouillage!`);
                } else {
                    console.log(`   ℹ️  Message générique`);
                }
            } else if (message.includes('verrouillé')) {
                const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
                const timeRemaining = timeMatch ? timeMatch[1] : 'non spécifié';
                console.log(`   🔒 Compte verrouillé - Temps restant: ${timeRemaining}`);
            } else if (message.includes('désactivé')) {
                console.log(`   🚫 Compte désactivé`);
            }
            
            return { success: false, status, message, error: data };
        } else if (error.code === 'ECONNREFUSED') {
            console.log(`❌ Serveur non accessible: ${error.message}`);
            console.log(`   💡 Vérifiez que le serveur backend est démarré`);
            return { success: false, error: 'server_down' };
        } else {
            console.log(`❌ Erreur réseau: ${error.message}`);
            return { success: false, error: 'network' };
        }
    }
}

async function testMultipleAttempts() {
    console.log('\n🔄 TEST DE 6 TENTATIVES CONSÉCUTIVES');
    console.log('-'.repeat(40));
    
    for (let i = 1; i <= 6; i++) {
        const result = await testSingleLogin(i);
        
        // Si le compte est verrouillé ou si il y a une erreur serveur, arrêter
        if (!result.success && (
            result.message?.includes('verrouillé') || 
            result.error === 'server_down'
        )) {
            console.log(`\n⛔ Arrêt des tests à la tentative ${i}`);
            break;
        }
        
        // Si connexion réussie, arrêter
        if (result.success) {
            console.log(`\n✅ Connexion réussie à la tentative ${i}`);
            break;
        }
        
        // Pause entre les tentatives
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function showInstructions() {
    console.log(`
📝 INSTRUCTIONS:
1. Assurez-vous que le serveur backend est démarré (npm run start:dev)
2. Modifiez TEST_EMAIL avec un email existant dans votre base de données
3. Assurez-vous que ce compte N'EST PAS un SUPERADMIN
4. Lancez ce script: node quick-test-login.js

🎯 RÉSULTATS ATTENDUS:
- Tentative 1: "❌ Email ou mot de passe incorrect. Il vous reste 4 tentatives."
- Tentative 2: "❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives."
- Tentative 3: "❌ Email ou mot de passe incorrect. Il vous reste 2 tentatives."
- Tentative 4: "❌ Email ou mot de passe incorrect. Il vous reste 1 tentative."
- Tentative 5: "❌ Email ou mot de passe incorrect. ⚠️ Dernière tentative avant verrouillage."
- Tentative 6: "🔒 Trop de tentatives échouées. Votre compte est verrouillé pour 30 minutes."

Ensuite, si vous retestez:
- "🔒 Votre compte est temporairement verrouillé. Temps restant : XX minutes"
`);
}

// Fonction principale
async function main() {
    try {
        await showInstructions();
        
        console.log('\n⏱️  Démarrage dans 3 secondes...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await testMultipleAttempts();
        
        console.log('\n🏁 Tests terminés!');
        console.log('\n💡 CONSEILS:');
        console.log('- Pour débloquer le compte: PUT /auth/admin/unlock-account/:id (avec token admin)');
        console.log('- Pour voir la documentation complète: voir FRONTEND_LOGIN_ERROR_HANDLING.md');
        
    } catch (error) {
        console.error('\n💥 Erreur inattendue:', error.message);
    }
}

// Gestion des interruptions
process.on('SIGINT', () => {
    console.log('\n\n👋 Test interrompu par l\'utilisateur');
    process.exit(0);
});

// Lancement
main().catch(console.error); 