# 🚨 URGENT - Fix Upload Design : themeId → categoryId

## ❌ Problème Identifié

Dans les logs `ha.md`, le frontend envoie :
```javascript
FormData:
- themeId: 5  // ❌ MAUVAIS NOM DE CHAMP
```

Mais l'API attend :
```javascript
FormData:
- categoryId: 5  // ✅ BON NOM DE CHAMP
```

## 🔧 Solution IMMÉDIATE

### Dans `VendorDesignsPage.tsx` (lignes ~222-224)

**AVANT (incorrect) :**
```javascript
// ❌ NE PAS FAIRE ça
formData.append('themeId', designData.themeId.toString());
```

**APRÈS (correct) :**
```javascript
// ✅ CORRECTION
formData.append('categoryId', designData.themeId.toString());
```

## 📋 Code Complet à Modifier

```javascript
// Dans la fonction uploadDesign du service (vers ligne 220-225)
const formData = new FormData();
formData.append('file', file);
formData.append('name', designData.name);
formData.append('description', designData.description || '');
formData.append('price', designData.price.toString());

// 🔧 CHANGEMENT ICI : themeId → categoryId
formData.append('categoryId', designData.themeId.toString());  // ✅ CORRIGÉ

if (designData.tags && designData.tags.length > 0) {
    formData.append('tags', designData.tags.join(','));
}
```

## 🎯 Explication Technique

1. **Frontend** : Utilise `themeId` dans l'interface utilisateur
2. **Backend** : Attend `categoryId` selon le DTO `src/design/dto/create-design.dto.ts:71`
3. **Solution** : Mapper `themeId` vers `categoryId` lors de l'envoi

## ⚡ Test Rapide

Après modification, tester avec :
```javascript
console.log('📤 FormData avant envoi:');
for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`);
}
// Vous devriez voir : categoryId: 5 (au lieu de themeId: 5)
```

## 🚀 Alternative : Renommer Partout

Si vous préférez la cohérence, vous pouvez aussi :

1. **Option A** : Renommer `themeId` → `categoryId` dans tout le frontend
2. **Option B** : Garder `themeId` en interface, mapper vers `categoryId` à l'envoi (RECOMMANDÉ)

## ✅ Validation que ça marche

Après la correction, vous ne devriez plus voir l'erreur :
- ❌ "L'ID de la catégorie doit être supérieur à 0"
- ❌ "L'ID de la catégorie doit être un nombre entier"
- ❌ "La catégorie est requise"

---

**🎯 Cette correction de 1 ligne résoudra immédiatement le problème d'upload !**