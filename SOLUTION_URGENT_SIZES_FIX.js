// 🚨 SOLUTION URGENTE : Correction immédiate du problème de types mixtes dans sizes

// Le problème identifié dans erro.md :
// "sizes": ["XS", "S", 3]  ← Types mixtes causent l'échec

// ✅ SOLUTION 1 : Normaliser côté frontend AVANT d'envoyer le PATCH
function normalizeSizesBeforePatch(productData) {
  // Convertir tous les sizes en strings pour éviter les types mixtes
  if (productData.sizes && Array.isArray(productData.sizes)) {
    productData.sizes = productData.sizes.map(size => String(size));
  }
  return productData;
}

// ✅ SOLUTION 2 : Fonction de nettoyage complète
function cleanProductPayload(payload) {
  const cleaned = { ...payload };
  
  // Nettoyer sizes - convertir tout en strings
  if (cleaned.sizes && Array.isArray(cleaned.sizes)) {
    cleaned.sizes = cleaned.sizes.map(size => {
      // Si c'est déjà une string, la garder
      if (typeof size === 'string') return size;
      // Si c'est un nombre, le convertir en string
      if (typeof size === 'number') return String(size);
      // Cas de sécurité
      return String(size);
    });
  }
  
  // S'assurer que les champs numériques sont bien des nombres
  if (cleaned.price) cleaned.price = Number(cleaned.price);
  if (cleaned.suggestedPrice !== null && cleaned.suggestedPrice !== undefined) {
    cleaned.suggestedPrice = Number(cleaned.suggestedPrice);
  }
  if (cleaned.stock) cleaned.stock = Number(cleaned.stock);
  
  console.log('🧹 Payload nettoyé:', cleaned);
  return cleaned;
}

// ✅ SOLUTION 3 : Appel PATCH sécurisé
async function updateProductSafe(productId, rawPayload) {
  try {
    // Nettoyer le payload avant envoi
    const cleanPayload = cleanProductPayload(rawPayload);
    
    console.log('🚀 PATCH payload nettoyé:', JSON.stringify(cleanPayload, null, 2));
    
    const response = await fetch(`/products/${productId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Modification réussie:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de la modification:', error);
    throw error;
  }
}

// ✅ EXEMPLE D'UTILISATION avec le payload qui pose problème
const problematicPayload = {
  "name": "Tshirt de luxe modif test2",
  "description": "Thirt prenium haute qualité",
  "price": 30000,
  "suggestedPrice": 30000,
  "stock": 12,
  "status": "PUBLISHED",
  "categories": [1],
  "sizes": ["XS", "S", 3],  // ← Problème ici
  "genre": "FEMME",
  "colorVariations": [/* ... */]
};

// Appel corrigé
updateProductSafe(1, problematicPayload);

// ✅ SOLUTION 4 : Si vous utilisez un gestionnaire de formulaire
class ProductFormManager {
  collectFormData() {
    const formData = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      price: parseInt(document.getElementById('price').value),
      suggestedPrice: this.getSuggestedPrice(),
      stock: parseInt(document.getElementById('stock').value),
      status: document.getElementById('status').value,
      genre: document.getElementById('genre').value,
      categories: this.getSelectedCategories(),
      sizes: this.getSelectedSizes(), // ← Fonction corrigée
      colorVariations: this.getColorVariations()
    };
    
    return formData;
  }
  
  // ✅ Fonction corrigée pour récupérer les tailles
  getSelectedSizes() {
    const sizeElements = document.querySelectorAll('input[name="sizes"]:checked');
    return Array.from(sizeElements).map(element => {
      // TOUJOURS retourner des strings pour éviter les types mixtes
      return String(element.value);
    });
  }
  
  getSuggestedPrice() {
    const value = document.getElementById('suggestedPrice').value;
    return value ? parseInt(value) : null;
  }
  
  getSelectedCategories() {
    const categoryElements = document.querySelectorAll('input[name="categories"]:checked');
    return Array.from(categoryElements).map(el => parseInt(el.value));
  }
  
  // Méthode principale pour sauvegarder
  async saveProduct(productId) {
    try {
      const formData = this.collectFormData();
      const result = await updateProductSafe(productId, formData);
      
      // Afficher un message de succès
      alert('✅ Produit modifié avec succès !');
      
      // Optionnel : rediriger ou rafraîchir
      // window.location.reload();
      
      return result;
    } catch (error) {
      alert('❌ Erreur lors de la modification : ' + error.message);
      throw error;
    }
  }
}

// ✅ UTILISATION
const formManager = new ProductFormManager();
// formManager.saveProduct(1); // Appelé lors de la soumission du formulaire

console.log('🔧 Solution de nettoyage des types mixtes chargée');