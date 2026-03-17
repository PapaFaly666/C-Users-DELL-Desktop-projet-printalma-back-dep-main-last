const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3004';
const TEST_USER = {
    firstName: 'Test',
    lastName: 'Vendeur',
    email: 'test.vendeur@printalma.com',
    vendeur_type: 'DESIGNER'
};

console.log('🔧 CRÉATION D\'UN UTILISATEUR DE TEST');
console.log('=====================================\n');

async function createTestUser() {
    try {
        console.log('📝 Création de l\'utilisateur de test...');
        console.log(`   Email: ${TEST_USER.email}`);
        console.log(`   Type: ${TEST_USER.vendeur_type}\n`);

        const response = await axios.post(`${API_BASE_URL}/auth/admin/clients`, TEST_USER, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Utilisateur créé avec succès !');
        console.log('📧 Un email avec le mot de passe temporaire a été envoyé.');
        console.log('\n📋 Informations de l\'utilisateur :');
        console.log(`   ID: ${response.data.user.id}`);
        console.log(`   Email: ${response.data.user.email}`);
        console.log(`   Nom: ${response.data.user.firstName} ${response.data.user.lastName}`);
        console.log(`   Type: ${response.data.user.vendeur_type}`);
        console.log(`   Statut: ${response.data.user.status ? 'Actif' : 'Inactif'}`);

        console.log('\n🧪 MAINTENANT VOUS POUVEZ TESTER :');
        console.log('1. Modifiez TEST_EMAIL dans quick-test-login.js :');
        console.log(`   const TEST_EMAIL = '${TEST_USER.email}';`);
        console.log('2. Lancez le test : node quick-test-login.js');
        console.log('3. Utilisez un mauvais mot de passe pour voir les messages progressifs');

        return response.data.user;

    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            
            if (status === 409) {
                console.log('⚠️  L\'utilisateur existe déjà !');
                console.log(`   Email: ${TEST_USER.email}`);
                console.log('\n🧪 VOUS POUVEZ DIRECTEMENT TESTER :');
                console.log('1. Modifiez TEST_EMAIL dans quick-test-login.js :');
                console.log(`   const TEST_EMAIL = '${TEST_USER.email}';`);
                console.log('2. Lancez le test : node quick-test-login.js');
                return null;
            } else if (status === 401) {
                console.log('❌ Erreur d\'authentification');
                console.log('   Vous devez être connecté en tant qu\'admin pour créer un utilisateur');
                console.log('\n💡 SOLUTIONS :');
                console.log('1. Connectez-vous d\'abord en tant qu\'admin');
                console.log('2. Ou utilisez un email existant dans votre base de données');
                console.log('3. Ou créez l\'utilisateur manuellement via votre interface admin');
            } else {
                console.log(`❌ Erreur ${status}: ${data.message || 'Erreur inconnue'}`);
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.log('❌ Serveur non accessible');
            console.log(`   Vérifiez que le backend est démarré sur ${API_BASE_URL}`);
            console.log('   Commande : npm run start:dev');
        } else {
            console.log(`❌ Erreur réseau: ${error.message}`);
        }
        
        console.log('\n🔧 ALTERNATIVE - CRÉER MANUELLEMENT :');
        console.log('Si vous avez accès à votre base de données, créez un utilisateur avec :');
        console.log(`- Email: ${TEST_USER.email}`);
        console.log(`- Role: VENDEUR`);
        console.log(`- Type: ${TEST_USER.vendeur_type}`);
        console.log('- Status: true (actif)');
        console.log('- Mot de passe: n\'importe lequel (vous testerez avec un mauvais)');
        
        return null;
    }
}

async function main() {
    console.log('🎯 Ce script va créer un utilisateur de test pour tester les messages de connexion');
    console.log('⚠️  Assurez-vous que le backend est démarré\n');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const user = await createTestUser();
    
    if (user) {
        console.log('\n🎉 Prêt pour les tests !');
    }
}

// Gestion des interruptions
process.on('SIGINT', () => {
    console.log('\n\n👋 Création interrompue');
    process.exit(0);
});

// Lancement
main().catch(console.error); 