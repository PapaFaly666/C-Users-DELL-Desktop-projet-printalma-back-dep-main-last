// 🔧 EXEMPLE DE CORRECTION - ENDPOINT VENDOR PRODUCTS
// Fichier: vendorProductService.ts

interface VendorProductData {
  baseProductId: number;
  designId: number;
  vendorName: string;
  vendorDescription?: string;
  vendorPrice: number;
  vendorStock?: number;
  adminProduct?: {
    id: number;
    name: string;
    description: string;
    price: number;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string;
        delimitations: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
        }>;
      }>;
    }>;
    sizes: Array<{ id: number; sizeName: string }>;
  };
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
  designScale?: number;
}

class VendorProductService {
  private getAuthToken(): string {
    return localStorage.getItem('jwt_token') || '';
  }

  /**
   * ✅ CRÉER UN PRODUIT VENDEUR (CORRIGÉ)
   */
  async createVendorProduct(productData: VendorProductData) {
    try {
      console.log('📦 Création produit vendeur...');
      
      // ✅ VALIDATION DES DONNÉES REQUISES
      const errors = this.validateProductData(productData);
      if (errors.length > 0) {
        throw new Error(`Données invalides: ${errors.join(', ')}`);
      }
      
      // ✅ STRUCTURE REQUISE POUR L'API
      const payload = {
        baseProductId: productData.baseProductId,
        designId: productData.designId, // ✅ OBLIGATOIRE
        vendorName: productData.vendorName,
        vendorDescription: productData.vendorDescription || '',
        vendorPrice: productData.vendorPrice,
        vendorStock: productData.vendorStock || 10,
        
        // 🎨 STRUCTURE ADMIN (OBLIGATOIRE)
        productStructure: {
          adminProduct: {
            id: productData.baseProductId,
            name: productData.adminProduct?.name || 'Produit Admin',
            description: productData.adminProduct?.description || '',
            price: productData.adminProduct?.price || 0,
            images: {
              colorVariations: productData.adminProduct?.colorVariations || []
            },
            sizes: productData.adminProduct?.sizes || []
          },
          designApplication: {
            positioning: 'CENTER' as const,
            scale: productData.designScale || 0.6
          }
        },
        
        // 🎨 SÉLECTIONS VENDEUR
        selectedColors: productData.selectedColors || [],
        selectedSizes: productData.selectedSizes || [],
        
        // 🔧 OPTIONS
        forcedStatus: 'DRAFT' as const,
        postValidationAction: 'AUTO_PUBLISH' as const
      };

      console.log('📦 Payload:', payload);

      // ✅ APPEL API AVEC AUTHENTIFICATION
      const response = await fetch('/vendor/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Produit créé avec succès:', data);
        return data;
      } else {
        throw new Error(data.message || 'Erreur création produit');
      }
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      throw error;
    }
  }

  /**
   * ✅ VALIDATION DES DONNÉES
   */
  private validateProductData(productData: VendorProductData): string[] {
    const errors = [];
    
    if (!productData.baseProductId) {
      errors.push('baseProductId est requis');
    }
    
    if (!productData.designId) {
      errors.push('designId est requis (nouvelle architecture)');
    }
    
    if (!productData.vendorName) {
      errors.push('vendorName est requis');
    }
    
    if (!productData.vendorPrice) {
      errors.push('vendorPrice est requis');
    }
    
    if (!productData.selectedColors?.length) {
      errors.push('selectedColors est requis');
    }
    
    if (!productData.selectedSizes?.length) {
      errors.push('selectedSizes est requis');
    }
    
    return errors;
  }
}

// 🎨 EXEMPLE D'UTILISATION DANS useVendorPublish.ts
export const useVendorPublish = () => {
  const vendorProductService = new VendorProductService();

  const createVendorProduct = async (productData: VendorProductData) => {
    try {
      console.log('📦 Création produit vendeur via hook...');
      
      // ✅ VALIDATION DES DONNÉES REQUISES
      if (!productData.baseProductId) {
        throw new Error('baseProductId est requis');
      }
      
      if (!productData.designId) {
        throw new Error('designId est requis (nouvelle architecture)');
      }
      
      if (!productData.vendorName) {
        throw new Error('vendorName est requis');
      }
      
      if (!productData.vendorPrice) {
        throw new Error('vendorPrice est requis');
      }

      // ✅ APPEL DU SERVICE
      const result = await vendorProductService.createVendorProduct(productData);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      throw error;
    }
  };

  return { createVendorProduct };
};

// 🎨 EXEMPLE D'UTILISATION DANS SellDesignPage.tsx
export const handlePublishProducts = async (productsToPublish: VendorProductData[]) => {
  try {
    console.log('📦 Publication des produits...');
    
    const results = [];
    
    for (const product of productsToPublish) {
      try {
        // ✅ STRUCTURE COMPLÈTE REQUISE
        const productData: VendorProductData = {
          baseProductId: product.baseProductId,
          designId: product.designId, // ✅ OBLIGATOIRE
          vendorName: product.vendorName,
          vendorDescription: product.vendorDescription || '',
          vendorPrice: product.vendorPrice,
          vendorStock: product.vendorStock || 10,
          
          // 🎨 STRUCTURE ADMIN
          adminProduct: {
            id: product.baseProductId,
            name: product.adminProduct?.name || 'Produit Admin',
            description: product.adminProduct?.description || '',
            price: product.adminProduct?.price || 0,
            colorVariations: product.adminProduct?.colorVariations || [],
            sizes: product.adminProduct?.sizes || []
          },
          
          // 🎨 SÉLECTIONS
          selectedColors: product.selectedColors || [],
          selectedSizes: product.selectedSizes || [],
          
          // 🎨 DESIGN
          designScale: product.designScale || 0.6
        };

        console.log('📦 Données produit:', productData);
        
        const vendorProductService = new VendorProductService();
        const result = await vendorProductService.createVendorProduct(productData);
        console.log('✅ Produit publié:', result);
        
        results.push({ success: true, product: product.vendorName, data: result });
        
      } catch (error) {
        console.error(`❌ Erreur API pour produit ${product.vendorName}:`, error);
        results.push({ success: false, product: product.vendorName, error: error.message });
        // Continuer avec les autres produits
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Erreur publication produits:', error);
    throw error;
  }
};

// 🎨 EXEMPLE DE DONNÉES DE TEST
export const exampleProductData: VendorProductData = {
  baseProductId: 1,
  designId: 42,
  vendorName: "T-shirt Dragon Rouge",
  vendorDescription: "T-shirt premium avec design dragon exclusif",
  vendorPrice: 25000,
  vendorStock: 100,
  adminProduct: {
    id: 1,
    name: "T-shirt Basique",
    description: "T-shirt en coton 100% de qualité premium",
    price: 19000,
    colorVariations: [
      {
        id: 12,
        name: "Rouge",
        colorCode: "#ff0000",
        images: [
          {
            id: 101,
            url: "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
            viewType: "FRONT",
            delimitations: [
              { x: 150, y: 200, width: 200, height: 200, coordinateType: "ABSOLUTE" }
            ]
          }
        ]
      }
    ],
    sizes: [
      { id: 1, sizeName: "S" },
      { id: 2, sizeName: "M" },
      { id: 3, sizeName: "L" }
    ]
  },
  selectedColors: [
    { id: 12, name: "Rouge", colorCode: "#ff0000" }
  ],
  selectedSizes: [
    { id: 1, sizeName: "S" },
    { id: 2, sizeName: "M" }
  ],
  designScale: 0.6
}; 