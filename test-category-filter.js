const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCategoryFilter() {
  try {
    console.log('🔍 Test du filtre par catégorie...');

    // 1. Test sans filtre
    console.log('\n1. Produits sans filtre:');
    const allProducts = await prisma.vendorProduct.findMany({
      take: 3,
      include: {
        design: {
          include: {
            category: true
          }
        }
      }
    });

    allProducts.forEach(p => {
      console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name || 'NULL'} | Catégorie: ${p.design?.category?.name || 'NULL'}`);
    });

    // 2. Test avec filtre par catégorie
    console.log('\n2. Produits avec filtre category=Test:');
    const filteredProducts = await prisma.vendorProduct.findMany({
      where: {
        AND: [
          {
            design: {
              isNot: null
            }
          },
          {
            design: {
              category: {
                name: {
                  equals: 'Test',
                  mode: 'insensitive'
                }
              }
            }
          }
        ]
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

    console.log(`Nombre de résultats: ${filteredProducts.length}`);
    filteredProducts.forEach(p => {
      console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name || 'NULL'} | Catégorie: ${p.design?.category?.name || 'NULL'}`);
    });

    // 3. Test avec catégorie inexistante
    console.log('\n3. Produits avec filtre category=Inexistant:');
    const nonExistentProducts = await prisma.vendorProduct.findMany({
      where: {
        design: {
          category: {
            name: {
              equals: 'Inexistant',
              mode: 'insensitive'
            }
          }
        }
      },
      take: 3,
      include: {
        design: {
          include: {
            category: true
          }
        }
      }
    });

    console.log(`Nombre de résultats: ${nonExistentProducts.length}`);
    nonExistentProducts.forEach(p => {
      console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name || 'NULL'} | Catégorie: ${p.design?.category?.name || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryFilter();