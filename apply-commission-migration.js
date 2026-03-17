/**
 * Script d'application de la migration commission
 * Utilisation: node apply-commission-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Application de la migration système de commission...');
  
  try {
    // Lire le fichier SQL de migration
    const migrationPath = path.join(__dirname, 'prisma/migrations/001_add_commission_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Séparer les commandes SQL
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 ${commands.length} commandes SQL à exécuter...`);
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`⚡ Exécution commande ${i + 1}/${commands.length}...`);
        await prisma.$executeRawUnsafe(command);
        console.log(`✅ Commande ${i + 1} exécutée avec succès`);
      } catch (error) {
        // Ignorer l'erreur si la table existe déjà
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Commande ${i + 1} ignorée (élément déjà existant)`);
        } else {
          console.log(`❌ Erreur commande ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration appliquée avec succès!');
    
    // Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification des tables créées...');
    
    const vendorCommissionsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'vendor_commissions'
    `;
    
    const auditLogCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'commission_audit_log'
    `;
    
    console.log('📊 Tables créées:');
    console.log(`  • vendor_commissions: ${vendorCommissionsCount[0]?.count || 0 > 0 ? '✅' : '❌'}`);
    console.log(`  • commission_audit_log: ${auditLogCount[0]?.count || 0 > 0 ? '✅' : '❌'}`);
    
    // Ajouter une commission par défaut pour le premier vendeur (si il existe)
    try {
      const firstVendor = await prisma.user.findFirst({
        where: { role: 'VENDEUR' }
      });
      
      if (firstVendor) {
        await prisma.$executeRaw`
          INSERT INTO vendor_commissions (vendor_id, commission_rate, created_at, updated_at)
          VALUES (${firstVendor.id}, 40.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (vendor_id) DO NOTHING
        `;
        console.log(`✅ Commission par défaut ajoutée pour le vendeur ${firstVendor.id}`);
      } else {
        console.log('⚠️  Aucun vendeur trouvé pour commission par défaut');
      }
    } catch (error) {
      console.log('⚠️  Erreur ajout commission par défaut:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Erreur lors de l\'application de la migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Gestion des erreurs
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Erreur non gérée:', reason);
  process.exit(1);
});

// Lancement de la migration
applyMigration()
  .then(() => {
    console.log('\n🎉 Migration terminée avec succès!');
    process.exit(0);
  })
  .catch(error => {
    console.log('💥 Erreur fatale:', error.message);
    process.exit(1);
  });