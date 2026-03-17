const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestVendor() {
  console.log('🔧 Création d\'un utilisateur vendeur de test...');
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@vendor.com' }
    });
    
    if (existingUser) {
      console.log('✅ Utilisateur test déjà présent');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Nom: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   Rôle: ${existingUser.role}`);
      return existingUser;
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    // Créer l'utilisateur vendeur
    const newUser = await prisma.user.create({
      data: {
        email: 'test@vendor.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Vendor',
        role: 'VENDEUR',
        status: true,
      }
    });
    
    console.log('✅ Utilisateur vendeur créé avec succès');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nom: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`   Rôle: ${newUser.role}`);
    console.log(`   Mot de passe: testpassword`);
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  createTestVendor().catch(console.error);
}

module.exports = { createTestVendor }; 