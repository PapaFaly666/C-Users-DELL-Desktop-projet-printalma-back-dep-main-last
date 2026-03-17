# 🚀 Guide Frontend - Gestion des Comptes Vendeurs (Solution Simple)

## ✅ **SOLUTION SIMPLIFIÉE**

Une approche ultra-simple pour permettre aux vendeurs de désactiver/réactiver leur compte avec des messages clairs et compréhensibles.

---

## 🎯 **ENDPOINTS DISPONIBLES**

### **1. Activer/Désactiver son compte**
```http
PATCH /vendor/account/status
```

**Headers :**
```http
Authorization: Bearer <vendor_jwt_token>
Content-Type: application/json
```

**Body :**
```json
{
  "status": false,
  "reason": "Vacances d'été - Pause temporaire"
}
```

### **2. Voir les informations de son compte**
```http
GET /vendor/account/info
```

**Headers :**
```http
Authorization: Bearer <vendor_jwt_token>
```

### **3. Vérifier l'état du compte (simple)**
```http
GET /vendor/account/status
```

**Headers :**
```http
Authorization: Bearer <vendor_jwt_token>
```

---

## 🔥 **GESTION DES ERREURS SIMPLIFIÉE**

Quand un vendeur avec compte désactivé essaie d'accéder à `/vendor/designs` ou `/vendor/products`, il reçoit :

**Réponse 403 :**
```json
{
  "error": "ACCOUNT_DISABLED",
  "message": "Votre compte vendeur est désactivé. Vous pouvez le réactiver à tout moment.",
  "action": "REACTIVATE_ACCOUNT",
  "details": {
    "userId": 123,
    "email": "vendor@example.com",
    "canReactivate": true
  }
}
```

---

## 🎨 **INTÉGRATION FRONTEND**

### **Service JavaScript complet**

```javascript
// vendorAccountService.js
class VendorAccountService {
    constructor(apiUrl = 'http://localhost:3004') {
        this.apiUrl = apiUrl;
    }

    /**
     * 🔴 Désactiver son compte
     */
    async deactivateAccount(reason = '') {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: false,
                    reason: reason
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Compte désactivé:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur désactivation:', error);
            throw error;
        }
    }

    /**
     * 🟢 Réactiver son compte
     */
    async reactivateAccount(reason = '') {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: true,
                    reason: reason
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Compte réactivé:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur réactivation:', error);
            throw error;
        }
    }

    /**
     * 📋 Récupérer les informations du compte
     */
    async getAccountInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/info`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            const result = await response.json();
            console.log('📋 Informations compte:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur récupération infos:', error);
            throw error;
        }
    }

    /**
     * 🔍 Vérifier l'état du compte (simple et rapide)
     */
    async getAccountStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }

            const result = await response.json();
            console.log('🔍 État du compte:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur vérification état:', error);
            throw error;
        }
    }

    /**
     * 🔍 Gérer les erreurs d'accès automatiquement
     */
    handleAccessError(error) {
        // Si l'erreur contient les détails de compte désactivé
        if (error.error === 'ACCOUNT_DISABLED' && error.action === 'REACTIVATE_ACCOUNT') {
            return {
                type: 'ACCOUNT_DISABLED',
                title: 'Compte désactivé',
                message: error.message,
                showReactivationButton: true,
                userEmail: error.details?.email || '',
                userId: error.details?.userId || null
            };
        }

        // Erreur d'authentification
        if (error.error === 'AUTHENTICATION_REQUIRED') {
            return {
                type: 'LOGIN_REQUIRED',
                title: 'Connexion requise',
                message: error.message,
                showLoginButton: true
            };
        }

        // Rôle insuffisant
        if (error.error === 'INSUFFICIENT_PERMISSIONS') {
            return {
                type: 'INSUFFICIENT_PERMISSIONS',
                title: 'Accès non autorisé',
                message: error.message,
                showContactButton: true
            };
        }

        // Erreur générique
        return {
            type: 'UNKNOWN_ERROR',
            title: 'Erreur',
            message: error.message || 'Une erreur inattendue s\'est produite',
            showRefreshButton: true
        };
    }
}

// Instance globale
const vendorAccount = new VendorAccountService();
```

### **Composant Modal de Réactivation**

```javascript
// Modal de réactivation simple
class VendorReactivationModal {
    constructor(vendorAccountService) {
        this.vendorAccount = vendorAccountService;
    }

    /**
     * 🎨 Afficher la modal de réactivation
     */
    show(errorDetails) {
        // Créer la modal
        const modal = document.createElement('div');
        modal.className = 'vendor-modal-overlay';
        modal.innerHTML = `
            <div class="vendor-modal">
                <div class="modal-header">
                    <h3>⏸️ Compte désactivé</h3>
                </div>

                <div class="modal-body">
                    <p>${errorDetails.message}</p>
                    <p><strong>Email:</strong> ${errorDetails.userEmail}</p>

                    <div class="reason-section">
                        <label for="reactivation-reason">Raison de la réactivation (optionnel) :</label>
                        <textarea
                            id="reactivation-reason"
                            placeholder="Ex: Retour de vacances, reprise d'activité..."
                            maxlength="200"
                        ></textarea>
                    </div>
                </div>

                <div class="modal-actions">
                    <button id="reactivate-btn" class="btn-primary">
                        🟢 Réactiver mon compte
                    </button>
                    <button id="logout-btn" class="btn-secondary">
                        🚪 Me déconnecter
                    </button>
                    <button id="cancel-btn" class="btn-tertiary">
                        ❌ Annuler
                    </button>
                </div>
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(modal);

        // Gérer les clics
        this.setupEventListeners(modal, errorDetails);
    }

    /**
     * 🎯 Configurer les événements
     */
    setupEventListeners(modal, errorDetails) {
        const reactivateBtn = modal.querySelector('#reactivate-btn');
        const logoutBtn = modal.querySelector('#logout-btn');
        const cancelBtn = modal.querySelector('#cancel-btn');
        const reasonTextarea = modal.querySelector('#reactivation-reason');

        // Réactivation
        reactivateBtn.addEventListener('click', async () => {
            const reason = reasonTextarea.value.trim();

            try {
                reactivateBtn.disabled = true;
                reactivateBtn.textContent = '⏳ Réactivation...';

                await this.vendorAccount.reactivateAccount(reason);

                // Succès
                alert('✅ Votre compte a été réactivé avec succès !');
                modal.remove();
                window.location.reload(); // Recharger la page

            } catch (error) {
                reactivateBtn.disabled = false;
                reactivateBtn.textContent = '🟢 Réactiver mon compte';
                alert('❌ Erreur lors de la réactivation: ' + error.message);
            }
        });

        // Déconnexion
        logoutBtn.addEventListener('click', () => {
            modal.remove();
            window.location.href = '/logout';
        });

        // Annulation
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Fermer en cliquant à côté
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Instance globale
const reactivationModal = new VendorReactivationModal(vendorAccount);
```

### **Intercepteur API simple**

```javascript
// Intercepteur pour gérer automatiquement les erreurs de compte
const vendorApiCall = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options
        });

        // Si succès, retourner la réponse
        if (response.ok) {
            return response;
        }

        // Si erreur 403, vérifier si c'est un compte désactivé
        if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));

            // Gérer l'erreur avec le service
            const errorInfo = vendorAccount.handleAccessError(errorData);

            // Si c'est un compte désactivé, afficher la modal
            if (errorInfo.type === 'ACCOUNT_DISABLED') {
                reactivationModal.show(errorInfo);
                return; // Ne pas throw l'erreur, la modal gère le cas
            }

            // Autres erreurs 403
            throw new Error(errorInfo.message);
        }

        // Si erreur 401, rediriger vers login
        if (response.status === 401) {
            alert('🔐 Votre session a expiré. Vous allez être redirigé vers la page de connexion.');
            window.location.href = '/login';
            return;
        }

        // Autres erreurs
        throw new Error(`Erreur HTTP ${response.status}`);

    } catch (error) {
        console.error('❌ Erreur API:', error);
        throw error;
    }
};
```

### **Composant de paramètres du compte**

```javascript
// Composant pour les paramètres du compte
class VendorAccountSettings {
    constructor(vendorAccountService) {
        this.vendorAccount = vendorAccountService;
        this.accountInfo = null;
    }

    /**
     * 🎨 Afficher les paramètres du compte
     */
    async render(containerId) {
        const container = document.getElementById(containerId);

        try {
            // Récupérer les informations du compte
            const response = await this.vendorAccount.getAccountInfo();
            this.accountInfo = response.data;

            container.innerHTML = `
                <div class="vendor-account-settings">
                    <h2>⚙️ Paramètres du compte</h2>

                    <div class="account-status-section">
                        <h3>Statut du compte</h3>
                        <div class="status-info">
                            <span class="status-indicator ${this.accountInfo.status ? 'active' : 'inactive'}">
                                ${this.accountInfo.status ? '🟢 Actif' : '🔴 Désactivé'}
                            </span>
                            <p class="status-description">
                                ${this.accountInfo.status
                                    ? 'Vos produits et designs sont visibles publiquement.'
                                    : 'Vos produits et designs sont masqués du public.'}
                            </p>
                        </div>

                        <div class="status-actions">
                            ${this.accountInfo.status
                                ? this.renderDeactivationSection()
                                : this.renderReactivationSection()}
                        </div>
                    </div>

                    <div class="account-stats">
                        <h3>📊 Statistiques</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-number">${this.accountInfo.statistics.totalProducts}</span>
                                <span class="stat-label">Produits total</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.accountInfo.statistics.publishedProducts}</span>
                                <span class="stat-label">Produits publiés</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.accountInfo.statistics.totalDesigns}</span>
                                <span class="stat-label">Designs total</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${this.accountInfo.statistics.publishedDesigns}</span>
                                <span class="stat-label">Designs publiés</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.setupEventListeners(container);

        } catch (error) {
            container.innerHTML = `
                <div class="error-message">
                    ❌ Erreur lors du chargement des paramètres: ${error.message}
                </div>
            `;
        }
    }

    /**
     * 🔴 Section de désactivation
     */
    renderDeactivationSection() {
        return `
            <div class="deactivation-section">
                <h4>Désactiver temporairement mon compte</h4>
                <p>Vos produits et designs seront masqués du public jusqu'à réactivation.</p>

                <div class="reason-input">
                    <label for="deactivation-reason">Raison (optionnel) :</label>
                    <textarea
                        id="deactivation-reason"
                        placeholder="Ex: Vacances, pause temporaire, maintenance..."
                        maxlength="200"
                    ></textarea>
                </div>

                <button id="deactivate-account-btn" class="btn-danger">
                    ⏸️ Désactiver mon compte
                </button>
            </div>
        `;
    }

    /**
     * 🟢 Section de réactivation
     */
    renderReactivationSection() {
        return `
            <div class="reactivation-section">
                <h4>Réactiver mon compte</h4>
                <p>Vos produits et designs redeviendront visibles publiquement.</p>

                <div class="reason-input">
                    <label for="reactivation-reason">Raison (optionnel) :</label>
                    <textarea
                        id="reactivation-reason"
                        placeholder="Ex: Retour de vacances, reprise d'activité..."
                        maxlength="200"
                    ></textarea>
                </div>

                <button id="reactivate-account-btn" class="btn-success">
                    🟢 Réactiver mon compte
                </button>
            </div>
        `;
    }

    /**
     * 🎯 Configurer les événements
     */
    setupEventListeners(container) {
        const deactivateBtn = container.querySelector('#deactivate-account-btn');
        const reactivateBtn = container.querySelector('#reactivate-account-btn');

        if (deactivateBtn) {
            deactivateBtn.addEventListener('click', () => this.handleDeactivation());
        }

        if (reactivateBtn) {
            reactivateBtn.addEventListener('click', () => this.handleReactivation());
        }
    }

    /**
     * 🔴 Gérer la désactivation
     */
    async handleDeactivation() {
        const reason = document.getElementById('deactivation-reason')?.value.trim() || '';

        const confirmation = confirm(
            '⚠️ Êtes-vous sûr de vouloir désactiver votre compte ?\n\n' +
            'Vos produits et designs seront masqués du public.\n' +
            'Vous pourrez réactiver votre compte à tout moment.'
        );

        if (!confirmation) return;

        try {
            const btn = document.getElementById('deactivate-account-btn');
            btn.disabled = true;
            btn.textContent = '⏳ Désactivation...';

            await this.vendorAccount.deactivateAccount(reason);

            alert('✅ Votre compte a été désactivé avec succès.');
            window.location.reload();

        } catch (error) {
            alert('❌ Erreur lors de la désactivation: ' + error.message);

            const btn = document.getElementById('deactivate-account-btn');
            btn.disabled = false;
            btn.textContent = '⏸️ Désactiver mon compte';
        }
    }

    /**
     * 🟢 Gérer la réactivation
     */
    async handleReactivation() {
        const reason = document.getElementById('reactivation-reason')?.value.trim() || '';

        try {
            const btn = document.getElementById('reactivate-account-btn');
            btn.disabled = true;
            btn.textContent = '⏳ Réactivation...';

            await this.vendorAccount.reactivateAccount(reason);

            alert('✅ Votre compte a été réactivé avec succès !');
            window.location.reload();

        } catch (error) {
            alert('❌ Erreur lors de la réactivation: ' + error.message);

            const btn = document.getElementById('reactivate-account-btn');
            btn.disabled = false;
            btn.textContent = '🟢 Réactiver mon compte';
        }
    }
}

// Instance globale
const accountSettings = new VendorAccountSettings(vendorAccount);
```

### **Composant Bouton Dynamique**

```javascript
// Composant pour afficher un bouton qui s'adapte à l'état du compte
class VendorAccountToggleButton {
    constructor(vendorAccountService, buttonId) {
        this.vendorAccount = vendorAccountService;
        this.buttonId = buttonId;
        this.button = null;
    }

    /**
     * 🎨 Initialiser et afficher le bouton
     */
    async init() {
        this.button = document.getElementById(this.buttonId);
        if (!this.button) {
            console.error(`❌ Bouton avec ID "${this.buttonId}" non trouvé`);
            return;
        }

        // Charger l'état initial
        await this.updateButtonState();

        // Configurer les événements
        this.button.addEventListener('click', () => this.handleToggle());
    }

    /**
     * 🔄 Mettre à jour l'état du bouton
     */
    async updateButtonState() {
        try {
            this.button.disabled = true;
            this.button.textContent = '⏳ Vérification...';

            const statusResponse = await this.vendorAccount.getAccountStatus();
            const isActive = statusResponse.data.isActive;

            // Mettre à jour l'apparence du bouton
            if (isActive) {
                this.button.textContent = '⏸️ Désactiver le compte';
                this.button.className = 'btn-warning';
                this.button.title = 'Masquer temporairement vos produits et designs';
            } else {
                this.button.textContent = '🟢 Réactiver le compte';
                this.button.className = 'btn-success';
                this.button.title = 'Rendre vos produits et designs visibles publiquement';
            }

            this.button.disabled = false;

        } catch (error) {
            console.error('❌ Erreur lors de la vérification de l\'état:', error);
            this.button.textContent = '❌ Erreur';
            this.button.disabled = true;
        }
    }

    /**
     * 🎯 Gérer le clic sur le bouton
     */
    async handleToggle() {
        try {
            const statusResponse = await this.vendorAccount.getAccountStatus();
            const isActive = statusResponse.data.isActive;

            // Demander confirmation
            const actionWord = isActive ? 'désactiver' : 'réactiver';
            const impact = isActive
                ? 'Vos produits et designs seront masqués du public.'
                : 'Vos produits et designs redeviendront visibles publiquement.';

            const reason = prompt(
                `⚠️ Êtes-vous sûr de vouloir ${actionWord} votre compte ?\n\n` +
                `${impact}\n\n` +
                `Raison (optionnel) :`
            );

            // Si l'utilisateur annule
            if (reason === null) return;

            // Mettre à jour le bouton pendant l'action
            this.button.disabled = true;
            this.button.textContent = isActive ? '⏳ Désactivation...' : '⏳ Réactivation...';

            // Exécuter l'action
            if (isActive) {
                await this.vendorAccount.deactivateAccount(reason);
                alert('✅ Votre compte a été désactivé avec succès.');
            } else {
                await this.vendorAccount.reactivateAccount(reason);
                alert('✅ Votre compte a été réactivé avec succès !');
            }

            // Mettre à jour l'état du bouton
            await this.updateButtonState();

        } catch (error) {
            console.error('❌ Erreur lors du changement d\'état:', error);
            alert('❌ Erreur: ' + error.message);

            // Restaurer l'état du bouton
            await this.updateButtonState();
        }
    }
}

// Exemple d'utilisation
// const toggleButton = new VendorAccountToggleButton(vendorAccount, 'account-toggle-btn');
// toggleButton.init();
```

### **Indicateur de statut simple**

```javascript
// Composant pour afficher un indicateur de statut
class VendorAccountStatusIndicator {
    constructor(vendorAccountService, containerId) {
        this.vendorAccount = vendorAccountService;
        this.containerId = containerId;
    }

    /**
     * 🎨 Afficher l'indicateur de statut
     */
    async render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`❌ Conteneur avec ID "${this.containerId}" non trouvé`);
            return;
        }

        try {
            const statusResponse = await this.vendorAccount.getAccountStatus();
            const data = statusResponse.data;

            container.innerHTML = `
                <div class="vendor-status-indicator ${data.isActive ? 'active' : 'inactive'}">
                    <span class="status-icon">${data.isActive ? '🟢' : '🔴'}</span>
                    <span class="status-text">
                        Compte ${data.isActive ? 'actif' : 'désactivé'}
                    </span>
                    <span class="status-detail">
                        ${data.isActive
                            ? 'Vos produits sont visibles publiquement'
                            : 'Vos produits sont masqués du public'}
                    </span>
                </div>
            `;

        } catch (error) {
            console.error('❌ Erreur lors du chargement du statut:', error);
            container.innerHTML = `
                <div class="vendor-status-indicator error">
                    <span class="status-icon">❌</span>
                    <span class="status-text">Erreur de chargement</span>
                </div>
            `;
        }
    }

    /**
     * 🔄 Rafraîchir l'affichage
     */
    async refresh() {
        await this.render();
    }
}

// Exemple d'utilisation
// const statusIndicator = new VendorAccountStatusIndicator(vendorAccount, 'status-display');
// statusIndicator.render();
```

---

## 🎨 **CSS RECOMMANDÉ**

```css
/* Styles pour la modal de réactivation */
.vendor-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.vendor-modal {
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header h3 {
    margin: 0 0 16px 0;
    color: #333;
}

.modal-body p {
    margin: 8px 0;
    color: #666;
}

.reason-section {
    margin: 16px 0;
}

.reason-section label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.reason-section textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    min-height: 60px;
}

.modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
}

.btn-primary {
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
}

.btn-tertiary {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
}

/* Styles pour les paramètres du compte */
.vendor-account-settings {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.account-status-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 24px;
}

.status-indicator.active {
    color: #28a745;
    font-weight: 500;
}

.status-indicator.inactive {
    color: #dc3545;
    font-weight: 500;
}

.status-description {
    margin: 8px 0 16px 0;
    color: #666;
}

.reason-input {
    margin: 16px 0;
}

.reason-input label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

.reason-input textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    min-height: 60px;
}

.btn-danger {
    background: #dc3545;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-success {
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-top: 16px;
}

.stat-item {
    text-align: center;
    padding: 16px;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 4px;
}

.stat-number {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #007bff;
}

.stat-label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-top: 4px;
}

/* Styles pour le bouton dynamique */
.btn-warning {
    background: #ffc107;
    color: #212529;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.btn-warning:hover {
    background: #e0a800;
}

/* Styles pour l'indicateur de statut */
.vendor-status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
}

.vendor-status-indicator.active {
    background: #d4edda;
    border: 1px solid #c3e6cb;
}

.vendor-status-indicator.inactive {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
}

.vendor-status-indicator.error {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
}

.status-icon {
    font-size: 16px;
}

.status-text {
    font-weight: 500;
}

.status-detail {
    font-size: 12px;
    color: #6c757d;
    margin-left: auto;
}
```

---

## 🧪 **TESTS SIMPLES**

### **Test 1 : Désactivation**
```javascript
// Test de désactivation
vendorAccount.deactivateAccount('Vacances d\'été')
    .then(result => console.log('✅ Désactivé:', result))
    .catch(error => console.error('❌ Erreur:', error));
```

### **Test 2 : Réactivation**
```javascript
// Test de réactivation
vendorAccount.reactivateAccount('Retour de vacances')
    .then(result => console.log('✅ Réactivé:', result))
    .catch(error => console.error('❌ Erreur:', error));
```

### **Test 3 : Vérification de l'état du compte**
```javascript
// Test de vérification de statut
vendorAccount.getAccountStatus()
    .then(result => console.log('✅ État du compte:', result.data))
    .catch(error => console.error('❌ Erreur:', error));
```

### **Test 4 : Bouton dynamique**
```javascript
// Test du bouton dynamique
const toggleButton = new VendorAccountToggleButton(vendorAccount, 'my-toggle-button');
toggleButton.init().then(() => {
    console.log('✅ Bouton initialisé avec le bon état');
});
```

### **Test 5 : Gestion d'erreur automatique**
```javascript
// Test d'accès avec compte désactivé
vendorApiCall('/vendor/designs')
    .then(response => console.log('✅ Succès'))
    .catch(error => console.log('❌ Modal affichée automatiquement'));
```

---

## 📋 **CHECKLIST D'INTÉGRATION**

- [ ] ✅ Copier `VendorAccountService` dans votre projet
- [ ] ✅ Copier `VendorReactivationModal` dans votre projet
- [ ] ✅ Remplacer vos appels `fetch` par `vendorApiCall`
- [ ] ✅ Intégrer `VendorAccountSettings` dans vos paramètres
- [ ] ✅ Intégrer `VendorAccountToggleButton` pour les boutons dynamiques
- [ ] ✅ Intégrer `VendorAccountStatusIndicator` pour les indicateurs de statut
- [ ] ✅ Ajouter les styles CSS complets
- [ ] ✅ Tester les 5 scénarios de base
- [ ] ✅ Configurer les redirections `/login` et `/logout`

---

## 🎯 **RÉSUMÉ**

**TROIS APIS PRINCIPALES :**
- `PATCH /vendor/account/status` - Activer/désactiver avec `{status: true/false, reason: "..."}`
- `GET /vendor/account/info` - Informations complètes + statistiques
- `GET /vendor/account/status` - Statut simple pour boutons dynamiques

**GESTION D'ERREUR :** Détection automatique de `ACCOUNT_DISABLED` → Modal de réactivation

**UX INTELLIGENTE :**
- Bouton de réactivation directement dans la modal d'erreur
- Boutons dynamiques qui s'adaptent à l'état du compte
- Indicateurs visuels de statut

**COMPOSANTS FRONTEND :**
- `VendorAccountService` - Service complet avec toutes les API
- `VendorAccountToggleButton` - Bouton intelligent qui change selon l'état
- `VendorAccountStatusIndicator` - Indicateur visuel de statut
- `VendorReactivationModal` - Modal automatique lors d'erreurs
- `VendorAccountSettings` - Page complète de paramètres

Cette solution est **simple**, **intelligente** et **complète** ! 🚀