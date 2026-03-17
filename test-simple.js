const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSimple() {
  try {
    console.log('🔍 Test simple de Prisma...');

    // 1. Lister toutes les catégories
    console.log('\n1. Toutes les catégories DesignCategory:');
    const allCategories = await prisma.designCategory.findMany({
      take: 5
    });
    console.log(`Nombre total de catégories: ${allCategories.length}`);
    allCategories.forEach(cat => {
      console.log(`- ID: ${cat.id}, Name: "${cat.name}", isActive: ${cat.isActive}`);
    });

    // 2. Vérifier s'il y a un problème de cache
    console.log('\n2. Test avec différents formats:');

    const tests = [
      'Test',
      'test',
      'TEST',
      'Test ',
      ' Test'
    ];

    for (const testName of tests) {
      const result = await prisma.designCategory.findFirst({
        where: {
          name: {
            equals: testName,
            mode: 'insensitive'
          }
        }
      });
      console.log(`- Recherche "${testName}": ${result ? `TROUVÉ (ID: ${result.id})` : 'NON TROUVÉ'}`);
    }

    // 3. Test sans mode insensitive
    console.log('\n3. Test sans mode insensitive:');
    const exactResult = await prisma.designCategory.findFirst({
      where: {
        name: 'Test'
      }
    });
    console.log(`- Recherche exacte "Test": ${exactResult ? `TROUVÉ (ID: ${exactResult.id})` : 'NON TROUVÉ'}`);

    // 4. Test avec contains
    console.log('\n4. Test avec contains:');
    const containsResult = await prisma.designCategory.findFirst({
      where: {
        name: {
          contains: 'Test',
          mode: 'insensitive'
        }
      }
    });
    console.log(`- Recherche contenant "Test": ${containsResult ? `TROUVÉ (ID: ${containsResult.id})` : 'NON TROUVÉ'}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimple();