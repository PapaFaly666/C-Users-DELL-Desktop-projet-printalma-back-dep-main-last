# 🚀 DÉMARRAGE RAPIDE - INTÉGRATION PAYTECH FRONTEND

## 📋 EN 5 ÉTAPES SIMPLES

### **Étape 1 : Copier les fichiers essentiels**
```bash
# Copier dans votre projet frontend
cp frontend-examples/paytech-service.js src/services/
cp frontend-examples/react-hook.js src/hooks/  # Pour React
cp frontend-examples/vue-component.vue src/components/  # Pour Vue
```

### **Étape 2 : Configurer l'URL de l'API**
```javascript
// Dans paytech-service.js ou votre config
const API_BASE_URL = 'http://localhost:3004'; // URL de votre backend NestJS
```

### **Étape 3 : Utiliser le hook React**
```jsx
import { usePaytech } from './hooks/usePaytech';

function PaymentComponent() {
  const { initiatePayment, loading, error } = usePaytech();

  const handlePayment = async () => {
    await initiatePayment({
      item_name: 'T-Shirt Premium',
      item_price: 5000,
      ref_command: `ORDER-${Date.now()}`,
      command_name: 'Achat T-Shirt Premium',
      success_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`
    });
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Traitement...' : 'Payer 5000 XOF'}
    </button>
  );
}
```

### **Étape 4 : Créer les pages de retour**
```jsx
// pages/payment/success.jsx
export default function PaymentSuccess() {
  return (
    <div>
      <h1>✅ Paiement réussi !</h1>
      <p>Redirection vers vos commandes...</p>
    </div>
  );
}

// pages/payment/cancel.jsx
export default function PaymentCancel() {
  return (
    <div>
      <h1>❌ Paiement annulé</h1>
      <button onClick={() => window.history.back()}>
        Retour
      </button>
    </div>
  );
}
```

### **Étape 5 : Tester !**
```bash
# Lancer votre frontend
npm start

# Cliquer sur le bouton de paiement
# Tester avec une carte de test sur la page Paytech
```

---

## 🔗 URLS DE TEST ACTIVES

Pour tester immédiatement :
- **URL active** : https://paytech.sn/payment/checkout/405gzopmh98s6qc
- **Montant** : 5 000 XOF
- **Mode** : Test (aucune déduction)

---

## 📁 STRUCTURE COMPLÈTE CRÉÉE

```
frontend-examples/
├── paytech-service.js     # Service principal (JavaScript/TypeScript)
├── react-hook.js          # Hook React personnalisé
├── vue-component.vue      # Composant Vue.js complet
├── html-example.html      # Exemple Vanilla JavaScript
├── payment-urls.js        # Configuration des URLs
├── package.json           # Métadonnées du projet
└── README.md             # Documentation technique
```

---

## 💡 EXEMPLES PRÊTS À L'EMPLOI

### **React Hook**
```javascript
// Utilisation simplifiée
const { initiatePayment, loading } = usePaytech();

await initiatePayment({
  item_name: 'Mon produit',
  item_price: 5000,
  ref_command: 'ORDER-001'
});
```

### **Composant Vue**
```vue
<PaytechButton
  :item-name="'T-Shirt Premium'"
  :amount="5000"
  :ref-command="'ORDER-001'"
  @payment-success="onSuccess"
/>
```

### **Service JavaScript**
```javascript
const service = new PaytechService();
const response = await service.initializePayment(paymentData);
window.location.href = response.data.redirect_url;
```

---

## 🔧 CONFIGURATION RAPIDE

### **Variables d'environnement**
```bash
# .env
REACT_APP_API_URL=http://localhost:3004
VUE_APP_API_URL=http://localhost:3004
```

### **Mode test/production**
```javascript
const config = {
  env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
  success_url: `${window.location.origin}/payment/success`,
  cancel_url: `${window.location.origin}/payment/cancel`
};
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails :
- **Guide complet** : [PAYTECH_FRONTEND_INTEGRATION_GUIDE.md](./PAYTECH_FRONTEND_INTEGRATION_GUIDE.md)
- **Exemples détaillés** : Voir le dossier `frontend-examples/`
- **API Backend** : Tous les endpoints documentés dans le guide

---

## 🆘 SUPPORT

### **Contact Paytech**
- 📧 **Email** : support@paytech.sn
- 💬 **WhatsApp** : +221771255799 / +221772457199
- 🌐 **Documentation** : https://doc.intech.sn/doc_paytech.php

### **Contact Backend**
- 🔧 **API disponible** : http://localhost:3004
- 📊 **Test configuration** : GET /paytech/test-config
- 🔍 **Diagnostic** : GET /paytech/diagnose

---

## ✅ CHECKLIST AVANT DEPLOYER

- [ ] Configurer les URLs HTTPS pour la production
- [ ] Changer `env: 'test'` en `env: 'prod'`
- [ ] Configurer l'URL IPN (doit être HTTPS)
- [ ] Tester avec différents scénarios
- [ ] Gérer les erreurs utilisateurs
- [ ] Ajouter des logs pour le débogage

---

## 🎉 VOUS ÊTES PRÊT !

Le frontend peut maintenant :
✅ Initialiser des paiements Paytech
✅ Rediriger vers la page de paiement
✅ Gérer les retours (succès/échec)
✅ Afficher les états de chargement
✅ Gérer les erreurs

**Démarrez votre projet frontend et testez immédiatement !** 🚀