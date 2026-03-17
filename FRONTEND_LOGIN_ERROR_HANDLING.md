# 🎯 Gestion des Erreurs de Connexion - Frontend

## 📋 **Vue d'Ensemble**

Ce document explique comment implémenter côté frontend la gestion des différents types d'erreurs de connexion avec des messages informatifs pour l'utilisateur.

---

## 🔗 **Types d'Erreurs de Connexion**

### **1. 🚫 Email ou Mot de Passe Incorrect**
```json
{
    "statusCode": 401,
    "message": "❌ Email ou mot de passe incorrect"
}
```

### **2. 📉 Tentatives Restantes**
```json
{
    "statusCode": 401,
    "message": "❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives."
}
```

### **3. ⚠️ Dernière Tentative**
```json
{
    "statusCode": 401,
    "message": "❌ Email ou mot de passe incorrect. ⚠️ Dernière tentative avant verrouillage."
}
```

### **4. 🔒 Compte Verrouillé**
```json
{
    "statusCode": 401,
    "message": "🔒 Votre compte est temporairement verrouillé. Temps restant : 25 minutes"
}
```

### **5. 🚫 Compte Désactivé**
```json
{
    "statusCode": 401,
    "message": "🚫 Votre compte a été désactivé. Contactez l'administrateur."
}
```

### **6. 🔑 Changement de Mot de Passe Requis**
```json
{
    "mustChangePassword": true,
    "userId": 123,
    "message": "Vous devez changer votre mot de passe avant de continuer"
}
```

---

## 🎨 **Implémentation React - AuthService**

### **Service d'Authentification**

```javascript
// services/authService.js
import axios from 'axios';

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: 'http://localhost:3004',
            withCredentials: true,
            timeout: 10000
        });
    }

    async login(email, password) {
        try {
            const response = await this.api.post('/auth/login', {
                email,
                password
            });

            // Connexion réussie
            if (response.data.user) {
                return {
                    success: true,
                    user: response.data.user,
                    mustChangePassword: false
                };
            }

            // Changement de mot de passe requis
            if (response.data.mustChangePassword) {
                return {
                    success: false,
                    mustChangePassword: true,
                    userId: response.data.userId,
                    message: response.data.message
                };
            }

        } catch (error) {
            if (error.response) {
                const { status, data } = error.response;
                const message = data.message || 'Erreur de connexion';

                return {
                    success: false,
                    error: this.categorizeError(message),
                    message: message,
                    statusCode: status
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
    }

    categorizeError(message) {
        if (message.includes('Il vous reste') && message.includes('tentatives')) {
            const match = message.match(/Il vous reste (\d+) tentative/);
            const remaining = match ? parseInt(match[1]) : 0;
            
            if (remaining > 2) {
                return 'ATTEMPTS_REMAINING_SAFE';
            } else if (remaining > 0) {
                return 'ATTEMPTS_REMAINING_WARNING';
            }
        }
        
        if (message.includes('Dernière tentative')) {
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

    extractRemainingTime(message) {
        const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
        return timeMatch ? timeMatch[1].trim() : null;
    }

    extractRemainingAttempts(message) {
        const match = message.match(/Il vous reste (\d+) tentative/);
        return match ? parseInt(match[1]) : null;
    }
}

export default new AuthService();
```

---

## 🎨 **Composant de Connexion React**

### **LoginForm.jsx**

```jsx
import React, { useState } from 'react';
import authService from '../services/authService';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

const LoginForm = ({ onLoginSuccess, onRequirePasswordChange }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(formData.email, formData.password);

            if (result.success) {
                // Connexion réussie
                onLoginSuccess(result.user);
            } else if (result.mustChangePassword) {
                // Redirection vers changement de mot de passe
                onRequirePasswordChange(result.userId, result.message);
            } else {
                // Erreur de connexion
                setError({
                    type: result.error,
                    message: result.message,
                    remainingAttempts: authService.extractRemainingAttempts(result.message),
                    remainingTime: authService.extractRemainingTime(result.message)
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
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="login-form">
            <form onSubmit={handleSubmit}>
                <h2>🔐 Connexion</h2>
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="form-input"
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
                    className="login-button"
                >
                    {loading ? <LoadingSpinner /> : 'Se connecter'}
                </button>
            </form>
        </div>
    );
};

export default LoginForm;
```

---

## 🎨 **Composant de Messages d'Erreur**

### **ErrorMessage.jsx**

```jsx
import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onDismiss }) => {
    const getErrorConfig = (errorType) => {
        switch (errorType) {
            case 'ATTEMPTS_REMAINING_SAFE':
                return {
                    icon: '⚠️',
                    className: 'error-warning',
                    title: 'Tentatives restantes',
                    showAttempts: true
                };
            
            case 'ATTEMPTS_REMAINING_WARNING':
                return {
                    icon: '🚨',
                    className: 'error-critical',
                    title: 'Attention!',
                    showAttempts: true
                };
            
            case 'LAST_ATTEMPT':
                return {
                    icon: '💀',
                    className: 'error-danger',
                    title: 'Dernière chance!',
                    showAttempts: false
                };
            
            case 'ACCOUNT_LOCKED':
                return {
                    icon: '🔒',
                    className: 'error-locked',
                    title: 'Compte verrouillé',
                    showTimer: true
                };
            
            case 'ACCOUNT_DISABLED':
                return {
                    icon: '🚫',
                    className: 'error-disabled',
                    title: 'Compte désactivé',
                    showContact: true
                };
            
            case 'INVALID_CREDENTIALS':
                return {
                    icon: '❌',
                    className: 'error-invalid',
                    title: 'Identifiants incorrects'
                };
            
            default:
                return {
                    icon: '⚠️',
                    className: 'error-general',
                    title: 'Erreur'
                };
        }
    };

    const config = getErrorConfig(error.type);

    return (
        <div className={`error-message ${config.className}`}>
            <div className="error-header">
                <span className="error-icon">{config.icon}</span>
                <span className="error-title">{config.title}</span>
                <button 
                    className="error-close" 
                    onClick={onDismiss}
                    aria-label="Fermer"
                >
                    ×
                </button>
            </div>
            
            <div className="error-content">
                <p className="error-text">{error.message}</p>
                
                {config.showAttempts && error.remainingAttempts && (
                    <div className="attempts-indicator">
                        <div className="attempts-dots">
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
                
                {config.showTimer && error.remainingTime && (
                    <div className="lock-timer">
                        <span className="timer-icon">⏰</span>
                        <span className="timer-text">Déblocage dans : {error.remainingTime}</span>
                    </div>
                )}
                
                {config.showContact && (
                    <div className="contact-admin">
                        <button className="contact-button">
                            📧 Contacter l'administrateur
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
```

---

## 🎨 **Styles CSS**

### **ErrorMessage.css**

```css
.error-message {
    border-radius: 8px;
    margin: 16px 0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
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

.error-content {
    padding: 0 16px 16px;
}

.error-text {
    margin: 0 0 12px;
    line-height: 1.4;
}

/* Types d'erreurs */
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

.error-general {
    background-color: #f8d7da;
    border-left: 4px solid #dc3545;
    color: #721c24;
}

/* Indicateur de tentatives */
.attempts-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
}

.attempts-dots {
    display: flex;
    gap: 4px;
}

.attempt-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transition: background-color 0.3s;
}

.attempt-dot.available {
    background-color: #28a745;
    box-shadow: 0 0 4px rgba(40, 167, 69, 0.5);
}

.attempt-dot.used {
    background-color: #dc3545;
}

.attempts-text {
    font-size: 14px;
    font-weight: 500;
}

/* Timer de verrouillage */
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
    font-family: monospace;
}

/* Contact admin */
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
}

.contact-button:hover {
    background-color: #0056b3;
}

/* Responsive */
@media (max-width: 480px) {
    .error-header {
        padding: 10px 12px;
    }
    
    .error-content {
        padding: 0 12px 12px;
    }
    
    .attempts-indicator {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
```

---

## 🎨 **Utilisation dans l'Application**

### **App.jsx**

```jsx
import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import ChangePasswordForm from './components/ChangePasswordForm';
import Dashboard from './components/Dashboard';

const App = () => {
    const [user, setUser] = useState(null);
    const [requirePasswordChange, setRequirePasswordChange] = useState(null);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setRequirePasswordChange(null);
    };

    const handleRequirePasswordChange = (userId, message) => {
        setRequirePasswordChange({ userId, message });
    };

    const handlePasswordChangeSuccess = (userData) => {
        setUser(userData);
        setRequirePasswordChange(null);
    };

    // Si l'utilisateur est connecté
    if (user) {
        return <Dashboard user={user} onLogout={() => setUser(null)} />;
    }

    // Si changement de mot de passe requis
    if (requirePasswordChange) {
        return (
            <ChangePasswordForm
                userId={requirePasswordChange.userId}
                message={requirePasswordChange.message}
                onSuccess={handlePasswordChangeSuccess}
                onCancel={() => setRequirePasswordChange(null)}
            />
        );
    }

    // Formulaire de connexion
    return (
        <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onRequirePasswordChange={handleRequirePasswordChange}
        />
    );
};

export default App;
```

---

## 🧪 **Tests Frontend**

### **LoginForm.test.jsx**

```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';
import authService from '../../services/authService';

// Mock du service
jest.mock('../../services/authService');

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('affiche le message de tentatives restantes', async () => {
        authService.login.mockResolvedValue({
            success: false,
            error: 'ATTEMPTS_REMAINING_SAFE',
            message: '❌ Email ou mot de passe incorrect. Il vous reste 3 tentatives.'
        });

        const { container } = render(<LoginForm />);
        
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'wrongpassword' }
        });
        fireEvent.click(screen.getByText(/se connecter/i));

        await waitFor(() => {
            expect(screen.getByText(/Il vous reste 3 tentatives/)).toBeInTheDocument();
        });
    });

    test('affiche le message de dernière tentative', async () => {
        authService.login.mockResolvedValue({
            success: false,
            error: 'LAST_ATTEMPT',
            message: '❌ Email ou mot de passe incorrect. ⚠️ Dernière tentative avant verrouillage.'
        });

        render(<LoginForm />);
        
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'wrongpassword' }
        });
        fireEvent.click(screen.getByText(/se connecter/i));

        await waitFor(() => {
            expect(screen.getByText(/Dernière tentative avant verrouillage/)).toBeInTheDocument();
        });
    });

    test('affiche le message de compte verrouillé', async () => {
        authService.login.mockResolvedValue({
            success: false,
            error: 'ACCOUNT_LOCKED',
            message: '🔒 Votre compte est temporairement verrouillé. Temps restant : 25 minutes'
        });

        render(<LoginForm />);
        
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), {
            target: { value: 'anypassword' }
        });
        fireEvent.click(screen.getByText(/se connecter/i));

        await waitFor(() => {
            expect(screen.getByText(/Déblocage dans : 25 minutes/)).toBeInTheDocument();
        });
    });
});
```

---

## 📱 **Version Mobile-Friendly**

### **MobileErrorMessage.jsx**

```jsx
import React from 'react';

const MobileErrorMessage = ({ error, onDismiss }) => {
    return (
        <div className="mobile-error-overlay">
            <div className="mobile-error-modal">
                <div className="mobile-error-header">
                    <h3>{getErrorTitle(error.type)}</h3>
                    <button onClick={onDismiss}>×</button>
                </div>
                
                <div className="mobile-error-body">
                    <div className="error-icon-large">
                        {getErrorIcon(error.type)}
                    </div>
                    
                    <p>{error.message}</p>
                    
                    {error.remainingAttempts && (
                        <div className="mobile-attempts">
                            <div className="attempts-circle">
                                {error.remainingAttempts}
                            </div>
                            <span>tentatives restantes</span>
                        </div>
                    )}
                    
                    {error.remainingTime && (
                        <div className="mobile-timer">
                            <div className="timer-display">
                                {error.remainingTime}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mobile-error-footer">
                    <button onClick={onDismiss}>
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );
};

const getErrorTitle = (type) => {
    switch (type) {
        case 'ATTEMPTS_REMAINING_SAFE':
        case 'ATTEMPTS_REMAINING_WARNING': return 'Tentatives restantes';
        case 'LAST_ATTEMPT': return 'Dernière chance!';
        case 'ACCOUNT_LOCKED': return 'Compte verrouillé';
        case 'ACCOUNT_DISABLED': return 'Compte désactivé';
        default: return 'Erreur de connexion';
    }
};

const getErrorIcon = (type) => {
    switch (type) {
        case 'ATTEMPTS_REMAINING_SAFE': return '⚠️';
        case 'ATTEMPTS_REMAINING_WARNING': return '🚨';
        case 'LAST_ATTEMPT': return '💀';
        case 'ACCOUNT_LOCKED': return '🔒';
        case 'ACCOUNT_DISABLED': return '🚫';
        default: return '❌';
    }
};

export default MobileErrorMessage;
```

---

## 📋 **Checklist d'Implémentation**

### **Backend ✅**
- [x] Messages d'erreur informatifs
- [x] Gestion des tentatives restantes
- [x] Protection SUPERADMIN
- [x] Endpoint de déblocage admin

### **Frontend à Implémenter**
- [ ] Service d'authentification avec gestion d'erreurs
- [ ] Composant de formulaire de connexion
- [ ] Composant de messages d'erreur
- [ ] Styles CSS pour les différents types d'erreur
- [ ] Tests unitaires
- [ ] Version mobile
- [ ] Gestion du changement de mot de passe forcé

---

**🎯 Cette implémentation offre une expérience utilisateur complète et informative pour tous les cas d'erreur de connexion possibles.** 