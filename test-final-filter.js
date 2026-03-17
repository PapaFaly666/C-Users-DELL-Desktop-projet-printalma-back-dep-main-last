const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testFinalFilter() {
  try {
    console.log('🔍 Test final du filtre par catégorie...');

    // Test avec la nouvelle approche: chercher categoryId d'abord
    console.log('\n1. Recherche de la catégorie "Test":');
    const category = await prisma.designCategory.findFirst({
      where: {
        name: {
          equals: 'Test',
          mode: 'insensitive'
        }
      }
    });

    console.log(`Catégorie trouvée: ID=${category?.id || 'NULL'}, Name=${category?.name || 'NULL'}`);

    if (category) {
      console.log('\n2. Produits avec categoryId =', category.id, ':');
      const products = await prisma.vendorProduct.findMany({
        where: {
          design: {
            categoryId: category.id
          }
        },
        take: 5,
        include: {
          design: {
            include: {
              category: true
            }
          }
        }
      });

      console.log(`Nombre de produits trouvés: ${products.length}`);
      products.forEach(p => {
        console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name} | Catégorie: ${p.design?.category?.name} (ID: ${p.design?.categoryId})`);
      });
    }

    // Test avec une catégorie inexistante
    console.log('\n3. Test avec catégorie "Inexistante":');
    const nonExistentCategory = await prisma.designCategory.findFirst({
      where: {
        name: {
          equals: 'Inexistante',
          mode: 'insensitive'
        }
      }
    });

    console.log(`Catégorie "Inexistante" trouvée: ${nonExistentCategory ? 'OUI' : 'NON'}`);

    if (!nonExistentCategory) {
      console.log('Simulation: filtrage avec categoryId = -1');
      const emptyResult = await prisma.vendorProduct.findMany({
        where: {
          design: {
            categoryId: -1
          }
        },
        take: 3
      });
      console.log(`Résultats avec categoryId = -1: ${emptyResult.length} produits`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalFilter();