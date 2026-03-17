const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Création d\'un produit de test avec catégorie ID 39, sous-catégorie ID 44, variation ID 70...');

  const product = await prisma.product.create({
    data: {
      name: 'Produit Test Protection',
      description: 'Produit pour tester la protection de suppression',
      price: 29.99,
      stock: 100,
      categoryId: 39,
      subCategoryId: 44,
      variationId: 70,
      genre: 'UNISEXE',
      status: 'DRAFT'
    }
  });

  console.log('✅ Produit créé avec succès!');
  console.log('   ID:', product.id);
  console.log('   Nom:', product.name);
  console.log('   Catégorie ID:', product.categoryId);
  console.log('   Sous-catégorie ID:', product.subCategoryId);
  console.log('   Variation ID:', product.variationId);

  return product.id;
}

main()
  .then((productId) => {
    console.log('\n🎯 Produit ID à retenir:', productId);
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
