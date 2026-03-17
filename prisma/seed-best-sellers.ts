import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedBestSellers() {
  console.log('🌱 Initialisation des données de test pour les meilleures ventes...');

  try {
    // Créer des catégories si elles n'existent pas
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Vêtements' },
        update: {},
        create: {
          name: 'Vêtements',
          slug: 'vetements',
          description: 'Catégorie de vêtements',
          displayOrder: 1,
        },
      }),
      prisma.category.upsert({
        where: { name: 'Accessoires' },
        update: {},
        create: {
          name: 'Accessoires',
          slug: 'accessoires',
          description: 'Catégorie d\'accessoires',
          displayOrder: 2,
        },
      }),
    ]);

    // Créer des produits de base (admin)
    const baseProducts = await Promise.all([
      prisma.product.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'T-shirt Premium',
          description: 'T-shirt de haute qualité',
          price: 15000,
          stock: 100,
          status: 'PUBLISHED',
          genre: 'UNISEXE',
          categoryId: categories[0].id,
        },
      }),
      prisma.product.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Sweat à Capuche',
          description: 'Sweat confortable avec capuche',
          price: 25000,
          stock: 50,
          status: 'PUBLISHED',
          genre: 'UNISEXE',
          categoryId: categories[0].id,
        },
      }),
      prisma.product.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'Jean Slim',
          description: 'Jean slim fit élégant',
          price: 30000,
          stock: 30,
          status: 'PUBLISHED',
          genre: 'HOMME',
          categoryId: categories[0].id,
        },
      }),
      prisma.product.upsert({
        where: { id: 4 },
        update: {},
        create: {
          name: 'Robe d\'été',
          description: 'Robe légère et élégante',
          price: 35000,
          stock: 25,
          status: 'PUBLISHED',
          genre: 'FEMME',
          categoryId: categories[0].id,
        },
      }),
      prisma.product.upsert({
        where: { id: 5 },
        update: {},
        create: {
          name: 'Casquette Baseball',
          description: 'Casquette style baseball',
          price: 8000,
          stock: 80,
          status: 'PUBLISHED',
          genre: 'UNISEXE',
          categoryId: categories[1].id,
        },
      }),
    ]);

    // Créer des vendeurs (utilisateurs)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const vendors = await Promise.all([
      prisma.user.upsert({
        where: { email: 'vendeur1@shop.com' },
        update: {},
        create: {
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'vendeur1@shop.com',
          password: hashedPassword,
          role: 'VENDEUR',
          shop_name: 'Mode Chic',
          phone: '0123456789',
          userStatus: 'ACTIVE',
        },
      }),
      prisma.user.upsert({
        where: { email: 'vendeur2@shop.com' },
        update: {},
        create: {
          firstName: 'Jean',
          lastName: 'Durand',
          email: 'vendeur2@shop.com',
          password: hashedPassword,
          role: 'VENDEUR',
          shop_name: 'Urban Style',
          phone: '0234567890',
          userStatus: 'ACTIVE',
        },
      }),
      prisma.user.upsert({
        where: { email: 'vendeur3@shop.com' },
        update: {},
        create: {
          firstName: 'Sophie',
          lastName: 'Petit',
          email: 'vendeur3@shop.com',
          password: hashedPassword,
          role: 'VENDEUR',
          shop_name: 'Sport Wear',
          phone: '0345678901',
          userStatus: 'ACTIVE',
        },
      }),
    ]);

    // Créer des produits vendeurs avec des ventes
    const vendorProducts = await Promise.all([
      // Produits du vendeur 1 (Mode Chic) - meilleures ventes
      prisma.vendorProduct.upsert({
        where: { id: 1 },
        update: {},
        create: {
          baseProductId: baseProducts[0].id,
          vendorId: vendors[0].id,
          name: 'T-shirt Premium - Édition Limitée',
          description: 'Version premium du t-shirt avec design exclusif',
          price: 20000,
          stock: 15,
          status: 'PUBLISHED',
          isValidated: true,
          salesCount: 150,
          totalRevenue: 3000000,
          averageRating: 4.8,
          lastSaleDate: new Date('2024-01-15'),
          isBestSeller: true,
          bestSellerRank: 1,
          viewsCount: 2500,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
          colors: JSON.stringify(['Noir', 'Blanc', 'Gris']),
          vendorName: 'Mode Chic',
          adminProductName: 'T-shirt Premium',
          adminProductDescription: 'T-shirt de haute qualité',
          adminProductPrice: 15000,
          basePriceAdmin: 15000,
        },
      }),
      prisma.vendorProduct.upsert({
        where: { id: 2 },
        update: {},
        create: {
          baseProductId: baseProducts[1].id,
          vendorId: vendors[0].id,
          name: 'Sweat à Capuche - Collection Hiver',
          description: 'Sweat chaud avec design tendance',
          price: 28000,
          stock: 8,
          status: 'PUBLISHED',
          isValidated: true,
          salesCount: 95,
          totalRevenue: 2660000,
          averageRating: 4.6,
          lastSaleDate: new Date('2024-01-14'),
          isBestSeller: true,
          bestSellerRank: 3,
          viewsCount: 1800,
          sizes: JSON.stringify(['M', 'L', 'XL', 'XXL']),
          colors: JSON.stringify(['Bleu marine', 'Gris anthracite']),
          vendorName: 'Mode Chic',
          adminProductName: 'Sweat à Capuche',
          adminProductDescription: 'Sweat confortable avec capuche',
          adminProductPrice: 25000,
          basePriceAdmin: 25000,
        },
      }),

      // Produits du vendeur 2 (Urban Style)
      prisma.vendorProduct.upsert({
        where: { id: 3 },
        update: {},
        create: {
          baseProductId: baseProducts[2].id,
          vendorId: vendors[1].id,
          name: 'Jean Slim - Fit Moderne',
          description: 'Jean slim avec finition premium',
          price: 32000,
          stock: 12,
          status: 'PUBLISHED',
          isValidated: true,
          salesCount: 120,
          totalRevenue: 3840000,
          averageRating: 4.7,
          lastSaleDate: new Date('2024-01-16'),
          isBestSeller: true,
          bestSellerRank: 2,
          viewsCount: 2200,
          sizes: JSON.stringify(['28', '30', '32', '34', '36']),
          colors: JSON.stringify(['Bleu foncé', 'Noir']),
          vendorName: 'Urban Style',
          adminProductName: 'Jean Slim',
          adminProductDescription: 'Jean slim fit élégant',
          adminProductPrice: 30000,
          basePriceAdmin: 30000,
        },
      }),
      prisma.vendorProduct.upsert({
        where: { id: 4 },
        update: {},
        create: {
          baseProductId: baseProducts[4].id,
          vendorId: vendors[1].id,
          name: 'Casquette Streetwear',
          description: 'Casquette tendance du moment',
          price: 10000,
          stock: 25,
          status: 'PUBLISHED',
          isValidated: true,
          salesCount: 85,
          totalRevenue: 850000,
          averageRating: 4.4,
          lastSaleDate: new Date('2024-01-13'),
          isBestSeller: false,
          bestSellerRank: null,
          viewsCount: 1500,
          sizes: JSON.stringify(['Taille unique']),
          colors: JSON.stringify(['Noir', 'Rouge', 'Bleu']),
          vendorName: 'Urban Style',
          adminProductName: 'Casquette Baseball',
          adminProductDescription: 'Casquette style baseball',
          adminProductPrice: 8000,
          basePriceAdmin: 8000,
        },
      }),

      // Produits du vendeur 3 (Sport Wear)
      prisma.vendorProduct.upsert({
        where: { id: 5 },
        update: {},
        create: {
          baseProductId: baseProducts[3].id,
          vendorId: vendors[2].id,
          name: 'Robe d\'été - Élégante',
          description: 'Robe légère pour l\'été',
          price: 38000,
          stock: 18,
          status: 'PUBLISHED',
          isValidated: true,
          salesCount: 65,
          totalRevenue: 2470000,
          averageRating: 4.5,
          lastSaleDate: new Date('2024-01-12'),
          isBestSeller: true,
          bestSellerRank: 4,
          viewsCount: 1200,
          sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
          colors: JSON.stringify(['Blanc', 'Rose poudré', 'Bleu ciel']),
          vendorName: 'Sport Wear',
          adminProductName: 'Robe d\'été',
          adminProductDescription: 'Robe légère et élégante',
          adminProductPrice: 35000,
          basePriceAdmin: 35000,
        },
      }),
      prisma.vendorProduct.upsert({
        where: { id: 6 },
        update: {},
        create: {
          baseProductId: baseProducts[0].id,
          vendorId: vendors[2].id,
          name: 'T-shirt Sport',
          description: 'T-shirt technique pour le sport',
          price: 18000,
          stock: 30,
          status: 'PUBLISHED',
          isValidated: true,
          salesCount: 45,
          totalRevenue: 810000,
          averageRating: 4.3,
          lastSaleDate: new Date('2024-01-11'),
          isBestSeller: false,
          bestSellerRank: null,
          viewsCount: 900,
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          colors: JSON.stringify(['Gris', 'Noir', 'Blanc']),
          vendorName: 'Sport Wear',
          adminProductName: 'T-shirt Premium',
          adminProductDescription: 'T-shirt de haute qualité',
          adminProductPrice: 15000,
          basePriceAdmin: 15000,
        },
      }),
    ]);

    console.log('✅ Données de test initialisées avec succès !');
    console.log(`📊 ${vendorProducts.length} produits vendeurs créés`);
    console.log(`👕 ${vendors.length} vendeurs créés`);
    console.log(`🏷️  ${categories.length} catégories créées`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des données:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedBestSellers();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}