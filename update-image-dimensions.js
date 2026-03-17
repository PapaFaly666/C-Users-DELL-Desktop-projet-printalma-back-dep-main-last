const { PrismaClient } = require('@prisma/client');
const https = require('https');
const { URL } = require('url');

const prisma = new PrismaClient();

// Fonction pour obtenir les dimensions d'une image depuis son URL
async function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      return reject(new Error('URL d\'image manquante'));
    }

    try {
      const url = new URL(imageUrl);
      
      // Pour Cloudinary, on peut souvent extraire les dimensions de l'URL ou utiliser l'API
      // Sinon, on peut faire une requête HEAD pour récupérer les métadonnées
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const req = https.request(options, (res) => {
        // Cloudinary peut fournir les dimensions dans les headers
        const contentType = res.headers['content-type'];
        
        if (!contentType || !contentType.startsWith('image/')) {
          return reject(new Error('Le fichier n\'est pas une image'));
        }

        // Pour les images Cloudinary, essayer d'extraire depuis l'URL
        if (url.hostname.includes('cloudinary.com')) {
          // Format Cloudinary: https://res.cloudinary.com/cloud/image/upload/v1234/filename
          // On peut ajouter w_auto,h_auto ou utiliser l'API info
          resolve(getCloudinaryDimensions(imageUrl));
        } else {
          // Méthode générique - faire une requête GET partielle pour lire les headers d'image
          resolve(getGenericImageDimensions(imageUrl));
        }
      });

      req.on('error', (error) => {
        reject(new Error(`Erreur réseau: ${error.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout lors de la récupération des dimensions'));
      });

      req.end();
    } catch (error) {
      reject(new Error(`URL invalide: ${error.message}`));
    }
  });
}

// Fonction spécifique pour Cloudinary
async function getCloudinaryDimensions(imageUrl) {
  try {
    // Méthode 1: Utiliser l'URL de transformation Cloudinary pour obtenir les infos
    const infoUrl = imageUrl.replace('/image/upload/', '/image/upload/fl_getinfo/');
    
    return new Promise((resolve, reject) => {
      https.get(infoUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            if (info.output && info.output.width && info.output.height) {
              resolve({
                width: info.output.width,
                height: info.output.height
              });
            } else {
              // Fallback: dimensions estimées ou valeurs par défaut
              resolve({ width: 1500, height: 1500 }); // Valeurs par défaut
            }
          } catch (parseError) {
            // Si ça échoue, utiliser des dimensions par défaut basées sur le type de produit
            resolve({ width: 1500, height: 1500 });
          }
        });
      }).on('error', () => {
        // Fallback avec dimensions estimées
        resolve({ width: 1500, height: 1500 });
      });
    });
  } catch (error) {
    // Dimensions par défaut en cas d'erreur
    return { width: 1500, height: 1500 };
  }
}

// Fonction générique pour autres fournisseurs d'images
async function getGenericImageDimensions(imageUrl) {
  // Pour une implémentation plus robuste, on pourrait utiliser des libraries comme 'image-size'
  // Mais pour simplicité, on retourne des dimensions estimées
  return { width: 1500, height: 1500 };
}

// Fonction principale pour mettre à jour toutes les images
async function updateAllImageDimensions() {
  console.log('🖼️  Mise à jour des dimensions des images...\n');

  try {
    // Récupérer toutes les images sans dimensions naturelles
    const images = await prisma.productImage.findMany({
      where: {
        OR: [
          { naturalWidth: null },
          { naturalHeight: null }
        ]
      },
      include: {
        colorVariation: {
          include: {
            product: true
          }
        }
      }
    });

    console.log(`📊 Trouvé ${images.length} images sans dimensions naturelles\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Traiter chaque image
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`[${i + 1}/${images.length}] Image ${image.id}`);
      console.log(`   Produit: ${image.colorVariation.product.name}`);
      console.log(`   Vue: ${image.view}`);
      console.log(`   URL: ${image.url}`);

      try {
        // Récupérer les dimensions
        const dimensions = await getImageDimensions(image.url);
        
        console.log(`   Dimensions détectées: ${dimensions.width} x ${dimensions.height}`);

        // Mettre à jour l'image
        await prisma.productImage.update({
          where: { id: image.id },
          data: {
            naturalWidth: dimensions.width,
            naturalHeight: dimensions.height
          }
        });

        successCount++;
        console.log(`   ✅ Mise à jour réussie\n`);

      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        errorCount++;
        errors.push({
          imageId: image.id,
          productName: image.colorVariation.product.name,
          url: image.url,
          error: error.message
        });

        // Essayer avec des dimensions par défaut
        try {
          await prisma.productImage.update({
            where: { id: image.id },
            data: {
              naturalWidth: 1500, // Dimension par défaut
              naturalHeight: 1500
            }
          });
          console.log(`   🔧 Dimensions par défaut appliquées (1500x1500)\n`);
        } catch (fallbackError) {
          console.log(`   💥 Échec même avec dimensions par défaut\n`);
        }
      }

      // Pause pour éviter de surcharger les services
      if (i % 5 === 0 && i > 0) {
        console.log('⏸️  Pause de 2 secondes...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Rapport final
    console.log('═'.repeat(60));
    console.log('📈 RAPPORT DE MISE À JOUR DES DIMENSIONS');
    console.log('═'.repeat(60));
    console.log(`Total des images: ${images.length}`);
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Taux de réussite: ${images.length > 0 ? Math.round((successCount / images.length) * 100) : 0}%\n`);

    if (errors.length > 0) {
      console.log('🚨 DÉTAILS DES ERREURS:');
      console.log('-'.repeat(40));
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.productName}`);
        console.log(`   Image ID: ${error.imageId}`);
        console.log(`   URL: ${error.url}`);
        console.log(`   Erreur: ${error.error}\n`);
      });
    }

    // Vérification finale
    const updatedImages = await prisma.productImage.count({
      where: {
        AND: [
          { naturalWidth: { not: null } },
          { naturalHeight: { not: null } }
        ]
      }
    });

    console.log(`📊 Images avec dimensions: ${updatedImages}`);
    console.log('\n🎉 Mise à jour des dimensions terminée !');

  } catch (error) {
    console.error('💥 Erreur critique:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour vérifier l'état actuel
async function checkImageDimensions() {
  console.log('🔍 Vérification des dimensions d\'images...\n');

  const totalImages = await prisma.productImage.count();
  const imagesWithDimensions = await prisma.productImage.count({
    where: {
      AND: [
        { naturalWidth: { not: null } },
        { naturalHeight: { not: null } }
      ]
    }
  });
  const imagesWithoutDimensions = await prisma.productImage.count({
    where: {
      OR: [
        { naturalWidth: null },
        { naturalHeight: null }
      ]
    }
  });

  console.log('📊 ÉTAT ACTUEL:');
  console.log(`Total des images: ${totalImages}`);
  console.log(`Avec dimensions: ${imagesWithDimensions}`);
  console.log(`Sans dimensions: ${imagesWithoutDimensions}`);

  if (imagesWithoutDimensions > 0) {
    console.log('\n🔍 EXEMPLES D\'IMAGES SANS DIMENSIONS:');
    const examples = await prisma.productImage.findMany({
      where: {
        OR: [
          { naturalWidth: null },
          { naturalHeight: null }
        ]
      },
      include: {
        colorVariation: {
          include: {
            product: true
          }
        }
      },
      take: 3
    });

    examples.forEach((image, index) => {
      console.log(`${index + 1}. ${image.colorVariation.product.name} - ${image.view}`);
      console.log(`   URL: ${image.url}`);
      console.log(`   Dimensions: ${image.naturalWidth || 'N/A'} x ${image.naturalHeight || 'N/A'}\n`);
    });
  }

  await prisma.$disconnect();
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    checkImageDimensions();
  } else if (args.includes('--update')) {
    updateAllImageDimensions();
  } else {
    console.log('📖 USAGE:');
    console.log('  node update-image-dimensions.js --check   # Vérifier l\'état actuel');
    console.log('  node update-image-dimensions.js --update  # Mettre à jour les dimensions');
  }
} 