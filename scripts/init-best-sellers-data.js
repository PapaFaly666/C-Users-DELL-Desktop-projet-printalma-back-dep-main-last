const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeBestSellersData() {
  console.log('🏆 Initialisation des données Best Sellers...\n');

  try {
    // 1. Vérifier s'il y a des VendorProduct existants
    const existingVendorProducts = await prisma.vendorProduct.findMany({
      take: 5,
      include: {
        baseProduct: true,
        vendor: true
      }
    });

    if (existingVendorProducts.length === 0) {
      console.log('⚠️ Aucun VendorProduct trouvé. Créons d\'abord des produits de base...');
      
      // Créer des produits de base
      const baseProducts = await prisma.product.findMany({
        take: 5,
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
      });

      if (baseProducts.length === 0) {
        console.log('❌ Aucun produit de base trouvé. Créez d\'abord des produits.');
        return;
      }

      // Créer des vendeurs si nécessaire
      const vendors = await prisma.user.findMany({
        where: {
          role: 'VENDOR'
        },
        take: 3
      });

      if (vendors.length === 0) {
        console.log('❌ Aucun vendeur trouvé. Créez d\'abord des vendeurs.');
        return;
      }

      // Créer des VendorProduct avec des données de test
      console.log('📦 Création de VendorProduct avec données de test...');
      
      for (let i = 0; i < Math.min(baseProducts.length, vendors.length); i++) {
        const baseProduct = baseProducts[i];
        const vendor = vendors[i];

        await prisma.vendorProduct.create({
          data: {
            name: `Vendor ${baseProduct.name} - ${vendor.firstName}`,
            description: `Produit vendu par ${vendor.firstName} ${vendor.lastName}`,
            price: baseProduct.price + Math.floor(Math.random() * 1000),
            baseProductId: baseProduct.id,
            vendorId: vendor.id,
            isPublished: true,
            isApproved: true,
            
            // 🏆 MÉTADONNÉES BEST SELLERS
            salesCount: Math.floor(Math.random() * 100) + 10,
            totalRevenue: Math.floor(Math.random() * 50000) + 5000,
            averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 à 5.0
            lastSaleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Derniers 30 jours
            isBestSeller: Math.random() > 0.5, // 50% de chance d'être best-seller
            bestSellerRank: Math.floor(Math.random() * 10) + 1,
            bestSellerCategory: ['T-shirts', 'Hoodies', 'Polos'][Math.floor(Math.random() * 3)],
            viewsCount: Math.floor(Math.random() * 1000) + 100,
            
            // 🎨 MÉTADONNÉES DESIGN
            designCloudinaryUrl: `https://res.cloudinary.com/example/image/upload/v1/designs/design-${i + 1}.png`,
            designWidth: 800 + Math.floor(Math.random() * 400),
            designHeight: 600 + Math.floor(Math.random() * 300),
            designFormat: ['PNG', 'JPG', 'SVG'][Math.floor(Math.random() * 3)],
            designFileSize: Math.floor(Math.random() * 500000) + 50000,
            designScale: (Math.random() * 0.4 + 0.3).toFixed(2), // 0.3 à 0.7
            designPositioning: ['CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'][Math.floor(Math.random() * 5)]
          }
        });

        console.log(`✅ VendorProduct créé pour ${vendor.firstName} - ${baseProduct.name}`);
      }
    }

    // 2. Mettre à jour les données existantes avec des métriques de best-seller
    console.log('\n📊 Mise à jour des métriques Best Sellers...');
    
    const vendorProducts = await prisma.vendorProduct.findMany({
      include: {
        baseProduct: true,
        vendor: true
      }
    });

    for (const vendorProduct of vendorProducts) {
      // Générer des données réalistes
      const salesCount = Math.floor(Math.random() * 100) + 10;
      const price = vendorProduct.price || 2500;
      const totalRevenue = salesCount * price;
      const averageRating = parseFloat((Math.random() * 2 + 3).toFixed(1));
      const viewsCount = Math.floor(Math.random() * 1000) + 100;
      
      // Déterminer si c'est un best-seller basé sur les ventes
      const isBestSeller = salesCount > 30 || totalRevenue > 50000;
      const bestSellerRank = isBestSeller ? Math.floor(Math.random() * 10) + 1 : null;
      
      // Mettre à jour le VendorProduct
      await prisma.vendorProduct.update({
        where: { id: vendorProduct.id },
        data: {
          salesCount,
          totalRevenue,
          averageRating,
          lastSaleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          isBestSeller,
          bestSellerRank,
          bestSellerCategory: ['T-shirts', 'Hoodies', 'Polos', 'Casquettes', 'Sweats'][Math.floor(Math.random() * 5)],
          viewsCount,
          
          // Métadonnées design si pas déjà présentes
          designCloudinaryUrl: vendorProduct.designCloudinaryUrl || `https://res.cloudinary.com/example/image/upload/v1/designs/design-${vendorProduct.id}.png`,
          designWidth: vendorProduct.designWidth || 800 + Math.floor(Math.random() * 400),
          designHeight: vendorProduct.designHeight || 600 + Math.floor(Math.random() * 300),
          designFormat: vendorProduct.designFormat || ['PNG', 'JPG', 'SVG'][Math.floor(Math.random() * 3)],
          designFileSize: vendorProduct.designFileSize || Math.floor(Math.random() * 500000) + 50000,
          designScale: vendorProduct.designScale || parseFloat((Math.random() * 0.4 + 0.3).toFixed(2)),
          designPositioning: vendorProduct.designPositioning || ['CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'][Math.floor(Math.random() * 5)]
        }
      });

      console.log(`✅ ${vendorProduct.name}: ${salesCount} ventes, ${totalRevenue}€ CA, ${viewsCount} vues`);
    }

    // 3. Mettre à jour les rangs des best-sellers
    console.log('\n🏆 Mise à jour des rangs Best Sellers...');
    
    const bestSellers = await prisma.vendorProduct.findMany({
      where: {
        isBestSeller: true
      },
      orderBy: [
        { salesCount: 'desc' },
        { totalRevenue: 'desc' },
        { viewsCount: 'desc' }
      ]
    });

    for (let i = 0; i < bestSellers.length; i++) {
      await prisma.vendorProduct.update({
        where: { id: bestSellers[i].id },
        data: {
          bestSellerRank: i + 1
        }
      });
      
      console.log(`🏆 Rang ${i + 1}: ${bestSellers[i].name} (${bestSellers[i].salesCount} ventes)`);
    }

    // 4. Statistiques finales
    const stats = await prisma.vendorProduct.aggregate({
      _count: { id: true },
      _sum: { 
        salesCount: true, 
        totalRevenue: true, 
        viewsCount: true 
      },
      _avg: { averageRating: true }
    });

    const bestSellersCount = await prisma.vendorProduct.count({
      where: { isBestSeller: true }
    });

    console.log('\n📈 STATISTIQUES FINALES:');
    console.log(`📦 Total VendorProduct: ${stats._count.id}`);
    console.log(`🏆 Best Sellers: ${bestSellersCount}`);
    console.log(`💰 Total ventes: ${stats._sum.salesCount}`);
    console.log(`💵 Total CA: ${stats._sum.totalRevenue}€`);
    console.log(`👀 Total vues: ${stats._sum.viewsCount}`);
    console.log(`⭐ Note moyenne: ${stats._avg.averageRating?.toFixed(1) || 'N/A'}`);

    console.log('\n🎉 Données Best Sellers initialisées avec succès !');
    console.log('🚀 Vous pouvez maintenant tester l\'API:');
    console.log('   - node quick-test-endpoints.js');
    console.log('   - node test-best-sellers-endpoints.js');
    console.log('   - curl http://localhost:3004/public/best-sellers');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initializeBestSellersData();
}

module.exports = { initializeBestSellersData }; 