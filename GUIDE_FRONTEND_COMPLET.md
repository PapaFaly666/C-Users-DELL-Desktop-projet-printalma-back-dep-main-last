# 📘 Guide Complet Frontend - Authentification PrintAlma

## 🎯 **Introduction**

Ce guide vous accompagne pas à pas pour intégrer le système d'authentification PrintAlma avec toutes les fonctionnalités : messages informatifs, gestion des erreurs, protection SUPERADMIN, etc.

---

## 📋 **Prérequis**

- React 16.8+ (pour les hooks)
- Axios pour les requêtes HTTP
- Node.js et npm/yarn
- Backend PrintAlma démarré sur `http://localhost:3004`

---

## 🚀 **Étape 1: Installation et Configuration**

### **1.1 Installation des dépendances**

```bash
npm install axios
# ou
yarn add axios
```

### **1.2 Configuration de base**

Créez le fichier `src/config/api.js` :

```javascript
// src/config/api.js
export const API_CONFIG = {
    BASE_URL: 'http://localhost:3004',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        PROFILE: '/auth/profile',
        CHECK_AUTH: '/auth/check',
        FORCE_CHANGE_PASSWORD: '/auth/force-change-password',
        ADMIN_UNLOCK: '/auth/admin/unlock-account'
    }
};
```

---

## 🔧 **Étape 2: Service d'Authentification**

Créez le fichier `src/services/authService.js` :

```javascript
// src/services/authService.js
import axios from 'axios';
import { API_CONFIG } from '../config/api';

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            withCredentials: true, // OBLIGATOIRE pour les cookies httpOnly
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Intercepteur pour gérer les erreurs globalement
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expiré ou invalide
                    this.handleAuthError();
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * 🔐 Connexion utilisateur
     */
    async login(email, password) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.LOGIN, {
                email: email.trim(),
                password
            });

            // ✅ Connexion réussie
            if (response.data.user) {
                return {
                    success: true,
                    user: response.data.user,
                    mustChangePassword: false
                };
            }

            // 🔑 Changement de mot de passe requis
            if (response.data.mustChangePassword) {
                return {
                    success: false,
                    mustChangePassword: true,
                    userId: response.data.userId,
                    message: response.data.message
                };
            }

        } catch (error) {
            return this.handleLoginError(error);
        }
    }

    /**
     * 🔄 Changement de mot de passe forcé
     */
    async forceChangePassword(userId, currentPassword, newPassword, confirmPassword) {
        try {
            const response = await this.api.post(API_CONFIG.ENDPOINTS.FORCE_CHANGE_PASSWORD, {
                userId,
                currentPassword,
                newPassword,
                confirmPassword
            });

            return {
                success: true,
                user: response.data.user,
                message: response.data.message
            };
        } catch (error) {
            return this.handleLoginError(error);
        }
    }

    /**
     * 👋 Déconnexion
     */
    async logout() {
        try {
            await this.api.post(API_CONFIG.ENDPOINTS.LOGOUT);
            return { success: true };
        } catch (error) {
            console.warn('Erreur lors de la déconnexion:', error);
            // Même si la déconnexion échoue côté serveur, on considère que c'est réussi
            return { success: true };
        }
    }

    /**
     * 👤 Profil utilisateur
     */
    async getProfile() {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.PROFILE);
            return { success: true, user: response.data };
        } catch (error) {
            return { success: false, error: 'Profil non accessible' };
        }
    }

    /**
     * ✅ Vérifier l'authentification
     */
    async checkAuth() {
        try {
            const response = await this.api.get(API_CONFIG.ENDPOINTS.CHECK_AUTH);
            return { success: true, user: response.data.user };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * 🔓 Débloquer un compte (Admin uniquement)
     */
    async unlockAccount(userId) {
        try {
            const response = await this.api.put(`${API_CONFIG.ENDPOINTS.ADMIN_UNLOCK}/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { 
                success: false, 
                error: error.response?.data?.message || 'Erreur lors du déblocage' 
            };
        }
    }

    /**
     * 🎯 Gestion des erreurs de connexion
     */
    handleLoginError(error) {
        if (error.response) {
            const { status, data } = error.response;
            const message = data.message || 'Erreur de connexion';

            return {
                success: false,
                error: this.categorizeError(message),
                message: message,
                statusCode: status,
                remainingAttempts: this.extractRemainingAttempts(message),
                remainingTime: this.extractRemainingTime(message)
            };
        } else if (error.code === 'ECONNREFUSED') {
            return {
                success: false,
                error: 'SERVER_DOWN',
                message: 'Serveur non accessible. Vérifiez votre connexion.',
                statusCode: 0
            };
        } else {
            return {
                success: false,
                error: 'NETWORK_ERROR',
                message: 'Erreur de réseau. Vérifiez votre connexion.',
                statusCode: 0
            };
        }
    }

    /**
     * 🏷️ Catégorisation des erreurs
     */
    categorizeError(message) {
        // Prioriser les messages avec tentatives restantes
        if (message.includes('Il vous reste') && message.includes('tentative')) {
            const remaining = this.extractRemainingAttempts(message);
            return remaining > 2 ? 'ATTEMPTS_REMAINING_SAFE' : 'ATTEMPTS_REMAINING_WARNING';
        }
        
        if (message.includes('Dernière tentative avant verrouillage')) {
            return 'LAST_ATTEMPT';
        }
        
        if (message.includes('verrouillé') && message.includes('Temps restant')) {
            return 'ACCOUNT_LOCKED';
        }
        
        if (message.includes('désactivé')) {
            return 'ACCOUNT_DISABLED';
        }
        
        if (message.includes('Email ou mot de passe incorrect')) {
            return 'INVALID_CREDENTIALS';
        }
        
        return 'UNKNOWN_ERROR';
    }

    /**
     * 🔢 Extraire le nombre de tentatives restantes
     */
    extractRemainingAttempts(message) {
        const match = message.match(/Il vous reste (\d+) tentative/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * ⏰ Extraire le temps restant
     */
    extractRemainingTime(message) {
        const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
        return timeMatch ? timeMatch[1].trim() : null;
    }

    /**
     * 🚨 Gestion des erreurs d'authentification
     */
    handleAuthError() {
        // Rediriger vers la page de connexion ou déclencher un événement
        window.dispatchEvent(new CustomEvent('auth:expired'));
    }
}

export default new AuthService();
```

---

## 🎨 **Étape 3: Composant de Messages d'Erreur**

Créez le fichier `src/components/ErrorMessage.jsx` :

```jsx
// src/components/ErrorMessage.jsx
import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onDismiss, className = '' }) => {
    if (!error) return null;

    const config = getErrorConfig(error.type);

    return (
        <div className={`error-message ${config.className} ${className}`}>
            <div className="error-header">
                <span className="error-icon" role="img" aria-label={config.title}>
                    {config.icon}
                </span>
                <span className="error-title">{config.title}</span>
                {onDismiss && (
                    <button 
                        className="error-close" 
                        onClick={onDismiss}
                        aria-label="Fermer le message d'erreur"
                        type="button"
                    >
                        ×
                    </button>
                )}
            </div>
            
            <div className="error-content">
                <p className="error-text">{error.message}</p>
                
                {/* 🔢 Indicateur de tentatives restantes */}
                {config.showAttempts && error.remainingAttempts !== null && (
                    <div className="attempts-indicator">
                        <div className="attempts-dots" aria-label={`${error.remainingAttempts} tentatives restantes sur 5`}>
                            {[...Array(5)].map((_, i) => (
                                <span 
                                    key={i}
                                    className={`attempt-dot ${i < error.remainingAttempts ? 'available' : 'used'}`}
                                />
                            ))}
                        </div>
                        <span className="attempts-text">
                            {error.remainingAttempts} tentative{error.remainingAttempts > 1 ? 's' : ''} restante{error.remainingAttempts > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
                
                {/* ⏰ Timer de déblocage */}
                {config.showTimer && error.remainingTime && (
                    <div className="lock-timer">
                        <span className="timer-icon" role="img" aria-label="Temps de déblocage">⏰</span>
                        <span className="timer-text">Déblocage dans : {error.remainingTime}</span>
                    </div>
                )}
                
                {/* 📧 Contact administrateur */}
                {config.showContact && (
                    <div className="contact-admin">
                        <button 
                            className="contact-button"
                            onClick={() => window.location.href = 'mailto:admin@printalma.com'}
                        >
                            📧 Contacter l'administrateur
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// 🎯 Configuration des types d'erreurs
function getErrorConfig(errorType) {
    const configs = {
        'ATTEMPTS_REMAINING_SAFE': {
            icon: '⚠️',
            className: 'error-warning',
            title: 'Tentatives restantes',
            showAttempts: true
        },
        'ATTEMPTS_REMAINING_WARNING': {
            icon: '🚨',
            className: 'error-critical',
            title: 'Attention!',
            showAttempts: true
        },
        'LAST_ATTEMPT': {
            icon: '💀',
            className: 'error-danger',
            title: 'Dernière chance!',
            showAttempts: false
        },
        'ACCOUNT_LOCKED': {
            icon: '🔒',
            className: 'error-locked',
            title: 'Compte verrouillé',
            showTimer: true
        },
        'ACCOUNT_DISABLED': {
            icon: '🚫',
            className: 'error-disabled',
            title: 'Compte désactivé',
            showContact: true
        },
        'INVALID_CREDENTIALS': {
            icon: '❌',
            className: 'error-invalid',
            title: 'Identifiants incorrects'
        },
        'SERVER_DOWN': {
            icon: '🔌',
            className: 'error-server',
            title: 'Serveur indisponible'
        },
        'NETWORK_ERROR': {
            icon: '🌐',
            className: 'error-network',
            title: 'Erreur de réseau'
        }
    };

    return configs[errorType] || {
        icon: '⚠️',
        className: 'error-general',
        title: 'Erreur'
    };
}

export default ErrorMessage;
```

---

## 🎨 **Étape 4: Styles CSS**

Créez le fichier `src/components/ErrorMessage.css` :

```css
/* src/components/ErrorMessage.css */

.error-message {
    border-radius: 8px;
    margin: 16px 0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 📝 Header */
.error-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    font-weight: 600;
}

.error-icon {
    font-size: 20px;
    margin-right: 8px;
}

.error-title {
    flex: 1;
    font-size: 16px;
}

.error-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.5);
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.error-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
}

/* 📄 Content */
.error-content {
    padding: 0 16px 16px;
}

.error-text {
    margin: 0 0 12px;
    line-height: 1.4;
}

/* 🎨 Types d'erreurs */
.error-warning {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    color: #856404;
}

.error-critical {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
}

.error-danger {
    background-color: #f5c6cb;
    border-left: 4px solid #dc3545;
    color: #721c24;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}

.error-locked {
    background-color: #e2e3e5;
    border-left: 4px solid #6c757d;
    color: #383d41;
}

.error-disabled {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
}

.error-invalid {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
}

.error-server {
    background-color: #f1c0c7;
    border-left: 4px solid #e74c3c;
    color: #721c24;
}

.error-network {
    background-color: #d1ecf1;
    border-left: 4px solid #17a2b8;
    color: #0c5460;
}

.error-general {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
}

/* 🔢 Indicateur de tentatives */
.attempts-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
    padding: 8px 12px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.attempts-dots {
    display: flex;
    gap: 4px;
}

.attempt-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.attempt-dot.available {
    background-color: #28a745;
    box-shadow: 0 0 4px rgba(40, 167, 69, 0.5);
}

.attempt-dot.used {
    background-color: #dc3545;
    opacity: 0.6;
}

.attempts-text {
    font-size: 14px;
    font-weight: 500;
}

/* ⏰ Timer de verrouillage */
.lock-timer {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 8px;
}

.timer-icon {
    font-size: 16px;
}

.timer-text {
    font-weight: 500;
    font-family: 'Courier New', monospace;
    color: #495057;
}

/* 📧 Contact admin */
.contact-admin {
    margin-top: 12px;
}

.contact-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    text-decoration: none;
    display: inline-block;
}

.contact-button:hover {
    background-color: #0056b3;
}

/* 📱 Responsive */
@media (max-width: 480px) {
    .error-message {
        margin: 12px 0;
    }
    
    .error-header {
        padding: 10px 12px;
        font-size: 14px;
    }
    
    .error-content {
        padding: 0 12px 12px;
    }
    
    .attempts-indicator {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .error-icon {
        font-size: 18px;
    }
}

/* 🌙 Dark mode support */
@media (prefers-color-scheme: dark) {
    .error-message {
        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
    }
    
    .attempts-indicator,
    .lock-timer {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    .timer-text {
        color: #e9ecef;
    }
}
```

---

## 🔐 **Étape 5: Formulaire de Connexion**

Créez le fichier `src/components/LoginForm.jsx` :

```jsx
// src/components/LoginForm.jsx
import React, { useState } from 'react';
import authService from '../services/authService';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import './LoginForm.css';

const LoginForm = ({ onLoginSuccess, onRequirePasswordChange }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email.trim() || !formData.password) {
            setError({
                type: 'INVALID_CREDENTIALS',
                message: 'Veuillez remplir tous les champs'
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(formData.email, formData.password);

            if (result.success) {
                // ✅ Connexion réussie
                onLoginSuccess && onLoginSuccess(result.user);
            } else if (result.mustChangePassword) {
                // 🔑 Changement de mot de passe requis
                onRequirePasswordChange && onRequirePasswordChange(result.userId, result.message);
            } else {
                // ❌ Erreur de connexion
                setError({
                    type: result.error,
                    message: result.message,
                    remainingAttempts: result.remainingAttempts,
                    remainingTime: result.remainingTime
                });
            }
        } catch (error) {
            setError({
                type: 'NETWORK_ERROR',
                message: 'Erreur de connexion au serveur'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Effacer l'erreur quand l'utilisateur tape
        if (error) setError(null);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <div className="login-header">
                    <h1>🔐 PrintAlma</h1>
                    <p>Connectez-vous à votre compte</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            📧 Adresse email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            placeholder="votre@email.com"
                            required
                            disabled={loading}
                            className={`form-input ${error ? 'error' : ''}`}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            🔑 Mot de passe
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onKeyPress={handleKeyPress}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className={`form-input ${error ? 'error' : ''}`}
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <ErrorMessage 
                            error={error}
                            onDismiss={() => setError(null)}
                        />
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`login-button ${loading ? 'loading' : ''}`}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" />
                                Connexion...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Problème de connexion ? Contactez l'administrateur</p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
```

---

## 🎨 **Étape 6: Styles du Formulaire**

Créez le fichier `src/components/LoginForm.css` :

```css
/* src/components/LoginForm.css */

.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-form {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    padding: 40px;
    width: 100%;
    max-width: 400px;
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.login-header h1 {
    margin: 0 0 8px;
    color: #2c3e50;
    font-size: 28px;
    font-weight: 700;
}

.login-header p {
    margin: 0;
    color: #7f8c8d;
    font-size: 16px;
}

.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    color: #2c3e50;
    font-weight: 600;
    font-size: 14px;
}

.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e1e8ed;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
    background-color: #fff;
    box-sizing: border-box;
}

.form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.7;
}

.form-input.error {
    border-color: #e74c3c;
}

.form-input.error:focus {
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.login-button {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
}

.login-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-button:active {
    transform: translateY(0);
}

.login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.login-button.loading {
    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
}

.login-footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e1e8ed;
}

.login-footer p {
    margin: 0;
    color: #7f8c8d;
    font-size: 14px;
}

/* 📱 Responsive */
@media (max-width: 480px) {
    .login-container {
        padding: 10px;
    }
    
    .login-form {
        padding: 30px 20px;
    }
    
    .login-header h1 {
        font-size: 24px;
    }
    
    .form-input {
        font-size: 16px; /* Empêche le zoom sur iOS */
    }
}

/* 🌙 Dark mode */
@media (prefers-color-scheme: dark) {
    .login-form {
        background: #2c3e50;
        color: #ecf0f1;
    }
    
    .login-header h1 {
        color: #ecf0f1;
    }
    
    .form-label {
        color: #bdc3c7;
    }
    
    .form-input {
        background-color: #34495e;
        border-color: #4a6741;
        color: #ecf0f1;
    }
    
    .form-input:focus {
        border-color: #667eea;
    }
    
    .login-footer {
        border-top-color: #4a6741;
    }
}
```

---

## 🔄 **Étape 7: Composant de Changement de Mot de Passe**

Créez le fichier `src/components/ChangePasswordForm.jsx` :

```jsx
// src/components/ChangePasswordForm.jsx
import React, { useState } from 'react';
import authService from '../services/authService';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import './ChangePasswordForm.css';

const ChangePasswordForm = ({ userId, message, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError({
                type: 'INVALID_CREDENTIALS',
                message: 'Veuillez remplir tous les champs'
            });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError({
                type: 'INVALID_CREDENTIALS',
                message: 'Les nouveaux mots de passe ne correspondent pas'
            });
            return;
        }

        if (formData.newPassword.length < 8) {
            setError({
                type: 'INVALID_CREDENTIALS',
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await authService.forceChangePassword(
                userId,
                formData.currentPassword,
                formData.newPassword,
                formData.confirmPassword
            );

            if (result.success) {
                onSuccess && onSuccess(result.user);
            } else {
                setError({
                    type: result.error,
                    message: result.message
                });
            }
        } catch (error) {
            setError({
                type: 'NETWORK_ERROR',
                message: 'Erreur de connexion au serveur'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Calculer la force du mot de passe
        if (name === 'newPassword') {
            setPasswordStrength(calculatePasswordStrength(value));
        }
        
        if (error) setError(null);
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/)) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        return strength;
    };

    const getStrengthColor = (strength) => {
        if (strength < 25) return '#e74c3c';
        if (strength < 50) return '#f39c12';
        if (strength < 75) return '#f1c40f';
        return '#27ae60';
    };

    const getStrengthText = (strength) => {
        if (strength < 25) return 'Très faible';
        if (strength < 50) return 'Faible';
        if (strength < 75) return 'Moyen';
        return 'Fort';
    };

    return (
        <div className="change-password-container">
            <div className="change-password-form">
                <div className="change-password-header">
                    <h1>🔑 Changement de mot de passe</h1>
                    <p>{message}</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="currentPassword" className="form-label">
                            🔓 Mot de passe actuel
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Votre mot de passe actuel"
                            required
                            disabled={loading}
                            className="form-input"
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">
                            🔐 Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Minimum 8 caractères"
                            required
                            disabled={loading}
                            className="form-input"
                            autoComplete="new-password"
                        />
                        
                        {formData.newPassword && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div 
                                        className="strength-fill"
                                        style={{
                                            width: `${passwordStrength}%`,
                                            backgroundColor: getStrengthColor(passwordStrength)
                                        }}
                                    />
                                </div>
                                <span 
                                    className="strength-text"
                                    style={{ color: getStrengthColor(passwordStrength) }}
                                >
                                    {getStrengthText(passwordStrength)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            ✅ Confirmer le nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Répétez le nouveau mot de passe"
                            required
                            disabled={loading}
                            className={`form-input ${
                                formData.confirmPassword && 
                                formData.newPassword !== formData.confirmPassword 
                                    ? 'error' : ''
                            }`}
                            autoComplete="new-password"
                        />
                        
                        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                            <span className="field-error">
                                Les mots de passe ne correspondent pas
                            </span>
                        )}
                    </div>

                    {error && (
                        <ErrorMessage 
                            error={error}
                            onDismiss={() => setError(null)}
                        />
                    )}

                    <div className="form-actions">
                        <button 
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="cancel-button"
                        >
                            Annuler
                        </button>
                        
                        <button 
                            type="submit" 
                            disabled={loading || passwordStrength < 50}
                            className={`submit-button ${loading ? 'loading' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    Changement...
                                </>
                            ) : (
                                'Changer le mot de passe'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordForm;
```

---

## 🔄 **Étape 8: Context d'Authentification**

Créez le fichier `src/contexts/AuthContext.jsx` :

```jsx
// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Actions
const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_ERROR: 'LOGIN_ERROR',
    LOGOUT: 'LOGOUT',
    REQUIRE_PASSWORD_CHANGE: 'REQUIRE_PASSWORD_CHANGE',
    UPDATE_USER: 'UPDATE_USER',
    CHECK_AUTH: 'CHECK_AUTH'
};

// État initial
const initialState = {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
    mustChangePassword: false,
    tempUserId: null
};

// Reducer
function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
            return {
                ...state,
                loading: true,
                error: null
            };
            
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                loading: false,
                error: null,
                mustChangePassword: false,
                tempUserId: null
            };
            
        case AUTH_ACTIONS.LOGIN_ERROR:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                loading: false,
                error: action.payload
            };
            
        case AUTH_ACTIONS.REQUIRE_PASSWORD_CHANGE:
            return {
                ...state,
                mustChangePassword: true,
                tempUserId: action.payload.userId,
                loading: false,
                error: null
            };
            
        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,
                mustChangePassword: false,
                tempUserId: null
            };
            
        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: action.payload
            };
            
        case AUTH_ACTIONS.CHECK_AUTH:
            return {
                ...state,
                loading: false
            };
            
        default:
            return state;
    }
}

// Context
const AuthContext = createContext();

// Provider
export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Vérifier l'authentification au chargement
    useEffect(() => {
        checkAuthStatus();
        
        // Écouter les événements d'expiration de session
        const handleAuthExpired = () => {
            logout();
        };
        
        window.addEventListener('auth:expired', handleAuthExpired);
        
        return () => {
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
    }, []);

    const checkAuthStatus = async () => {
        try {
            const result = await authService.checkAuth();
            if (result.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: result.user
                });
            } else {
                dispatch({ type: AUTH_ACTIONS.CHECK_AUTH });
            }
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.CHECK_AUTH });
        }
    };

    const login = async (email, password) => {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });
        
        try {
            const result = await authService.login(email, password);
            
            if (result.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: result.user
                });
                return { success: true };
            } else if (result.mustChangePassword) {
                dispatch({
                    type: AUTH_ACTIONS.REQUIRE_PASSWORD_CHANGE,
                    payload: { userId: result.userId, message: result.message }
                });
                return { success: false, mustChangePassword: true };
            } else {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_ERROR,
                    payload: result
                });
                return { success: false, error: result };
            }
        } catch (error) {
            const errorData = {
                type: 'NETWORK_ERROR',
                message: 'Erreur de connexion'
            };
            dispatch({
                type: AUTH_ACTIONS.LOGIN_ERROR,
                payload: errorData
            });
            return { success: false, error: errorData };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.warn('Erreur lors de la déconnexion:', error);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    const changePassword = async (userId, currentPassword, newPassword, confirmPassword) => {
        try {
            const result = await authService.forceChangePassword(
                userId,
                currentPassword,
                newPassword,
                confirmPassword
            );
            
            if (result.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: result.user
                });
                return { success: true };
            } else {
                return { success: false, error: result };
            }
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'NETWORK_ERROR',
                    message: 'Erreur de connexion'
                }
            };
        }
    };

    const updateUser = (userData) => {
        dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: userData
        });
    };

    const value = {
        ...state,
        login,
        logout,
        changePassword,
        updateUser,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personnalisé
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
}

export default AuthContext;
```

---

## 📱 **Étape 9: Composant Principal de l'Application**

Créez le fichier `src/App.jsx` :

```jsx
// src/App.jsx
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import ChangePasswordForm from './components/ChangePasswordForm';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function AppContent() {
    const { 
        user, 
        isAuthenticated, 
        loading, 
        error, 
        mustChangePassword, 
        tempUserId,
        login, 
        logout, 
        changePassword 
    } = useAuth();

    const handleLoginSuccess = (userData) => {
        console.log('Connexion réussie:', userData);
    };

    const handleRequirePasswordChange = (userId, message) => {
        console.log('Changement de mot de passe requis pour:', userId);
    };

    const handlePasswordChangeSuccess = (userData) => {
        console.log('Mot de passe changé avec succès:', userData);
    };

    const handlePasswordChangeCancel = () => {
        logout();
    };

    const handleLogin = async (email, password) => {
        const result = await login(email, password);
        
        if (result.success) {
            handleLoginSuccess(user);
        } else if (result.mustChangePassword) {
            handleRequirePasswordChange(tempUserId, 'Changement requis');
        }
        
        return result;
    };

    const handleChangePassword = async (currentPassword, newPassword, confirmPassword) => {
        const result = await changePassword(tempUserId, currentPassword, newPassword, confirmPassword);
        
        if (result.success) {
            handlePasswordChangeSuccess(user);
        }
        
        return result;
    };

    // Écran de chargement
    if (loading) {
        return (
            <div className="app-loading">
                <LoadingSpinner size="large" />
                <p>Chargement...</p>
            </div>
        );
    }

    // Changement de mot de passe requis
    if (mustChangePassword) {
        return (
            <ChangePasswordForm
                userId={tempUserId}
                message="Vous devez changer votre mot de passe avant de continuer"
                onSuccess={handlePasswordChangeSuccess}
                onCancel={handlePasswordChangeCancel}
            />
        );
    }

    // Utilisateur connecté
    if (isAuthenticated && user) {
        return (
            <Dashboard 
                user={user} 
                onLogout={logout}
            />
        );
    }

    // Formulaire de connexion
    return (
        <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onRequirePasswordChange={handleRequirePasswordChange}
            loginHandler={handleLogin}
            error={error}
        />
    );
}

function App() {
    return (
        <AuthProvider>
            <div className="app">
                <AppContent />
            </div>
        </AuthProvider>
    );
}

export default App;
```

---

## 🎨 **Étape 10: Composants Utilitaires**

### **LoadingSpinner.jsx**

```jsx
// src/components/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = '#667eea' }) => {
    return (
        <div className={`loading-spinner ${size}`}>
            <div 
                className="spinner"
                style={{ borderTopColor: color }}
            />
        </div>
    );
};

export default LoadingSpinner;
```

### **LoadingSpinner.css**

```css
/* src/components/LoadingSpinner.css */

.loading-spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.spinner {
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-spinner.small .spinner {
    width: 16px;
    height: 16px;
    border-width: 2px;
}

.loading-spinner.medium .spinner {
    width: 24px;
    height: 24px;
    border-width: 3px;
}

.loading-spinner.large .spinner {
    width: 40px;
    height: 40px;
    border-width: 4px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

## 📊 **Étape 11: Tests**

### **Installer les dépendances de test**

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### **LoginForm.test.jsx**

```jsx
// src/components/__tests__/LoginForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';
import authService from '../../services/authService';

// Mock du service
jest.mock('../../services/authService');

const mockOnLoginSuccess = jest.fn();
const mockOnRequirePasswordChange = jest.fn();

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le formulaire de connexion', () => {
        render(
            <LoginForm 
                onLoginSuccess={mockOnLoginSuccess}
                onRequirePasswordChange={mockOnRequirePasswordChange}
            />
        );

        expect(screen.getByText('🔐 PrintAlma')).toBeInTheDocument();
        expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
    });

    test('affiche une erreur pour les champs vides', async () => {
        const user = userEvent.setup();
        
        render(
            <LoginForm 
                onLoginSuccess={mockOnLoginSuccess}
                onRequirePasswordChange={mockOnRequirePasswordChange}
            />
        );

        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        expect(screen.getByText(/veuillez remplir tous les champs/i)).toBeInTheDocument();
    });

    test('gère la connexion réussie', async () => {
        const user = userEvent.setup();
        const mockUser = { id: 1, email: 'test@example.com', firstName: 'Test' };
        
        authService.login.mockResolvedValue({
            success: true,
            user: mockUser
        });

        render(
            <LoginForm 
                onLoginSuccess={mockOnLoginSuccess}
                onRequirePasswordChange={mockOnRequirePasswordChange}
            />
        );

        await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
        });
    });

    test('affiche le message de tentatives restantes', async () => {
        const user = userEvent.setup();
        
        authService.login.mockResolvedValue({
            success: false,
            error: 'ATTEMPTS_REMAINING_SAFE',
            message: '❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives.',
            remainingAttempts: 3
        });

        render(
            <LoginForm 
                onLoginSuccess={mockOnLoginSuccess}
                onRequirePasswordChange={mockOnRequirePasswordChange}
            />
        );

        await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/mot de passe/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText(/il vous reste 3 tentatives/i)).toBeInTheDocument();
        });
    });

    test('affiche le message de compte verrouillé', async () => {
        const user = userEvent.setup();
        
        authService.login.mockResolvedValue({
            success: false,
            error: 'ACCOUNT_LOCKED',
            message: '🔒 Votre compte est temporairement verrouillé. Temps restant : 25 minutes',
            remainingTime: '25 minutes'
        });

        render(
            <LoginForm 
                onLoginSuccess={mockOnLoginSuccess}
                onRequirePasswordChange={mockOnRequirePasswordChange}
            />
        );

        await user.type(screen.getByLabelText(/adresse email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/mot de passe/i), 'anypassword');
        await user.click(screen.getByRole('button', { name: /se connecter/i }));

        await waitFor(() => {
            expect(screen.getByText(/déblocage dans : 25 minutes/i)).toBeInTheDocument();
        });
    });
});
```

---

## 🚀 **Étape 12: Guide de Test**

### **Comment tester votre implémentation**

1. **Modifiez l'email de test** dans `quick-test-login.js` :
   ```javascript
   const TEST_EMAIL = 'votre-email-existant@printalma.com';
   ```

2. **Lancez le test backend** :
   ```bash
   node quick-test-login.js
   ```

3. **Résultats attendus** :
   - Messages progressifs avec décompte des tentatives
   - Verrouillage après 5 tentatives
   - Temps de déblocage affiché

4. **Testez votre frontend** :
   ```bash
   npm start
   # ou
   yarn start
   ```

---

## 📋 **Checklist d'Intégration**

### **✅ Backend (Déjà fait)**
- [x] Messages d'erreur informatifs
- [x] Gestion des tentatives restantes
- [x] Protection SUPERADMIN
- [x] Endpoint de déblocage admin

### **✅ Frontend (À faire)**
- [ ] Installer et configurer Axios
- [ ] Créer le service d'authentification
- [ ] Créer les composants d'interface
- [ ] Ajouter les styles CSS
- [ ] Configurer le contexte d'authentification
- [ ] Tester l'intégration complète

---

## 🎯 **Résumé des Fonctionnalités**

### **🔐 Authentification**
- Connexion avec gestion d'erreurs détaillées
- Messages progressifs pour tentatives restantes
- Affichage du temps de verrouillage
- Changement de mot de passe forcé
- Déconnexion sécurisée

### **🎨 Interface Utilisateur**
- Design moderne et responsive
- Indicateurs visuels pour tentatives
- Timer de déblocage en temps réel
- Messages d'erreur catégorisés
- Mode sombre supporté

### **🛡️ Sécurité**
- Cookies httpOnly sécurisés
- Protection SUPERADMIN
- Validation côté client et serveur
- Gestion des sessions expirées

### **📱 Fonctionnalités Avancées**
- Support mobile complet
- Tests unitaires inclus
- Context React pour état global
- Intercepteurs de requêtes
- Gestion d'erreurs robuste

---

**🎉 Votre système d'authentification PrintAlma est maintenant prêt à être intégré !**

Pour toute question ou assistance supplémentaire, consultez la documentation technique complète dans `FRONTEND_LOGIN_ERROR_HANDLING.md`. 