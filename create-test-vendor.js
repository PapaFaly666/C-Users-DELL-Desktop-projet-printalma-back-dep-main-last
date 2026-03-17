const fetch = require('node-fetch');

const createTestVendor = async () => {
  console.log('👤 === CRÉATION UTILISATEUR VENDEUR TEST ===');
  
  const testVendor = {
    firstName: 'Test',
    lastName: 'Vendeur',
    email: 'test.vendeur@example.com',
    password: 'test123456',
    role: 'VENDEUR',
    vendeur_type: 'DESIGNER'
  };
  
  try {
    console.log('1. Création du compte vendeur...');
    const signupResponse = await fetch('http://localhost:3004/auth/register-vendeur', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testVendor)
    });
    
    const signupResult = await signupResponse.json();
    console.log(`📡 Signup Status: ${signupResponse.status}`);
    
    if (signupResponse.status === 201) {
      console.log('✅ Compte créé avec succès!');
      console.log(`📧 Email: ${testVendor.email}`);
      console.log(`🔑 Password: ${testVendor.password}`);
    } else if (signupResponse.status === 409) {
      console.log('ℹ️ Compte déjà existant (normal)');
    } else {
      console.log('❌ Erreur création:', signupResult);
    }
    
    console.log('\n2. Connexion...');
    const loginResponse = await fetch('http://localhost:3004/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testVendor.email,
        password: testVendor.password
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log(`📡 Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200 && loginResult.access_token) {
      console.log('✅ Connexion réussie!');
      console.log(`🔑 Token: ${loginResult.access_token}`);
      console.log('\n🧪 MAINTENANT TESTEZ LE DESIGN:');
      console.log(`node test-backend-design-reception.js "${loginResult.access_token}"`);
      
      return loginResult.access_token;
    } else {
      console.log('❌ Erreur connexion:', loginResult);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
};

// Auto-test du design si token obtenu
const autoTestDesign = async () => {
  const token = await createTestVendor();
  
  if (token) {
    console.log('\n🚀 === AUTO-TEST DESIGN ===');
    
    // Import dynamique du test design
    try {
      const { spawn } = require('child_process');
      
      const testProcess = spawn('node', ['test-backend-design-reception.js', token], {
        stdio: 'inherit'
      });
      
      testProcess.on('close', (code) => {
        console.log(`\n📊 Test terminé avec code: ${code}`);
      });
      
    } catch (error) {
      console.log('⚠️ Auto-test non disponible, lancez manuellement:');
      console.log(`node test-backend-design-reception.js "${token}"`);
    }
  }
};

autoTestDesign(); 