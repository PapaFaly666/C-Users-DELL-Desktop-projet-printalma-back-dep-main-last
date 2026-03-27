/**
 * Script pour corriger les rôles des utilisateurs existants
 * Ce script met à jour le champ 'role' (enum) pour tous les utilisateurs
 * qui ont un roleId (CustomRole) mais pas de role enum défini
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserRoles() {
  console.log('🔧 Correction des rôles utilisateurs...');

  try {
    // D'abord, trouver le nom exact de la table
    console.log('🔍 Recherche de la table users...');
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%user%'
    `;
    console.log('Tables trouvées:', tables);

    // Récupérer tous les CustomRoles
    const customRoles = await prisma.customRole.findMany();
    console.log(`📋 ${customRoles.length} rôles personnalisés trouvés`);

    // Créer un map de slug vers Role enum
    const roleMap = {
      'superadmin': 'SUPERADMIN',
      'admin': 'ADMIN',
      'moderateur': 'MODERATEUR',
      'support': 'SUPPORT',
      'comptable': 'COMPTABLE',
      'vendor': 'VENDEUR',
      'vendeur': 'VENDEUR',
    };

    let updatedCount = 0;

    // Pour chaque CustomRole, mettre à jour les utilisateurs
    for (const customRole of customRoles) {
      const slugLower = customRole.slug.toLowerCase();
      const mappedRole = roleMap[slugLower] || 'ADMIN';

      // Trouver les utilisateurs avec ce roleId via Prisma Client API
      const users = await prisma.user.findMany({
        where: {
          roleId: customRole.id,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      console.log(`🔍 Rôle ${customRole.slug}: ${users.length} utilisateurs`);

      // Pour chaque utilisateur, mettre à jour si nécessaire
      for (const user of users) {
        if (user.role !== mappedRole) {
          console.log(`   🔄 Mise à jour user ${user.id} (${user.email}): ${user.role} -> ${mappedRole}`);
          await prisma.user.update({
            where: { id: user.id },
            data: { role: mappedRole },
          });
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ ${updatedCount} utilisateurs mis à jour avec succès!`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
