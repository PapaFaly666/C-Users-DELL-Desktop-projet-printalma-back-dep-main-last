/**
 * Script pour créer des produits vendeur de test
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestVendorProducts() {
  try {
    console.log('🔍 Recherche du vendeur test...');
    
    // Trouver le vendeur test
    const vendor = await prisma.user.findFirst({
      where: { 
        email: 'test.vendeur@example.com',
        role: 'VENDEUR'
      }
    });
    
    if (!vendor) {
      console.log('❌ Vendeur test non trouvé');
      return;
    }
    
    console.log(`📋 Vendeur trouvé: ${vendor.email} (ID: ${vendor.id})`);
    
    // Trouver des produits de base
    const baseProducts = await prisma.product.findMany({
      take: 5,
      select: { id: true, name: true, price: true }
    });
    
    if (baseProducts.length === 0) {
      console.log('❌ Aucun produit de base trouvé');
      return;
    }
    
    console.log(`📦 Produits de base trouvés: ${baseProducts.length}`);
    
    // Créer des produits vendeur
    const vendorProducts = [];
    for (let i = 0; i < baseProducts.length; i++) {
      const baseProduct = baseProducts[i];
      
      const vendorProduct = await prisma.vendorProduct.create({
        data: {
          vendorId: vendor.id,
          baseProductId: baseProduct.id,
          name: `${baseProduct.name} - Test`,
          description: `Produit test pour ${baseProduct.name}`,
          price: Math.round(baseProduct.price * 100), // Prix en centimes
          stock: 10,
          status: 'PUBLISHED', // Statut publié pour les tests
          sizes: JSON.stringify([1, 2, 3]), // Tailles de test
          colors: JSON.stringify([1, 2]), // Couleurs de test
          vendorName: `${baseProduct.name} - Test`,
          vendorDescription: `Description vendeur pour ${baseProduct.name}`,
          vendorStock: 10,
          basePriceAdmin: baseProduct.price,
          isValidated: true,
          validatedAt: new Date(),
          validatedBy: 1 // Admin ID
        }
      });
      
      vendorProducts.push(vendorProduct);
      console.log(`✅ Produit créé: ${vendorProduct.id} - ${vendorProduct.name}`);
    }
    
    console.log(`\n🎉 ${vendorProducts.length} produits vendeur créés avec succès !`);
    console.log('📋 IDs des produits créés:');
    vendorProducts.forEach(p => {
      console.log(`   - ${p.id}: ${p.name}`);
    });
    
    // Créer un design test si nécessaire
    let design = await prisma.design.findFirst({
      where: { vendorId: vendor.id }
    });
    
    if (!design) {
      design = await prisma.design.create({
        data: {
          vendorId: vendor.id,
          name: 'Design Test',
          description: 'Design pour tests des positions',
          category: 'LOGO',
          imageUrl: 'https://res.cloudinary.com/test/image/upload/v1/test-design.png',
          cloudinaryPublicId: 'test-design',
          format: 'PNG',
          isPublished: true,
          isValidated: true,
          validatedAt: new Date(),
          validatedBy: 1
        }
      });
      console.log(`✅ Design créé: ${design.id} - ${design.name}`);
    } else {
      console.log(`✅ Design existant: ${design.id} - ${design.name}`);
    }
    
    console.log(`\n🧪 Prêt pour les tests avec:`);
    console.log(`   - Vendeur ID: ${vendor.id}`);
    console.log(`   - Design ID: ${design.id}`);
    console.log(`   - Produits vendeur: ${vendorProducts.map(p => p.id).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestVendorProducts(); 
 
 
 
 