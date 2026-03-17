const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log('🧹 Nettoyage des doublons dans les produits vendeur...\n');

  try {
    // 1. Identifier les doublons
    console.log('1️⃣ Identification des doublons...');
    
    const duplicates = await prisma.$queryRaw`
      SELECT vendor_id, base_product_id, design_id, COUNT(*) as count
      FROM "VendorProduct" 
      WHERE "isDelete" = false
      GROUP BY vendor_id, base_product_id, design_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon trouvé. Base de données propre !');
      return;
    }

    console.log(`❌ ${duplicates.length} groupes de doublons trouvés:`);
    duplicates.forEach(dup => {
      console.log(`   - Vendor: ${dup.vendor_id}, BaseProduct: ${dup.base_product_id}, Design: ${dup.design_id}, Count: ${dup.count}`);
    });

    // 2. Nettoyer les doublons
    console.log('\n2️⃣ Nettoyage des doublons...');
    
    let totalDeleted = 0;
    
    for (const dup of duplicates) {
      console.log(`\n🧹 Nettoyage du groupe: Vendor ${dup.vendor_id}, BaseProduct ${dup.base_product_id}, Design ${dup.design_id}`);
      
      // Récupérer tous les produits de ce groupe
      const products = await prisma.vendorProduct.findMany({
        where: {
          vendorId: dup.vendor_id,
          baseProductId: dup.base_product_id,
          designId: dup.design_id,
          isDelete: false
        },
        orderBy: { createdAt: 'asc' } // Garder le plus ancien
      });

      console.log(`   Trouvé ${products.length} produits pour ce groupe`);
      
      if (products.length > 1) {
        // Garder le premier (le plus ancien) et supprimer les autres
        const toDelete = products.slice(1);
        
        console.log(`   Garde le produit ID ${products[0].id} (le plus ancien)`);
        console.log(`   Supprime ${toDelete.length} doublons:`);
        
        for (const product of toDelete) {
          console.log(`     - Suppression du produit ID ${product.id} (créé le ${product.createdAt})`);
          
          // Soft delete du produit
          await prisma.vendorProduct.update({
            where: { id: product.id },
            data: { isDelete: true }
          });
          
          totalDeleted++;
        }
      }
    }

    console.log(`\n✅ Nettoyage terminé ! ${totalDeleted} doublons supprimés.`);

    // 3. Vérification post-nettoyage
    console.log('\n3️⃣ Vérification post-nettoyage...');
    
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT vendor_id, base_product_id, design_id, COUNT(*) as count
      FROM "VendorProduct" 
      WHERE "isDelete" = false
      GROUP BY vendor_id, base_product_id, design_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (remainingDuplicates.length === 0) {
      console.log('✅ Aucun doublon restant. Nettoyage réussi !');
    } else {
      console.log(`❌ ${remainingDuplicates.length} groupes de doublons restent:`);
      remainingDuplicates.forEach(dup => {
        console.log(`   - Vendor: ${dup.vendor_id}, BaseProduct: ${dup.base_product_id}, Design: ${dup.design_id}, Count: ${dup.count}`);
      });
    }

    // 4. Statistiques finales
    console.log('\n4️⃣ Statistiques finales...');
    
    const totalProducts = await prisma.vendorProduct.count({
      where: { isDelete: false }
    });
    
    const totalVendors = await prisma.user.count({
      where: { role: 'VENDOR' }
    });
    
    console.log(`   Produits totaux: ${totalProducts}`);
    console.log(`   Vendeurs totaux: ${totalVendors}`);
    console.log(`   Doublons supprimés: ${totalDeleted}`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour ajouter des contraintes d'unicité
async function addUniquenessConstraints() {
  console.log('\n🔒 Ajout de contraintes d\'unicité...');
  
  try {
    // Note: Les contraintes d'unicité doivent être ajoutées via une migration Prisma
    console.log('📝 Pour ajouter des contraintes d\'unicité, créez une migration Prisma:');
    console.log('   npx prisma migrate dev --name add-uniqueness-constraints');
    console.log('');
    console.log('   Ajoutez dans le schéma Prisma:');
    console.log('   @@unique([vendorId, baseProductId, designId])');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des contraintes:', error);
  }
}

// Exécuter le nettoyage
async function runCleanup() {
  console.log('🚀 Démarrage du nettoyage des doublons...\n');
  
  await cleanDuplicates();
  await addUniquenessConstraints();
  
  console.log('\n✅ Nettoyage terminé !');
}

runCleanup().catch(console.error); 

const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log('🧹 Nettoyage des doublons dans les produits vendeur...\n');

  try {
    // 1. Identifier les doublons
    console.log('1️⃣ Identification des doublons...');
    
    const duplicates = await prisma.$queryRaw`
      SELECT vendor_id, base_product_id, design_id, COUNT(*) as count
      FROM "VendorProduct" 
      WHERE "isDelete" = false
      GROUP BY vendor_id, base_product_id, design_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon trouvé. Base de données propre !');
      return;
    }

    console.log(`❌ ${duplicates.length} groupes de doublons trouvés:`);
    duplicates.forEach(dup => {
      console.log(`   - Vendor: ${dup.vendor_id}, BaseProduct: ${dup.base_product_id}, Design: ${dup.design_id}, Count: ${dup.count}`);
    });

    // 2. Nettoyer les doublons
    console.log('\n2️⃣ Nettoyage des doublons...');
    
    let totalDeleted = 0;
    
    for (const dup of duplicates) {
      console.log(`\n🧹 Nettoyage du groupe: Vendor ${dup.vendor_id}, BaseProduct ${dup.base_product_id}, Design ${dup.design_id}`);
      
      // Récupérer tous les produits de ce groupe
      const products = await prisma.vendorProduct.findMany({
        where: {
          vendorId: dup.vendor_id,
          baseProductId: dup.base_product_id,
          designId: dup.design_id,
          isDelete: false
        },
        orderBy: { createdAt: 'asc' } // Garder le plus ancien
      });

      console.log(`   Trouvé ${products.length} produits pour ce groupe`);
      
      if (products.length > 1) {
        // Garder le premier (le plus ancien) et supprimer les autres
        const toDelete = products.slice(1);
        
        console.log(`   Garde le produit ID ${products[0].id} (le plus ancien)`);
        console.log(`   Supprime ${toDelete.length} doublons:`);
        
        for (const product of toDelete) {
          console.log(`     - Suppression du produit ID ${product.id} (créé le ${product.createdAt})`);
          
          // Soft delete du produit
          await prisma.vendorProduct.update({
            where: { id: product.id },
            data: { isDelete: true }
          });
          
          totalDeleted++;
        }
      }
    }

    console.log(`\n✅ Nettoyage terminé ! ${totalDeleted} doublons supprimés.`);

    // 3. Vérification post-nettoyage
    console.log('\n3️⃣ Vérification post-nettoyage...');
    
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT vendor_id, base_product_id, design_id, COUNT(*) as count
      FROM "VendorProduct" 
      WHERE "isDelete" = false
      GROUP BY vendor_id, base_product_id, design_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (remainingDuplicates.length === 0) {
      console.log('✅ Aucun doublon restant. Nettoyage réussi !');
    } else {
      console.log(`❌ ${remainingDuplicates.length} groupes de doublons restent:`);
      remainingDuplicates.forEach(dup => {
        console.log(`   - Vendor: ${dup.vendor_id}, BaseProduct: ${dup.base_product_id}, Design: ${dup.design_id}, Count: ${dup.count}`);
      });
    }

    // 4. Statistiques finales
    console.log('\n4️⃣ Statistiques finales...');
    
    const totalProducts = await prisma.vendorProduct.count({
      where: { isDelete: false }
    });
    
    const totalVendors = await prisma.user.count({
      where: { role: 'VENDOR' }
    });
    
    console.log(`   Produits totaux: ${totalProducts}`);
    console.log(`   Vendeurs totaux: ${totalVendors}`);
    console.log(`   Doublons supprimés: ${totalDeleted}`);

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour ajouter des contraintes d'unicité
async function addUniquenessConstraints() {
  console.log('\n🔒 Ajout de contraintes d\'unicité...');
  
  try {
    // Note: Les contraintes d'unicité doivent être ajoutées via une migration Prisma
    console.log('📝 Pour ajouter des contraintes d\'unicité, créez une migration Prisma:');
    console.log('   npx prisma migrate dev --name add-uniqueness-constraints');
    console.log('');
    console.log('   Ajoutez dans le schéma Prisma:');
    console.log('   @@unique([vendorId, baseProductId, designId])');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des contraintes:', error);
  }
}

// Exécuter le nettoyage
async function runCleanup() {
  console.log('🚀 Démarrage du nettoyage des doublons...\n');
  
  await cleanDuplicates();
  await addUniquenessConstraints();
  
  console.log('\n✅ Nettoyage terminé !');
}

runCleanup().catch(console.error); 