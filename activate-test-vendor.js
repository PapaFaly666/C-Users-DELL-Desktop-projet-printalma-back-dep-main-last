/**
 * Script pour activer le compte vendeur test
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateTestVendor() {
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
    console.log(`   Status actuel: status=${vendor.status}`);
    
    if (vendor.status) {
      console.log('✅ Le compte est déjà actif');
      return;
    }
    
    // Activer le compte
    await prisma.user.update({
      where: { id: vendor.id },
      data: { status: true }
    });
    
    console.log('✅ Compte vendeur activé avec succès !');
    
    // Vérifier les produits vendeur
    const vendorProducts = await prisma.vendorProduct.findMany({
      where: { vendorId: vendor.id },
      select: { id: true, name: true, status: true }
    });
    
    console.log(`📦 Produits vendeur (${vendorProducts.length}):`);
    vendorProducts.forEach(p => {
      console.log(`   - ${p.id}: ${p.name} (${p.status})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateTestVendor(); 
 
 
 
 