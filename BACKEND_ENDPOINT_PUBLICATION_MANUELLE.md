# 🚀 Backend - Endpoint Publication Manuelle

> **Date** : Décembre 2024  
> **Statut** : Implémentation requise  
> **Priorité** : Moyenne (pour finaliser le workflow DRAFT)

---

## 📋 Besoin

Le frontend a besoin d'un endpoint pour publier manuellement les produits en brouillon qui ont été validés par l'admin.

### 🎯 Cas d'usage
1. Vendeur crée produit avec "Mettre en brouillon" (`forcedStatus: DRAFT`)
2. Admin valide le design → produit reste `status: DRAFT` mais `isValidated: true`
3. **Frontend affiche bouton "Publier maintenant"**
4. **Vendeur clique → Appel endpoint → Produit passe en `status: PUBLISHED`**

---

## 🔧 Implémentation Endpoint

### 📍 Route
```
POST /api/vendor-products/:id/publish
```

### 🛡️ Contrôleur (vendor-product.controller.ts)

```typescript
import { Post, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Post(':id/publish')
@UseGuards(AuthGuard('jwt'))
@ApiOperation({ 
  summary: 'Publication manuelle d\'un produit brouillon validé',
  description: 'Permet au vendeur de publier un produit qui était en brouillon après validation du design'
})
@ApiResponse({ status: 200, description: 'Produit publié avec succès' })
@ApiResponse({ status: 400, description: 'Produit non éligible à la publication' })
@ApiResponse({ status: 404, description: 'Produit non trouvé' })
async publishDraftProduct(
  @Param('id', ParseIntPipe) id: number,
  @GetUser() user: any,
): Promise<{
  success: boolean;
  message: string;
  product: {
    id: number;
    status: string;
    forcedStatus: string;
    isValidated: boolean;
    publishedAt: string;
  };
}> {
  return this.vendorProductService.publishDraftProduct(id, user.id);
}
```

### ⚙️ Service (vendor-product.service.ts)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';

async publishDraftProduct(productId: number, vendorId: number): Promise<{
  success: boolean;
  message: string;
  product: any;
}> {
  // 1️⃣ Vérifier que le produit existe et appartient au vendeur
  const existingProduct = await this.prisma.vendorProduct.findFirst({
    where: {
      id: productId,
      vendorId: vendorId,
    },
    include: {
      design: {
        select: {
          id: true,
          name: true,
          isValidated: true,
        }
      }
    }
  });

  if (!existingProduct) {
    throw new NotFoundException('Produit non trouvé ou non autorisé');
  }

  // 2️⃣ Vérifier les conditions de publication
  const canPublish = (
    existingProduct.forcedStatus === PublicationStatus.DRAFT &&
    existingProduct.status === PublicationStatus.DRAFT &&
    existingProduct.isValidated === true &&
    existingProduct.design?.isValidated === true
  );

  if (!canPublish) {
    const reasons = [];
    if (existingProduct.forcedStatus !== PublicationStatus.DRAFT) {
      reasons.push('le produit n\'était pas prévu pour publication manuelle');
    }
    if (existingProduct.status !== PublicationStatus.DRAFT) {
      reasons.push('le produit n\'est pas en statut brouillon');
    }
    if (!existingProduct.isValidated) {
      reasons.push('le produit n\'est pas validé');
    }
    if (!existingProduct.design?.isValidated) {
      reasons.push('le design n\'est pas validé');
    }

    throw new BadRequestException(
      `Impossible de publier ce produit car ${reasons.join(', ')}`
    );
  }

  // 3️⃣ Publier le produit
  const publishedProduct = await this.prisma.vendorProduct.update({
    where: { id: productId },
    data: {
      status: PublicationStatus.PUBLISHED,
      publishedAt: new Date(),
      updatedAt: new Date(),
    },
    include: {
      design: {
        select: {
          id: true,
          name: true,
          isValidated: true,
        }
      }
    }
  });

  // 4️⃣ Log pour suivi
  this.logger.log(`📤 Publication manuelle: Produit ${productId} publié par vendeur ${vendorId}`);

  // 5️⃣ Retourner la réponse
  return {
    success: true,
    message: 'Produit publié avec succès',
    product: {
      id: publishedProduct.id,
      status: publishedProduct.status,
      forcedStatus: publishedProduct.forcedStatus,
      isValidated: publishedProduct.isValidated,
      publishedAt: publishedProduct.publishedAt?.toISOString() || null,
      designName: publishedProduct.design?.name,
    }
  };
}
```

---

## 🧪 Tests de Validation

### 🔍 Script de test

```javascript
// test-manual-publication.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testManualPublication() {
  console.log('🧪 Test endpoint publication manuelle...\n');

  try {
    // 1️⃣ Trouver un produit brouillon validé
    const draftProduct = await prisma.vendorProduct.findFirst({
      where: {
        forcedStatus: 'DRAFT',
        status: 'DRAFT',
        isValidated: true,
      },
      include: {
        design: { select: { name: true, isValidated: true } }
      }
    });

    if (!draftProduct) {
      console.log('❌ Aucun produit brouillon validé trouvé pour tester');
      return;
    }

    console.log(`✅ Produit trouvé pour test: ID ${draftProduct.id}`);
    console.log(`  Design: ${draftProduct.design?.name}`);
    console.log(`  Status: ${draftProduct.status}`);
    console.log(`  ForcedStatus: ${draftProduct.forcedStatus}`);
    console.log(`  IsValidated: ${draftProduct.isValidated}`);

    // 2️⃣ Simuler l'appel endpoint (à remplacer par vraie requête HTTP)
    console.log('\n📤 Test simulation publication...');
    
    // Simulation de la logique service
    const canPublish = (
      draftProduct.forcedStatus === 'DRAFT' &&
      draftProduct.status === 'DRAFT' &&
      draftProduct.isValidated === true &&
      draftProduct.design?.isValidated === true
    );

    console.log(`  Éligible à publication: ${canPublish ? '✅ OUI' : '❌ NON'}`);

    if (canPublish) {
      console.log('\n🚀 Publication simulée réussie !');
      console.log('  Response attendue:');
      console.log('  {');
      console.log('    "success": true,');
      console.log('    "message": "Produit publié avec succès",');
      console.log('    "product": {');
      console.log(`      "id": ${draftProduct.id},`);
      console.log('      "status": "PUBLISHED",');
      console.log('      "forcedStatus": "DRAFT",');
      console.log('      "isValidated": true,');
      console.log('      "publishedAt": "2024-12-01T10:00:00Z"');
      console.log('    }');
      console.log('  }');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testManualPublication();
```

### 🌐 Test cURL

```bash
# Test avec un ID de produit brouillon validé
curl -X POST http://localhost:3000/api/vendor-products/99/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Réponse attendue
{
  "success": true,
  "message": "Produit publié avec succès",
  "product": {
    "id": 99,
    "status": "PUBLISHED",
    "forcedStatus": "DRAFT",
    "isValidated": true,
    "publishedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

---

## 📋 Checklist Implémentation

### ✅ Backend
- [ ] Ajouter méthode `publishDraftProduct` dans `VendorProductService`
- [ ] Ajouter route `POST /:id/publish` dans `VendorProductController`
- [ ] Validation des permissions (vendeur propriétaire)
- [ ] Validation des conditions (DRAFT + validé)
- [ ] Tests unitaires
- [ ] Documentation Swagger

### ✅ Frontend (après backend)
- [ ] Fonction `publishProduct(id)` dans service
- [ ] Gestion loading state sur bouton
- [ ] Gestion success/error
- [ ] Refresh liste produits après publication
- [ ] Toast notification succès

---

## 🎯 Résultat Attendu

Après implémentation :

1. **Vendeur voit bouton "Publier maintenant"** sur produits brouillons validés
2. **Clic bouton → Appel API → Produit publié**
3. **Interface se met à jour** : badge "Publié", bouton disparaît
4. **Workflow DRAFT complet** de bout en bout

---

## 🚨 Points d'Attention

### 🔒 Sécurité
- Vérifier que le vendeur est propriétaire du produit
- Valider toutes les conditions avant publication
- Log des actions pour audit

### 🎨 UX
- Loading state pendant requête
- Message de succès clair
- Gestion des erreurs explicite
- Refresh automatique de la liste

### 🧪 Tests
- Cas nominal (produit éligible)
- Cas d'erreur (produit non éligible)
- Cas d'erreur (produit inexistant)
- Cas d'erreur (vendeur non propriétaire)

**Endpoint simple mais critique pour UX vendeur !** 🎯 