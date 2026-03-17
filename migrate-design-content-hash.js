const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function migrateDesignContentHash() {
  console.log('🔄 Migration des designs existants - Ajout des hash de contenu...');

  try {
    // 1. Récupérer tous les designs sans contentHash
    const designs = await prisma.design.findMany({
      where: {
        contentHash: null
      },
      include: {
        vendorProducts: {
          select: {
            id: true,
            designBase64: true
          }
        }
      }
    });

    console.log(`📊 ${designs.length} designs trouvés sans contentHash`);

    let updated = 0;
    let errors = 0;

    for (const design of designs) {
      try {
        let contentHash = null;

        // Essayer de récupérer le contenu base64 depuis les produits liés
        for (const vendorProduct of design.vendorProducts) {
          if (vendorProduct.designBase64) {
            const designContent = vendorProduct.designBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            contentHash = crypto.createHash('sha256').update(designContent).digest('hex');
            break;
          }
        }

        // Si pas de contenu base64, générer un hash basé sur l'URL
        if (!contentHash) {
          contentHash = crypto.createHash('sha256').update(design.imageUrl).digest('hex');
          console.log(`⚠️  Design ${design.id}: Hash généré depuis URL (pas de base64)`);
        }

        // Mettre à jour le design avec le hash
        await prisma.design.update({
          where: { id: design.id },
          data: { contentHash }
        });

        console.log(`✅ Design ${design.id}: Hash ajouté ${contentHash.substring(0, 12)}...`);
        updated++;

      } catch (error) {
        console.error(`❌ Erreur design ${design.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Résultats de la migration:`);
    console.log(`✅ Designs mis à jour: ${updated}`);
    console.log(`❌ Erreurs: ${errors}`);

    // 2. Vérifier les doublons potentiels
    console.log('\n🔍 Vérification des doublons...');
    const duplicates = await prisma.$queryRaw`
      SELECT "contentHash", COUNT(*) as count
      FROM "Design"
      WHERE "contentHash" IS NOT NULL
      GROUP BY "contentHash"
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} hash(s) en doublon détecté(s):`);
      for (const dup of duplicates) {
        console.log(`   - Hash ${dup.contentHash.substring(0, 12)}...: ${dup.count} designs`);
      }
    } else {
      console.log('✅ Aucun doublon détecté');
    }

    // 3. Test de la logique de déduplication
    console.log('\n🧪 Test de déduplication...');
    await testDesignDeduplication();

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testDesignDeduplication() {
  try {
    // Créer un design de test
    const testDesignBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const designContent = testDesignBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const designHash = crypto.createHash('sha256').update(designContent).digest('hex');

    console.log(`🎨 Test avec hash: ${designHash.substring(0, 12)}...`);

    // Vérifier si un design avec ce hash existe déjà
    const existingDesign = await prisma.design.findFirst({
      where: { contentHash: designHash }
    });

    if (existingDesign) {
      console.log(`✅ Design existant trouvé: ID ${existingDesign.id} (réutilisation)`);
    } else {
      console.log('✅ Nouveau design (serait créé)');
    }

    // Nettoyer le design de test s'il a été créé
    await prisma.design.deleteMany({
      where: {
        name: { startsWith: 'Test Design' },
        contentHash: designHash
      }
    });

  } catch (error) {
    console.error('❌ Erreur test déduplication:', error);
  }
}

// Fonction pour nettoyer les designs orphelins
async function cleanupOrphanDesigns() {
  console.log('\n🧹 Nettoyage des designs orphelins...');

  try {
    // Trouver les designs sans produits liés
    const orphanDesigns = await prisma.design.findMany({
      where: {
        vendorProducts: {
          none: {}
        },
        designProductLinks: {
          none: {}
        }
      }
    });

    console.log(`🗑️  ${orphanDesigns.length} designs orphelins trouvés`);

    if (orphanDesigns.length > 0) {
      const deleteResult = await prisma.design.deleteMany({
        where: {
          id: {
            in: orphanDesigns.map(d => d.id)
          }
        }
      });

      console.log(`✅ ${deleteResult.count} designs orphelins supprimés`);
    }

  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateDesignContentHash()
    .then(() => cleanupOrphanDesigns())
    .then(() => {
      console.log('\n🎉 Migration terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { migrateDesignContentHash, testDesignDeduplication, cleanupOrphanDesigns }; 