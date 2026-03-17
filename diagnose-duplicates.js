const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseDuplicates() {
  console.log('🔍 Diagnostic des doublons dans les produits vendeur...\n');

  try {
    // 1. Vérifier les doublons dans la base de données
    console.log('1️⃣ Vérification des doublons dans la base de données...');
    
    const duplicates = await prisma.$queryRaw`
      SELECT vendor_id, base_product_id, design_id, COUNT(*) as count
      FROM "VendorProduct" 
      WHERE "isDelete" = false
      GROUP BY vendor_id, base_product_id, design_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length > 0) {
      console.log('❌ DOUBLONS TROUVÉS dans la base de données:');
      duplicates.forEach(dup => {
        console.log(`   - Vendor: ${dup.vendor_id}, BaseProduct: ${dup.base_product_id}, Design: ${dup.design_id}, Count: ${dup.count}`);
      });
    } else {
      console.log('✅ Aucun doublon trouvé dans la base de données');
    }

    // 2. Vérifier les produits par vendeur
    console.log('\n2️⃣ Vérification des produits par vendeur...');
    
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      select: { id: true, firstName: true, lastName: true }
    });

    for (const vendor of vendors) {
      const products = await prisma.vendorProduct.findMany({
        where: { 
          vendorId: vendor.id,
          isDelete: false 
        },
        select: {
          id: true,
          name: true,
          baseProductId: true,
          designId: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (products.length > 0) {
        console.log(`\n📦 Vendeur ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id}):`);
        console.log(`   Produits totaux: ${products.length}`);
        
        // Vérifier les doublons pour ce vendeur
        const productKeys = products.map(p => `${p.baseProductId}-${p.designId}`);
        const uniqueKeys = [...new Set(productKeys)];
        
        if (productKeys.length !== uniqueKeys.length) {
          console.log(`   ❌ DOUBLONS DÉTECTÉS: ${productKeys.length - uniqueKeys.length} doublons`);
          
          // Identifier les doublons spécifiques
          const duplicates = productKeys.filter((key, index) => productKeys.indexOf(key) !== index);
          const uniqueDuplicates = [...new Set(duplicates)];
          
          uniqueDuplicates.forEach(dupKey => {
            const [baseProductId, designId] = dupKey.split('-');
            const dupProducts = products.filter(p => 
              p.baseProductId === parseInt(baseProductId) && p.designId === parseInt(designId)
            );
            console.log(`     - BaseProduct: ${baseProductId}, Design: ${designId}, Count: ${dupProducts.length}`);
            dupProducts.forEach(p => {
              console.log(`       * ID: ${p.id}, Status: ${p.status}, Created: ${p.createdAt}`);
            });
          });
        } else {
          console.log(`   ✅ Aucun doublon pour ce vendeur`);
        }
      }
    }

    // 3. Tester l'API endpoint
    console.log('\n3️⃣ Test de l\'endpoint API...');
    
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3004';

    try {
      // Test avec un vendeur spécifique
      const testVendorId = vendors[0]?.id;
      if (testVendorId) {
        console.log(`\n🧪 Test de l'endpoint pour le vendeur ${testVendorId}...`);
        
        const response = await axios.get(`${BASE_URL}/vendor/products?vendorId=${testVendorId}`);
        
        if (response.data.success) {
          const products = response.data.data.products;
          console.log(`   Produits retournés par l'API: ${products.length}`);
          
          // Vérifier les doublons dans la réponse API
          const productIds = products.map(p => p.id);
          const uniqueIds = [...new Set(productIds)];
          
          if (productIds.length !== uniqueIds.length) {
            console.log(`   ❌ DOUBLONS dans la réponse API: ${productIds.length - uniqueIds.length} doublons`);
            
            // Identifier les doublons
            const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
            const uniqueDuplicates = [...new Set(duplicates)];
            
            uniqueDuplicates.forEach(dupId => {
              const dupProducts = products.filter(p => p.id === dupId);
              console.log(`     - ID: ${dupId}, Count: ${dupProducts.length}`);
              dupProducts.forEach((p, index) => {
                console.log(`       * Instance ${index + 1}: ${p.vendorName} (${p.status})`);
              });
            });
          } else {
            console.log(`   ✅ Aucun doublon dans la réponse API`);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Impossible de tester l'API: ${error.message}`);
    }

    // 4. Recommandations
    console.log('\n4️⃣ Recommandations:');
    
    if (duplicates.length > 0) {
      console.log('   🔧 Actions nécessaires:');
      console.log('   1. Nettoyer les doublons existants dans la base de données');
      console.log('   2. Ajouter des contraintes d\'unicité');
      console.log('   3. Corriger la logique de création de produits');
    } else {
      console.log('   ✅ Aucune action immédiate nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
diagnoseDuplicates().catch(console.error); 

const prisma = new PrismaClient();

async function diagnoseDuplicates() {
  console.log('🔍 Diagnostic des doublons dans les produits vendeur...\n');

  try {
    // 1. Vérifier les doublons dans la base de données
    console.log('1️⃣ Vérification des doublons dans la base de données...');
    
    const duplicates = await prisma.$queryRaw`
      SELECT vendor_id, base_product_id, design_id, COUNT(*) as count
      FROM "VendorProduct" 
      WHERE "isDelete" = false
      GROUP BY vendor_id, base_product_id, design_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length > 0) {
      console.log('❌ DOUBLONS TROUVÉS dans la base de données:');
      duplicates.forEach(dup => {
        console.log(`   - Vendor: ${dup.vendor_id}, BaseProduct: ${dup.base_product_id}, Design: ${dup.design_id}, Count: ${dup.count}`);
      });
    } else {
      console.log('✅ Aucun doublon trouvé dans la base de données');
    }

    // 2. Vérifier les produits par vendeur
    console.log('\n2️⃣ Vérification des produits par vendeur...');
    
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      select: { id: true, firstName: true, lastName: true }
    });

    for (const vendor of vendors) {
      const products = await prisma.vendorProduct.findMany({
        where: { 
          vendorId: vendor.id,
          isDelete: false 
        },
        select: {
          id: true,
          name: true,
          baseProductId: true,
          designId: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (products.length > 0) {
        console.log(`\n📦 Vendeur ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id}):`);
        console.log(`   Produits totaux: ${products.length}`);
        
        // Vérifier les doublons pour ce vendeur
        const productKeys = products.map(p => `${p.baseProductId}-${p.designId}`);
        const uniqueKeys = [...new Set(productKeys)];
        
        if (productKeys.length !== uniqueKeys.length) {
          console.log(`   ❌ DOUBLONS DÉTECTÉS: ${productKeys.length - uniqueKeys.length} doublons`);
          
          // Identifier les doublons spécifiques
          const duplicates = productKeys.filter((key, index) => productKeys.indexOf(key) !== index);
          const uniqueDuplicates = [...new Set(duplicates)];
          
          uniqueDuplicates.forEach(dupKey => {
            const [baseProductId, designId] = dupKey.split('-');
            const dupProducts = products.filter(p => 
              p.baseProductId === parseInt(baseProductId) && p.designId === parseInt(designId)
            );
            console.log(`     - BaseProduct: ${baseProductId}, Design: ${designId}, Count: ${dupProducts.length}`);
            dupProducts.forEach(p => {
              console.log(`       * ID: ${p.id}, Status: ${p.status}, Created: ${p.createdAt}`);
            });
          });
        } else {
          console.log(`   ✅ Aucun doublon pour ce vendeur`);
        }
      }
    }

    // 3. Tester l'API endpoint
    console.log('\n3️⃣ Test de l\'endpoint API...');
    
    const axios = require('axios');
    const BASE_URL = 'http://localhost:3004';

    try {
      // Test avec un vendeur spécifique
      const testVendorId = vendors[0]?.id;
      if (testVendorId) {
        console.log(`\n🧪 Test de l'endpoint pour le vendeur ${testVendorId}...`);
        
        const response = await axios.get(`${BASE_URL}/vendor/products?vendorId=${testVendorId}`);
        
        if (response.data.success) {
          const products = response.data.data.products;
          console.log(`   Produits retournés par l'API: ${products.length}`);
          
          // Vérifier les doublons dans la réponse API
          const productIds = products.map(p => p.id);
          const uniqueIds = [...new Set(productIds)];
          
          if (productIds.length !== uniqueIds.length) {
            console.log(`   ❌ DOUBLONS dans la réponse API: ${productIds.length - uniqueIds.length} doublons`);
            
            // Identifier les doublons
            const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
            const uniqueDuplicates = [...new Set(duplicates)];
            
            uniqueDuplicates.forEach(dupId => {
              const dupProducts = products.filter(p => p.id === dupId);
              console.log(`     - ID: ${dupId}, Count: ${dupProducts.length}`);
              dupProducts.forEach((p, index) => {
                console.log(`       * Instance ${index + 1}: ${p.vendorName} (${p.status})`);
              });
            });
          } else {
            console.log(`   ✅ Aucun doublon dans la réponse API`);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Impossible de tester l'API: ${error.message}`);
    }

    // 4. Recommandations
    console.log('\n4️⃣ Recommandations:');
    
    if (duplicates.length > 0) {
      console.log('   🔧 Actions nécessaires:');
      console.log('   1. Nettoyer les doublons existants dans la base de données');
      console.log('   2. Ajouter des contraintes d\'unicité');
      console.log('   3. Corriger la logique de création de produits');
    } else {
      console.log('   ✅ Aucune action immédiate nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
diagnoseDuplicates().catch(console.error); 