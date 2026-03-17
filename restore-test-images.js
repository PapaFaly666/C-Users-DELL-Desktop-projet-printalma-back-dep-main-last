const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreTestImages() {
  console.log('🔄 === RESTAURATION IMAGES DE TEST ===\n');

  try {
    // Récupérer les produits vendeur sans images
    const products = await prisma.vendorProduct.findMany({
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true
          }
        },
        images: true
      }
    });

    console.log(`📊 Total produits vendeur: ${products.length}\n`);

    for (const product of products) {
      console.log(`🏷️  PRODUIT ${product.id}: "${product.vendorName || 'Sans nom'}"`);
      console.log(`   Type: ${product.baseProduct.name}`);
      console.log(`   Images actuelles: ${product.images.length}`);

      // Décoder les couleurs du produit
      let decodedColors = [];
      try {
        decodedColors = JSON.parse(product.colors);
      } catch (error) {
        console.log(`   ❌ Impossible de décoder les couleurs: ${error.message}`);
        continue;
      }

      console.log(`   Couleurs configurées: ${decodedColors.map(c => `${c.name} (ID: ${c.id})`).join(', ')}`);

      // Créer des images de test pour chaque couleur si elles n'existent pas
      for (const color of decodedColors) {
        const existingImages = product.images.filter(img => img.colorId === color.id);
        
        if (existingImages.length === 0) {
          console.log(`   📸 Création image de test pour couleur "${color.name}"`);
          
          // Générer une URL de test basée sur le type de produit et la couleur
          const productType = product.baseProduct.name.toLowerCase().replace(/\s+/g, '-');
          const colorName = color.name.toLowerCase().replace(/\s+/g, '-');
          const testImageUrl = `https://res.cloudinary.com/dsxab4qnu/image/upload/v1751322546/vendor-products/test_${productType}_${colorName}_${product.id}_${color.id}.jpg`;
          
          try {
            const newImage = await prisma.vendorProductImage.create({
              data: {
                vendorProductId: product.id,
                colorId: color.id,
                colorName: color.name,
                colorCode: color.colorCode || '#000000',
                imageType: 'color',
                cloudinaryUrl: testImageUrl,
                cloudinaryPublicId: `test_${productType}_${colorName}_${product.id}_${color.id}`,
                originalImageKey: `test_${product.id}_${color.id}`,
                width: 800,
                height: 600,
                fileSize: 150000,
                format: 'jpg',
                createdAt: new Date(),
                uploadedAt: new Date()
              }
            });
            
            console.log(`     ✅ Image ${newImage.id} créée avec succès`);
          } catch (error) {
            console.log(`     ❌ Erreur création image: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Couleur "${color.name}" a déjà ${existingImages.length} image(s)`);
        }
      }
      
      console.log(''); // Ligne vide pour séparation
    }

    console.log('✅ Restauration terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkImagesStatus() {
  console.log('📊 === VÉRIFICATION STATUT IMAGES ===\n');

  try {
    const products = await prisma.vendorProduct.findMany({
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          where: {
            imageType: 'color'
          }
        }
      }
    });

    let totalProducts = 0;
    let productsWithImages = 0;
    let totalImages = 0;

    for (const product of products) {
      totalProducts++;
      
      let decodedColors = [];
      try {
        decodedColors = JSON.parse(product.colors);
      } catch (error) {
        continue;
      }

      const hasAllImages = decodedColors.every(color => 
        product.images.some(img => img.colorId === color.id)
      );

      if (hasAllImages && product.images.length > 0) {
        productsWithImages++;
      }

      totalImages += product.images.length;

      const status = hasAllImages ? '✅' : '❌';
      console.log(`${status} ${product.vendorName || 'Sans nom'} (${product.baseProduct.name}): ${product.images.length}/${decodedColors.length} images`);
    }

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   - Produits totaux: ${totalProducts}`);
    console.log(`   - Produits avec toutes leurs images: ${productsWithImages}`);
    console.log(`   - Images totales: ${totalImages}`);
    console.log(`   - Taux de complétude: ${Math.round((productsWithImages / totalProducts) * 100)}%`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécution principale
async function main() {
  console.log('🔄 RESTAURATION IMAGES DE TEST POUR PRODUITS VENDEUR\n');
  
  // Vérifier l'état actuel
  await checkImagesStatus();
  
  // Demander confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const shouldRestore = await new Promise(resolve => {
    readline.question('\nVoulez-vous restaurer les images manquantes ? (oui/non): ', resolve);
  });
  
  readline.close();

  if (shouldRestore.toLowerCase() === 'oui' || shouldRestore.toLowerCase() === 'o') {
    await restoreTestImages();
    
    // Vérifier l'état après restauration
    console.log('\n📊 ÉTAT APRÈS RESTAURATION:');
    await checkImagesStatus();
  } else {
    console.log('Restauration annulée.');
  }

  console.log('\n🎉 Terminé !');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { restoreTestImages, checkImagesStatus }; 
 
 
 
 
 
 
 
 
 
 
 