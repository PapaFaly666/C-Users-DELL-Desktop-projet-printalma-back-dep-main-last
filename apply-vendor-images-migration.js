const { PrismaClient } = require('@prisma/client');

async function applyVendorImagesMigration() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Début de la migration VendorProductImage...');

    // 1. Vérifier si la table VendorProductImage existe
    try {
      await prisma.$queryRaw`SELECT id FROM "VendorProductImage" LIMIT 1;`;
      console.log('✅ La table VendorProductImage existe déjà');
    } catch (error) {
      if (error.message.includes('relation "VendorProductImage" does not exist')) {
        console.log('📋 Création de la table VendorProductImage...');
        
        // Créer la table VendorProductImage
        await prisma.$executeRaw`
          CREATE TABLE "VendorProductImage" (
            "id" SERIAL NOT NULL,
            "vendorProductId" INTEGER NOT NULL,
            "colorId" INTEGER,
            "colorName" TEXT,
            "colorCode" TEXT,
            "imageType" TEXT NOT NULL DEFAULT 'color',
            "cloudinaryUrl" TEXT NOT NULL,
            "cloudinaryPublicId" TEXT NOT NULL,
            "originalImageKey" TEXT,
            "width" INTEGER,
            "height" INTEGER,
            "fileSize" INTEGER,
            "format" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "VendorProductImage_pkey" PRIMARY KEY ("id")
          );
        `;
        
        // Ajouter les index
        await prisma.$executeRaw`
          CREATE INDEX "VendorProductImage_vendorProductId_idx" ON "VendorProductImage"("vendorProductId");
        `;
        
        await prisma.$executeRaw`
          CREATE INDEX "VendorProductImage_colorId_idx" ON "VendorProductImage"("colorId");
        `;
        
        await prisma.$executeRaw`
          CREATE INDEX "VendorProductImage_imageType_idx" ON "VendorProductImage"("imageType");
        `;
        
        console.log('✅ Table VendorProductImage créée avec succès');
      } else {
        throw error;
      }
    }

    // 2. Vérifier et ajouter les nouveaux champs à VendorProduct
    console.log('🔄 Vérification des champs VendorProduct...');
    
    const columnsToAdd = [
      { name: 'vendorName', type: 'TEXT' },
      { name: 'vendorDescription', type: 'TEXT' }, 
      { name: 'vendorStock', type: 'INTEGER NOT NULL DEFAULT 0' },
      { name: 'basePriceAdmin', type: 'DECIMAL(65,30) NOT NULL DEFAULT 0' }
    ];

    for (const column of columnsToAdd) {
      try {
        await prisma.$queryRaw`
          SELECT ${column.name} FROM "VendorProduct" LIMIT 1;
        `;
        console.log(`✅ Colonne ${column.name} existe déjà`);
      } catch (error) {
        if (error.message.includes(`column "${column.name}" does not exist`)) {
          console.log(`📝 Ajout de la colonne ${column.name}...`);
          await prisma.$executeRaw`
            ALTER TABLE "VendorProduct" 
            ADD COLUMN "${column.name}" ${column.type};
          `;
          console.log(`✅ Colonne ${column.name} ajoutée`);
        } else {
          throw error;
        }
      }
    }

    // 3. Ajouter l'index manquant sur VendorProduct.status
    try {
      await prisma.$executeRaw`
        CREATE INDEX "VendorProduct_status_idx" ON "VendorProduct"("status");
      `;
      console.log('✅ Index VendorProduct_status_idx créé');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Index VendorProduct_status_idx existe déjà');
      } else {
        throw error;
      }
    }

    // 4. Ajouter les contraintes de clé étrangère
    console.log('🔗 Ajout des contraintes de clé étrangère...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "VendorProductImage" 
        ADD CONSTRAINT "VendorProductImage_vendorProductId_fkey" 
        FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `;
      console.log('✅ Contrainte vendorProductId ajoutée');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Contrainte vendorProductId existe déjà');
      } else {
        console.warn('⚠️ Erreur contrainte vendorProductId:', error.message);
      }
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "VendorProductImage" 
        ADD CONSTRAINT "VendorProductImage_colorId_fkey" 
        FOREIGN KEY ("colorId") REFERENCES "ColorVariation"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `;
      console.log('✅ Contrainte colorId ajoutée');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Contrainte colorId existe déjà');
      } else {
        console.warn('⚠️ Erreur contrainte colorId:', error.message);
      }
    }

    // 5. Vérification finale
    console.log('🔍 Vérification finale...');
    
    const vendorProductCount = await prisma.vendorProduct.count();
    const vendorImageCount = await prisma.vendorProductImage.count();
    
    console.log(`📊 Produits vendeur: ${vendorProductCount}`);
    console.log(`📊 Images produits vendeur: ${vendorImageCount}`);
    
    // Afficher quelques exemples
    if (vendorProductCount > 0) {
      const sampleProducts = await prisma.vendorProduct.findMany({
        take: 3,
        include: {
          images: true
        }
      });
      
      console.log('📋 Exemples de produits vendeur:');
      sampleProducts.forEach(product => {
        console.log(`  - Produit ${product.id}: ${product.vendorName || 'Sans nom'} (${product.images.length} images)`);
      });
    }

    console.log('✅ Migration VendorProductImage terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
if (require.main === module) {
  applyVendorImagesMigration()
    .then(() => {
      console.log('🎉 Migration terminée!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { applyVendorImagesMigration }; 