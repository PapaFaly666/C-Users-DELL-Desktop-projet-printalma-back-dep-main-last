const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔧 Mise à jour du mot de passe admin...');

    // Trouver le compte superadmin@printalma.com
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@printalma.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur superadmin@printalma.com non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé, mise à jour du mot de passe...');

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('printalmatest123', saltRounds);

    // Mettre à jour le mot de passe
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        must_change_password: false,
        updated_at: new Date()
      }
    });

    console.log('✅ Mot de passe mis à jour avec succès!');
    console.log('   - ID:', updatedUser.id);
    console.log('   - Email:', updatedUser.email);
    console.log('   - Statut:', updatedUser.status);
    console.log('   - Rôle:', updatedUser.role);

    console.log('\n🎉 Le compte admin est maintenant prêt avec le bon mot de passe!');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();