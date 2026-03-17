const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRelations() {
  console.log('🔍 Vérification des relations des VendorProduct...\n');

  try {
    // Récupérer tous les VendorProduct avec leurs relations
    const vendorProducts = await prisma.vendorProduct.findMany({
      where: {
        isBestSeller: true,
        isValidated: true,
        status: 'PUBLISHED',
        isDelete: false,
        salesCount: { gte: 1 }
      },
      include: {
        baseProduct: {
          include: {
            categories: true,
            colorVariations: {
              include: {
                images: {
                  include: {
                    delimitations: true
                  }
                }
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile_photo_url: true,
            shop_name: true
          }
        }
      }
    });

    console.log(`📊 Total VendorProduct trouvés: ${vendorProducts.length}\n`);

    for (const product of vendorProducts) {
      console.log(`\n📦 Produit ID: ${product.id} - ${product.name}`);
      console.log(`   Base Product: ${product.baseProduct.name} (ID: ${product.baseProduct.id})`);
      console.log(`   Categories: ${product.baseProduct.categories.length}`);
      console.log(`   Color Variations: ${product.baseProduct.colorVariations.length}`);
      
      // Vérifier les color variations
      for (const colorVar of product.baseProduct.colorVariations) {
        console.log(`     - ${colorVar.name}: ${colorVar.images.length} images`);
        for (const image of colorVar.images) {
          console.log(`       * Image ${image.id}: ${image.delimitations.length} délimitations`);
        }
      }
      
      console.log(`   Vendeur: ${product.vendor.firstName} ${product.vendor.lastName}`);
    }

    // Vérifier s'il y a des produits sans relations complètes
    console.log('\n🔍 Vérification des produits sans relations complètes...');
    
    const incompleteProducts = vendorProducts.filter(product => 
      product.baseProduct.categories.length === 0 || 
      product.baseProduct.colorVariations.length === 0
    );

    if (incompleteProducts.length > 0) {
      console.log(`⚠️ ${incompleteProducts.length} produits avec des relations incomplètes:`);
      for (const product of incompleteProducts) {
        console.log(`   - ${product.name}: ${product.baseProduct.categories.length} catégories, ${product.baseProduct.colorVariations.length} variations`);
      }
    } else {
      console.log('✅ Tous les produits ont des relations complètes');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkRelations();
}

module.exports = { checkRelations }; 