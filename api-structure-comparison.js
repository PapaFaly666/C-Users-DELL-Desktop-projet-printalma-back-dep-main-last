/**
 * Script de comparaison des structures API
 * Compare /vendor/products et /public/new-arrivals selon les exigences de res.md
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3004';
const ENDPOINTS = {
  vendorProducts: `${BASE_URL}/public/vendor-products?limit=1`,
  newArrivals: `${BASE_URL}/public/new-arrivals?limit=1`
};

/**
 * Extrait récursivement tous les champs d'un objet
 */
function extractFields(obj, prefix = '') {
  const fields = new Set();
  
  if (typeof obj !== 'object' || obj === null) {
    return fields;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    fields.add(fullKey);
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        // Pour les arrays, analyser le premier élément
        const subFields = extractFields(value[0], fullKey + '[0]');
        subFields.forEach(field => fields.add(field));
      } else if (!Array.isArray(value)) {
        // Pour les objets
        const subFields = extractFields(value, fullKey);
        subFields.forEach(field => fields.add(field));
      }
    }
  }
  
  return fields;
}

/**
 * Compare deux objets au niveau d'un champ spécifique
 */
function compareNestedObject(obj1, obj2, path) {
  const getValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[0]')) {
        const arrayKey = key.replace('[0]', '');
        return current?.[arrayKey]?.[0];
      }
      return current?.[key];
    }, obj);
  };
  
  const value1 = getValue(obj1, path);
  const value2 = getValue(obj2, path);
  
  if (typeof value1 === 'object' && typeof value2 === 'object') {
    const fields1 = extractFields(value1);
    const fields2 = extractFields(value2);
    
    const common = [...fields1].filter(field => fields2.has(field));
    const only1 = [...fields1].filter(field => !fields2.has(field));
    const only2 = [...fields2].filter(field => !fields1.has(field));
    
    return { common, only1, only2 };
  }
  
  return { common: [], only1: [], only2: [] };
}

/**
 * Fonction principale de comparaison
 */
async function compareAPIStructures() {
  console.log('🔍 Comparaison des structures API');
  console.log('='.repeat(50));
  
  try {
    // 1. Récupérer les données des deux endpoints
    console.log('\n📡 Récupération des données...');
    
    const [vendorResponse, newArrivalsResponse] = await Promise.all([
      fetch(ENDPOINTS.vendorProducts),
      fetch(ENDPOINTS.newArrivals)
    ]);
    
    if (!vendorResponse.ok) {
      throw new Error(`Vendor products API failed: ${vendorResponse.status}`);
    }
    
    if (!newArrivalsResponse.ok) {
      throw new Error(`New arrivals API failed: ${newArrivalsResponse.status}`);
    }
    
    const vendorData = await vendorResponse.json();
    const newArrivalsData = await newArrivalsResponse.json();
    
    // Extraire le premier produit de chaque endpoint
    const vendorProduct = vendorData.data?.products?.[0];
    const newArrivalProduct = newArrivalsData.data?.[0];
    
    if (!vendorProduct) {
      throw new Error('Aucun produit trouvé dans /vendor/products');
    }
    
    if (!newArrivalProduct) {
      throw new Error('Aucun produit trouvé dans /new-arrivals');
    }
    
    console.log(`✅ Produit vendor: ${vendorProduct.id} - ${vendorProduct.vendorName}`);
    console.log(`✅ Produit new-arrival: ${newArrivalProduct.id} - ${newArrivalProduct.name}`);
    
    // 2. Extraire tous les champs
    const vendorFields = extractFields(vendorProduct);
    const newArrivalFields = extractFields(newArrivalProduct);
    
    // 3. Calculer les différences
    const commonFields = [...vendorFields].filter(field => newArrivalFields.has(field));
    const vendorOnlyFields = [...vendorFields].filter(field => !newArrivalFields.has(field));
    const publicOnlyFields = [...newArrivalFields].filter(field => !vendorFields.has(field));
    
    // 4. Comparer les objets imbriqués importants
    const importantObjects = ['designPositions', 'baseProduct', 'vendor'];
    const fieldComparisons = {};
    
    for (const objName of importantObjects) {
      if (vendorProduct[objName] || newArrivalProduct[objName]) {
        fieldComparisons[objName] = compareNestedObject(vendorProduct, newArrivalProduct, objName);
      }
    }
    
    // Comparaison spéciale pour designPositions[0].position
    if (vendorProduct.designPositions?.[0]?.position && newArrivalProduct.designPositions?.[0]?.position) {
      fieldComparisons['designPositions[0].position'] = compareNestedObject(
        vendorProduct, 
        newArrivalProduct, 
        'designPositions[0].position'
      );
    }
    
    // 5. Analyse détaillée des designPositions (requis spécifiquement dans res.md)
    const designPositionAnalysis = {
      coordinates: {},
      dimensions: {},
      additional: {}
    };
    
    if (vendorProduct.designPositions?.[0]?.position && newArrivalProduct.designPositions?.[0]?.position) {
      const vPos = vendorProduct.designPositions[0].position;
      const nPos = newArrivalProduct.designPositions[0].position;
      
      // Vérifier x, y, width, height (coordinates)
      const coordFields = ['x', 'y', 'width', 'height'];
      for (const field of coordFields) {
        designPositionAnalysis.coordinates[field] = {
          vendor: vPos[field],
          newArrival: nPos[field],
          identical: vPos[field] === nPos[field]
        };
      }
      
      // Vérifier les dimensions
      const dimensionFields = ['designWidth', 'designHeight'];
      for (const field of dimensionFields) {
        designPositionAnalysis.dimensions[field] = {
          vendor: vPos[field],
          newArrival: nPos[field],
          identical: vPos[field] === nPos[field]
        };
      }
      
      // Champs supplémentaires
      const allPosFields = new Set([...Object.keys(vPos), ...Object.keys(nPos)]);
      const basicFields = new Set([...coordFields, ...dimensionFields]);
      const additionalFields = [...allPosFields].filter(field => !basicFields.has(field));
      
      for (const field of additionalFields) {
        designPositionAnalysis.additional[field] = {
          vendor: vPos[field],
          newArrival: nPos[field],
          identical: vPos[field] === nPos[field],
          presentInVendor: vPos[field] !== undefined,
          presentInNewArrival: nPos[field] !== undefined
        };
      }
    }
    
    // 6. Créer le rapport final selon le format demandé dans res.md
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        endpoints: {
          vendorProducts: ENDPOINTS.vendorProducts,
          newArrivals: ENDPOINTS.newArrivals
        },
        sampleProducts: {
          vendor: { id: vendorProduct.id, name: vendorProduct.vendorName },
          newArrival: { id: newArrivalProduct.id, name: newArrivalProduct.name }
        }
      },
      summary: {
        totalFieldsVendor: vendorFields.size,
        totalFieldsNewArrival: newArrivalFields.size,
        commonFieldsCount: commonFields.length,
        vendorOnlyCount: vendorOnlyFields.length,
        publicOnlyCount: publicOnlyFields.length,
        structuralSimilarity: Math.round((commonFields.length / Math.max(vendorFields.size, newArrivalFields.size)) * 100)
      },
      commonFields: commonFields.sort(),
      vendorOnlyFields: vendorOnlyFields.sort(),
      publicOnlyFields: publicOnlyFields.sort(),
      fieldComparisons,
      designPositionAnalysis,
      recommendations: generateRecommendations(designPositionAnalysis, vendorOnlyFields, publicOnlyFields)
    };
    
    // 7. Sauvegarder et afficher le rapport
    const fs = require('fs');
    const reportPath = './api-structure-comparison-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 RAPPORT DE COMPARAISON');
    console.log('='.repeat(25));
    console.log(`✅ Champs communs: ${report.summary.commonFieldsCount}`);
    console.log(`🔵 Spécifiques à vendor: ${report.summary.vendorOnlyCount}`);
    console.log(`🟡 Spécifiques à new-arrivals: ${report.summary.publicOnlyCount}`);
    console.log(`📈 Similarité structurelle: ${report.summary.structuralSimilarity}%`);
    
    console.log('\n🎯 ANALYSE DESIGN POSITIONS');
    console.log('='.repeat(30));
    if (designPositionAnalysis.coordinates.x) {
      console.log(`x: ${designPositionAnalysis.coordinates.x.identical ? '✅' : '❌'} (${designPositionAnalysis.coordinates.x.vendor} vs ${designPositionAnalysis.coordinates.x.newArrival})`);
      console.log(`y: ${designPositionAnalysis.coordinates.y.identical ? '✅' : '❌'} (${designPositionAnalysis.coordinates.y.vendor} vs ${designPositionAnalysis.coordinates.y.newArrival})`);
      console.log(`designWidth: ${designPositionAnalysis.dimensions.designWidth?.identical ? '✅' : '❌'} (${designPositionAnalysis.dimensions.designWidth?.vendor} vs ${designPositionAnalysis.dimensions.designWidth?.newArrival})`);
      console.log(`designHeight: ${designPositionAnalysis.dimensions.designHeight?.identical ? '✅' : '❌'} (${designPositionAnalysis.dimensions.designHeight?.vendor} vs ${designPositionAnalysis.dimensions.designHeight?.newArrival})`);
    }
    
    console.log(`\n📋 Rapport détaillé sauvegardé: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error.message);
    console.log('\n🔄 Tentative d\'utilisation des fichiers d\'exemple...');
    
    try {
      // Utiliser les fichiers d'exemple si les APIs ne sont pas disponibles
      const fs = require('fs');
      const vendorData = JSON.parse(fs.readFileSync('./example-vendor-product.json', 'utf8'));
      const newArrivalsData = JSON.parse(fs.readFileSync('./example-new-arrival.json', 'utf8'));
      
      console.log('✅ Fichiers d\'exemple chargés avec succès');
      
      // Extraire le premier produit de chaque exemple
      const vendorProduct = vendorData.data?.products?.[0];
      const newArrivalProduct = newArrivalsData.data?.[0];
      
      if (!vendorProduct) {
        throw new Error('Aucun produit trouvé dans example-vendor-product.json');
      }
      
      if (!newArrivalProduct) {
        throw new Error('Aucun produit trouvé dans example-new-arrival.json');
      }
      
      console.log(`📝 Produit vendor: ${vendorProduct.id} - ${vendorProduct.vendorName}`);
      console.log(`📝 Produit new-arrival: ${newArrivalProduct.id} - ${newArrivalProduct.name}`);
      
      // Continuer avec la même logique de comparaison...
      const vendorFields = extractFields(vendorProduct);
      const newArrivalFields = extractFields(newArrivalProduct);
      
      const commonFields = [...vendorFields].filter(field => newArrivalFields.has(field));
      const vendorOnlyFields = [...vendorFields].filter(field => !newArrivalFields.has(field));
      const publicOnlyFields = [...newArrivalFields].filter(field => !vendorFields.has(field));
      
      const importantObjects = ['designPositions', 'baseProduct', 'vendor'];
      const fieldComparisons = {};
      
      for (const objName of importantObjects) {
        if (vendorProduct[objName] || newArrivalProduct[objName]) {
          fieldComparisons[objName] = compareNestedObject(vendorProduct, newArrivalProduct, objName);
        }
      }
      
      if (vendorProduct.designPositions?.[0]?.position && newArrivalProduct.designPositions?.[0]?.position) {
        fieldComparisons['designPositions[0].position'] = compareNestedObject(
          vendorProduct, 
          newArrivalProduct, 
          'designPositions[0].position'
        );
      }
      
      const designPositionAnalysis = {
        coordinates: {},
        dimensions: {},
        additional: {}
      };
      
      if (vendorProduct.designPositions?.[0]?.position && newArrivalProduct.designPositions?.[0]?.position) {
        const vPos = vendorProduct.designPositions[0].position;
        const nPos = newArrivalProduct.designPositions[0].position;
        
        const coordFields = ['x', 'y', 'width', 'height'];
        for (const field of coordFields) {
          designPositionAnalysis.coordinates[field] = {
            vendor: vPos[field],
            newArrival: nPos[field],
            identical: vPos[field] === nPos[field]
          };
        }
        
        const dimensionFields = ['designWidth', 'designHeight'];
        for (const field of dimensionFields) {
          designPositionAnalysis.dimensions[field] = {
            vendor: vPos[field],
            newArrival: nPos[field],
            identical: vPos[field] === nPos[field]
          };
        }
        
        const allPosFields = new Set([...Object.keys(vPos), ...Object.keys(nPos)]);
        const basicFields = new Set([...coordFields, ...dimensionFields]);
        const additionalFields = [...allPosFields].filter(field => !basicFields.has(field));
        
        for (const field of additionalFields) {
          designPositionAnalysis.additional[field] = {
            vendor: vPos[field],
            newArrival: nPos[field],
            identical: vPos[field] === nPos[field],
            presentInVendor: vPos[field] !== undefined,
            presentInNewArrival: nPos[field] !== undefined
          };
        }
      }
      
      const report = {
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'example-files',
          note: 'Rapport généré à partir de fichiers d\'exemple car les APIs ne sont pas disponibles',
          sampleProducts: {
            vendor: { id: vendorProduct.id, name: vendorProduct.vendorName || vendorProduct.name },
            newArrival: { id: newArrivalProduct.id, name: newArrivalProduct.name }
          }
        },
        summary: {
          totalFieldsVendor: vendorFields.size,
          totalFieldsNewArrival: newArrivalFields.size,
          commonFieldsCount: commonFields.length,
          vendorOnlyCount: vendorOnlyFields.length,
          publicOnlyCount: publicOnlyFields.length,
          structuralSimilarity: Math.round((commonFields.length / Math.max(vendorFields.size, newArrivalFields.size)) * 100)
        },
        commonFields: commonFields.sort(),
        vendorOnlyFields: vendorOnlyFields.sort(),
        publicOnlyFields: publicOnlyFields.sort(),
        fieldComparisons,
        designPositionAnalysis,
        recommendations: generateRecommendations(designPositionAnalysis, vendorOnlyFields, publicOnlyFields)
      };
      
      const fs2 = require('fs');
      const reportPath = './api-structure-comparison-report.json';
      fs2.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 RAPPORT DE COMPARAISON (À partir d\'exemples)');
      console.log('='.repeat(25));
      console.log(`✅ Champs communs: ${report.summary.commonFieldsCount}`);
      console.log(`🔵 Spécifiques à vendor: ${report.summary.vendorOnlyCount}`);
      console.log(`🟡 Spécifiques à new-arrivals: ${report.summary.publicOnlyCount}`);
      console.log(`📈 Similarité structurelle: ${report.summary.structuralSimilarity}%`);
      
      console.log('\n🎯 ANALYSE DESIGN POSITIONS');
      console.log('='.repeat(30));
      if (designPositionAnalysis.coordinates.x) {
        console.log(`x: ${designPositionAnalysis.coordinates.x.identical ? '✅' : '❌'} (${designPositionAnalysis.coordinates.x.vendor} vs ${designPositionAnalysis.coordinates.x.newArrival})`);
        console.log(`y: ${designPositionAnalysis.coordinates.y.identical ? '✅' : '❌'} (${designPositionAnalysis.coordinates.y.vendor} vs ${designPositionAnalysis.coordinates.y.newArrival})`);
        console.log(`designWidth: ${designPositionAnalysis.dimensions.designWidth?.identical ? '✅' : '❌'} (${designPositionAnalysis.dimensions.designWidth?.vendor} vs ${designPositionAnalysis.dimensions.designWidth?.newArrival})`);
        console.log(`designHeight: ${designPositionAnalysis.dimensions.designHeight?.identical ? '✅' : '❌'} (${designPositionAnalysis.dimensions.designHeight?.vendor} vs ${designPositionAnalysis.dimensions.designHeight?.newArrival})`);
      }
      
      console.log(`\n📋 Rapport détaillé sauvegardé: ${reportPath}`);
      
      return report;
      
    } catch (exampleError) {
      console.error('❌ Erreur avec les fichiers d\'exemple:', exampleError.message);
      
      const errorReport = {
        error: true,
        message: error.message,
        exampleError: exampleError.message,
        timestamp: new Date().toISOString(),
        troubleshooting: [
          'Vérifiez que le backend tourne sur le port 3004',
          'Vérifiez que les endpoints /public/vendor-products et /public/new-arrivals existent',
          'Vérifiez qu\'il y a des données dans la base',
          'Vérifiez que les fichiers example-vendor-product.json et example-new-arrival.json existent'
        ]
      };
      
      console.log('\n🔧 Guide de dépannage:');
      errorReport.troubleshooting.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
      
      return errorReport;
    }
  }
}

/**
 * Génère des recommandations basées sur l'analyse
 */
function generateRecommendations(designAnalysis, vendorOnly, publicOnly) {
  const recommendations = [];
  
  if (designAnalysis.coordinates?.x && !designAnalysis.coordinates.x.identical) {
    recommendations.push({
      type: 'critical',
      issue: 'Position x différente entre les APIs',
      impact: 'Affichage des designs incohérent',
      solution: 'Utiliser la même fonction de calcul de position dans les deux services'
    });
  }
  
  if (designAnalysis.coordinates?.y && !designAnalysis.coordinates.y.identical) {
    recommendations.push({
      type: 'critical',
      issue: 'Position y différente entre les APIs',
      impact: 'Affichage des designs incohérent',
      solution: 'Utiliser la même fonction de calcul de position dans les deux services'
    });
  }
  
  if (designAnalysis.dimensions?.designWidth && !designAnalysis.dimensions.designWidth.identical) {
    recommendations.push({
      type: 'major',
      issue: 'Dimensions designWidth différentes',
      impact: 'Taille des designs incohérente',
      solution: 'Standardiser la récupération des dimensions de design'
    });
  }
  
  if (vendorOnly.length > 20) {
    recommendations.push({
      type: 'info',
      issue: `Beaucoup de champs spécifiques au vendor (${vendorOnly.length})`,
      impact: 'Les APIs servent des besoins différents',
      solution: 'Considérer créer des DTOs spécifiques ou unifier les structures'
    });
  }
  
  return recommendations;
}

// Exécution
if (require.main === module) {
  compareAPIStructures().then((report) => {
    if (!report.error) {
      console.log('\n✅ Comparaison terminée avec succès');
    }
    process.exit(0);
  });
}

module.exports = {
  compareAPIStructures,
  extractFields,
  compareNestedObject
};