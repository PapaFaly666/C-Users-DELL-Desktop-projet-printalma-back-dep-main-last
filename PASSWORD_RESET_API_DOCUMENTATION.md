# 🔐 API Réinitialisation de Mot de Passe - Documentation Complète

## 📋 Vue d'ensemble

Système complet de réinitialisation de mot de passe sécurisé avec envoi d'emails et gestion de tokens temporaires.

**Base URL**: `http://localhost:3004`  
**Fonctionnalités**: Oubli de mot de passe, validation de tokens, réinitialisation sécurisée

---

## 🚀 Endpoints Disponibles

### 1. Demander une Réinitialisation
```http
POST /auth/forgot-password
```
**Public** - Envoie un email avec un lien/token de réinitialisation

### 2. Vérifier un Token de Réinitialisation
```http
POST /auth/verify-reset-token
```
**Public** - Vérifie la validité d'un token avant utilisation

### 3. Réinitialiser le Mot de Passe
```http
POST /auth/reset-password
```
**Public** - Change le mot de passe avec un token valide

### 4. Nettoyer les Tokens Expirés
```http
POST /auth/admin/cleanup-reset-tokens
```
**Admin uniquement** - Maintenance: supprime les tokens expirés

---

## 📊 Spécifications Détaillées

### 1. POST `/auth/forgot-password`

#### Corps de la requête
```json
{
  "email": "utilisateur@exemple.com"
}
```

#### Réponse (toujours la même pour la sécurité)
```json
{
  "message": "Si cet email est associé à un compte, vous recevrez un lien de réinitialisation."
}
```

#### Comportement
- ✅ Email valide + compte actif → Email envoyé
- ✅ Email inexistant → Même message (sécurité)
- ✅ Compte désactivé → Même message (sécurité)
- 🔄 Annule les tokens précédents de l'utilisateur
- ⏱️ Token valide 1 heure

---

### 2. POST `/auth/verify-reset-token`

#### Corps de la requête
```json
{
  "token": "abc123def456..."
}
```

#### Réponse - Token valide
```json
{
  "valid": true,
  "message": "Token valide",
  "userEmail": "utilisateur@exemple.com",
  "userName": "Jean Dupont"
}
```

#### Réponse - Token invalide
```json
{
  "statusCode": 400,
  "message": "Token de réinitialisation invalide|expiré|déjà utilisé"
}
```

---

### 3. POST `/auth/reset-password`

#### Corps de la requête
```json
{
  "token": "abc123def456...",
  "newPassword": "nouveauMotDePasse123",
  "confirmPassword": "nouveauMotDePasse123"
}
```

#### Réponse - Succès
```json
{
  "message": "Mot de passe réinitialisé avec succès",
  "userEmail": "utilisateur@exemple.com"
}
```

#### Validations
- 🔐 Mots de passe identiques
- 📏 Minimum 8 caractères
- 🆕 Différent de l'ancien mot de passe
- ✅ Token valide et non utilisé

---

### 4. POST `/auth/admin/cleanup-reset-tokens`

#### Headers requis
```
Cookie: auth_token=<jwt_token>
```

#### Réponse
```json
{
  "deletedCount": 15
}
```

---

## 💻 Implémentation Frontend

### Service JavaScript/TypeScript

```typescript
// services/passwordResetService.js
class PasswordResetService {
  constructor() {
    this.baseUrl = 'http://localhost:3004/auth';
  }

  // Demander une réinitialisation
  async forgotPassword(email) {
    const response = await fetch(`${this.baseUrl}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la demande');
    }

    return response.json();
  }

  // Vérifier un token
  async verifyResetToken(token) {
    const response = await fetch(`${this.baseUrl}/verify-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token invalide');
    }

    return response.json();
  }

  // Réinitialiser le mot de passe
  async resetPassword(token, newPassword, confirmPassword) {
    const response = await fetch(`${this.baseUrl}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword, confirmPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la réinitialisation');
    }

    return response.json();
  }

  // Admin: nettoyer les tokens expirés
  async cleanupExpiredTokens() {
    const response = await fetch(`${this.baseUrl}/admin/cleanup-reset-tokens`, {
      method: 'POST',
      credentials: 'include' // Cookies d'authentification admin
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du nettoyage');
    }

    return response.json();
  }
}

export default new PasswordResetService();
```

---

## 🎨 Composants React Complets

### 1. Composant "Mot de Passe Oublié"

```jsx
// ForgotPassword.jsx
import React, { useState } from 'react';
import passwordResetService from '../services/passwordResetService';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await passwordResetService.forgotPassword(email);
      setMessage(result.message);
      setEmail(''); // Vider le formulaire
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>🔐 Mot de passe oublié</h2>
        <p>Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse email :</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre.email@exemple.com"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" disabled={loading || !email}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="back-to-login">
          <a href="/login">← Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
```

### 2. Composant "Réinitialiser le Mot de Passe"

```jsx
// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import passwordResetService from '../services/passwordResetService';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token de réinitialisation manquant');
        setVerifying(false);
        return;
      }

      try {
        const result = await passwordResetService.verifyResetToken(token);
        setTokenValid(true);
        setUserInfo({ email: result.userEmail, name: result.userName });
      } catch (err) {
        setError(err.message);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation côté client
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      const result = await passwordResetService.resetPassword(
        token,
        formData.newPassword,
        formData.confirmPassword
      );
      setSuccess(result.message);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' }
        });
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="reset-password-container">
        <div className="loading">🔄 Vérification du token...</div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-container">
        <div className="error-card">
          <h2>❌ Token invalide</h2>
          <p>{error}</p>
          <a href="/forgot-password">Demander un nouveau lien</a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="success-card">
          <h2>✅ Mot de passe réinitialisé</h2>
          <p>{success}</p>
          <p>Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>🔐 Nouveau mot de passe</h2>
        {userInfo && (
          <div className="user-info">
            <p>Compte : <strong>{userInfo.name}</strong></p>
            <p>Email : <strong>{userInfo.email}</strong></p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe :</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Minimum 8 caractères"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe :</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Retapez le mot de passe"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || !formData.newPassword || !formData.confirmPassword}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <div className="security-tips">
          <h4>💡 Conseils sécurité :</h4>
          <ul>
            <li>Utilisez au moins 8 caractères</li>
            <li>Mélangez lettres, chiffres et symboles</li>
            <li>Évitez les mots du dictionnaire</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
```

### 3. CSS pour les Composants

```css
/* styles/password-reset.css */
.forgot-password-container,
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.forgot-password-card,
.reset-password-card,
.error-card,
.success-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.forgot-password-card h2,
.reset-password-card h2,
.error-card h2,
.success-card h2 {
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  border: 1px solid #f5c6cb;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  border: 1px solid #c3e6cb;
}

.user-info {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  border: 1px solid #b3d7ff;
}

.security-tips {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.security-tips h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.security-tips ul {
  margin: 0;
  padding-left: 1.2rem;
}

.security-tips li {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.back-to-login {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.back-to-login a {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.back-to-login a:hover {
  text-decoration: underline;
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}

/* Animation de chargement */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading::before {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

/* Responsive */
@media (max-width: 480px) {
  .forgot-password-card,
  .reset-password-card,
  .error-card,
  .success-card {
    padding: 1.5rem;
    margin: 10px;
  }
}
```

---

## 🔧 Gestion des Erreurs

### Codes d'erreur possibles

| Code | Endpoint | Description | Action Frontend |
|------|----------|-------------|-----------------|
| `400` | Tous | Données invalides | Afficher le message d'erreur |
| `400` | verify-reset-token | Token invalide/expiré | Rediriger vers forgot-password |
| `400` | reset-password | Validation échouée | Corriger les données |
| `401` | cleanup-reset-tokens | Non authentifié | Rediriger vers login |
| `500` | Tous | Erreur serveur | Message générique + retry |

---

## 📧 Templates d'Email

### Email de Réinitialisation

**Sujet**: `Réinitialisation de votre mot de passe PrintAlma`

**Contenu**:
- 🔗 Lien cliquable vers `{FRONTEND_URL}/reset-password?token={token}`
- ⏱️ Mention de l'expiration (1 heure)
- 🛡️ Conseils de sécurité
- 📋 Token en texte brut (fallback)

### Email de Confirmation

**Sujet**: `Mot de passe réinitialisé avec succès - PrintAlma`

**Contenu**:
- ✅ Confirmation du changement
- 📅 Date/heure de modification
- 🛡️ Conseils de sécurité
- ⚠️ Contact si non autorisé

---

## 🔒 Sécurité

### Mesures Implémentées

1. **Tokens Sécurisés**: 32 bytes aléatoires cryptographiques
2. **Expiration Courte**: 1 heure maximum
3. **Usage Unique**: Token invalidé après utilisation
4. **Nettoyage Auto**: Suppression des tokens expirés
5. **Validation Stricte**: Vérifications multiples
6. **Messages Uniformes**: Même réponse pour tous les emails

### Protection CSRF/SSRF

- ✅ Endpoints publics (pas de cookies requis)
- ✅ Validation stricte des tokens
- ✅ Rate limiting recommandé (à implémenter)

---

## 📞 Support et Maintenance

### Configuration Requise

```env
# .env
FRONTEND_URL=http://localhost:3001
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

### Maintenance Recommandée

```bash
# Nettoyer les tokens expirés (à automatiser)
curl -X POST http://localhost:3000/auth/admin/cleanup-reset-tokens \
  -H "Cookie: auth_token=admin_jwt_token"
```

### Monitoring

- 📊 Surveiller les demandes de réinitialisation
- 📧 Logs d'envoi d'emails
- 🧹 Fréquence de nettoyage des tokens

---

**🔐 Votre système de réinitialisation est maintenant opérationnel !** 