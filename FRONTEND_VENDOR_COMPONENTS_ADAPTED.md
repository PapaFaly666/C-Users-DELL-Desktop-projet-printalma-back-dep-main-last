# 🎨 Composants Frontend : Implémentation Pratique (Basé sur pro.md)

## 🎯 Composants React Adapés du Backend

Ce fichier contient l'implémentation concrète des composants React basés exactement sur l'architecture du guide backend `pro.md`.

## 🔐 Composants d'Authentification (AuthService Backend)

### 1. **VendorLogin** (Équivalent AuthService.login)

```tsx
// src/components/auth/VendorLogin.tsx
// ✅ Composant miroir du AuthService.login backend

import React, { useState } from 'react';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import { DateUtils } from '../../utils/dateUtils';

interface VendorLoginProps {
  onSuccess?: () => void;
}

export const VendorLogin: React.FC<VendorLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, error, vendor } = useVendorAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // ✅ Backend a automatiquement mis à jour last_login_at
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion Vendeur
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez à votre tableau de bord vendeur PrintAlma
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* 📧 Email */}
          <div>
            <label htmlFor="email" className="sr-only">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* 🔒 Mot de passe */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* ❌ Erreur */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">❌</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur de connexion
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🚀 Bouton de connexion */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>

          {/* 🔗 Liens utiles */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="/vendor/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Créer un compte vendeur
              </a>
            </div>
            <div className="text-sm">
              <a href="/vendor/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Mot de passe oublié ?
              </a>
            </div>
          </div>
        </form>

        {/* 📊 Info dernière connexion (si disponible) */}
        {vendor?.last_login_at && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Dernière connexion : {DateUtils.formatLastSeen(vendor.last_login_at)}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2. **VendorProfile** (Équivalent AuthService.updateVendorProfile)

```tsx
// src/components/vendor/VendorProfile.tsx
// ✅ Composant miroir du AuthService.updateVendorProfile backend

import React, { useState, useEffect } from 'react';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import { VendorUtils } from '../../utils/vendorUtils';
import { DateUtils } from '../../utils/dateUtils';

export const VendorProfile: React.FC = () => {
  const { vendor, updateProfile, loading, error } = useVendorAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    address: '',
    shop_name: '',
    vendeur_type: 'INDIVIDUEL' as 'INDIVIDUEL' | 'ENTREPRISE'
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ✅ Initialiser le formulaire avec les données vendeur
  useEffect(() => {
    if (vendor) {
      setFormData({
        firstName: vendor.firstName || '',
        lastName: vendor.lastName || '',
        phone: vendor.phone || '',
        country: vendor.country || '',
        address: vendor.address || '',
        shop_name: vendor.shop_name || '',
        vendeur_type: vendor.vendeur_type || 'INDIVIDUEL'
      });
    }
  }, [vendor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // ✅ Validation en temps réel (miroir du backend)
    if (name === 'shop_name' && value) {
      const validation = VendorUtils.validateShopName(value);
      setValidationErrors(prev => ({
        ...prev,
        shop_name: validation.isValid ? '' : validation.error || ''
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validation avant envoi (miroir des validations backend)
    const errors: Record<string, string> = {};

    if (formData.shop_name) {
      const shopValidation = VendorUtils.validateShopName(formData.shop_name);
      if (!shopValidation.isValid) {
        errors.shop_name = shopValidation.error || 'Nom de boutique invalide';
      }
    }

    if (formData.phone && !VendorUtils.isValidFrenchPhone(formData.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const result = await updateProfile(formData, profilePhoto || undefined);

      if (result.success) {
        setIsEditing(false);
        setProfilePhoto(null);
        setPhotoPreview(null);
        // ✅ Backend a automatiquement mis à jour updated_at
      }
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
    }
  };

  if (!vendor) {
    return <div>Chargement du profil...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* 🎭 En-tête du profil */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-5">
            {/* 📸 Photo de profil */}
            <div className="flex-shrink-0">
              <img
                className="mx-auto h-20 w-20 rounded-full"
                src={photoPreview || vendor.profile_photo_url || '/default-avatar.png'}
                alt={`${vendor.firstName} ${vendor.lastName}`}
              />
              {isEditing && (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
            </div>

            {/* 👤 Informations de base */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                {VendorUtils.getFullName(vendor)}
              </h1>
              <p className="text-sm font-medium text-gray-500">
                {vendor.email}
              </p>

              {/* ⚡ Statut du compte */}
              <div className="mt-2 flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  VendorUtils.getStatusColor(vendor as any).badge
                }`}>
                  {VendorUtils.getStatusText(vendor as any)}
                </span>

                {vendor.vendeur_type && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {vendor.vendeur_type}
                  </span>
                )}
              </div>

              {/* 📅 Informations temporelles */}
              <div className="mt-2 text-sm text-gray-500 space-y-1">
                <div>📅 {DateUtils.formatMemberSince(vendor.created_at, 'long')}</div>
                {vendor.last_login_at && (
                  <div>🕐 {DateUtils.formatLastSeen(vendor.last_login_at)}</div>
                )}
                {vendor.updated_at && (
                  <div>🔄 Profil modifié {DateUtils.formatLastSeen(vendor.updated_at)}</div>
                )}
              </div>
            </div>

            {/* ✏️ Bouton d'édition */}
            <div className="flex-shrink-0">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ✏️ Modifier
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProfilePhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    ❌ Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✏️ Formulaire d'édition */}
      {isEditing && (
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Modifier le profil
            </h3>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 👤 Informations personnelles */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* 🏪 Informations boutique */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom de la boutique
                </label>
                <input
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    validationErrors.shop_name ? 'border-red-300' : ''
                  }`}
                  placeholder="Nom de votre boutique (optionnel)"
                />
                {validationErrors.shop_name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.shop_name}</p>
                )}
              </div>

              {/* 📱 Contact */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                      validationErrors.phone ? 'border-red-300' : ''
                    }`}
                    placeholder="+33 6 12 34 56 78"
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="France"
                  />
                </div>
              </div>

              {/* 🏠 Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Adresse
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Adresse complète"
                />
              </div>

              {/* 🏢 Type de vendeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type de vendeur
                </label>
                <select
                  name="vendeur_type"
                  value={formData.vendeur_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="INDIVIDUEL">Individuel</option>
                  <option value="ENTREPRISE">Entreprise</option>
                </select>
              </div>

              {/* 🚀 Boutons d'action */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 👥 Composants d'Administration (VendorValidationService Backend)

### 3. **VendorManagementDashboard** (Équivalent VendorValidationService.getAllVendorsWithStats)

```tsx
// src/components/admin/VendorManagementDashboard.tsx
// ✅ Composant miroir du VendorValidationService backend

import React, { useState, useEffect, useCallback } from 'react';
import { useVendorManagement } from '../../hooks/useVendorManagement';
import { VendorFilters } from '../../types/api.types';
import { VendorWithStats } from '../../types/vendor.types';
import { VendorUtils } from '../../utils/vendorUtils';
import { DateUtils } from '../../utils/dateUtils';

export const VendorManagementDashboard: React.FC = () => {
  const {
    vendors,
    stats,
    pagination,
    loading,
    error,
    fetchVendors,
    updateVendorStatus,
    unlockVendorAccount,
    exportVendorsData
  } = useVendorManagement();

  const [filters, setFilters] = useState<VendorFilters>({
    search: '',
    status: 'all',
    country: '',
    vendeur_type: undefined,
    limit: 20,
    offset: 0,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [selectedVendors, setSelectedVendors] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  // ✅ Chargement initial des vendeurs (miroir du backend)
  useEffect(() => {
    fetchVendors(filters);
  }, [fetchVendors, filters]);

  // 🔍 Mise à jour des filtres
  const updateFilters = useCallback((newFilters: Partial<VendorFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  // 🔄 Changement de statut vendeur (miroir VendorPublishService.updateVendorAccountStatus)
  const handleStatusChange = async (vendorId: number, newStatus: boolean, reason?: string) => {
    setActionLoading(prev => ({ ...prev, [vendorId]: true }));

    try {
      const result = await updateVendorStatus(vendorId, newStatus, reason);

      if (result.success) {
        // ✅ Mise à jour optimiste déjà gérée par le hook
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  // 🔓 Déverrouillage compte (miroir VendorValidationService.unlockVendorAccount)
  const handleUnlockAccount = async (vendorId: number) => {
    setActionLoading(prev => ({ ...prev, [vendorId]: true }));

    try {
      const result = await unlockVendorAccount(vendorId);

      if (result.success) {
        alert(result.message);
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  // 📊 Export CSV (miroir VendorManagementController.exportVendorsData)
  const handleExport = async () => {
    try {
      await exportVendorsData(filters);
    } catch (err) {
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* 📊 Statistiques globales (calculées côté backend) */}
      {stats && (
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Gestion des Vendeurs
          </h1>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Vendeurs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Actifs
                      </dt>
                      <dd className="text-lg font-medium text-green-600">
                        {stats.active}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Besoin d'attention
                      </dt>
                      <dd className="text-lg font-medium text-yellow-600">
                        {stats.needsAttention}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🛍️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avec Produits
                      </dt>
                      <dd className="text-lg font-medium text-blue-600">
                        {stats.withProducts}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Filtres et recherche */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* 🔍 Recherche */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom, email, boutique..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* ⚡ Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value as any })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Désactivés</option>
                <option value="locked">Verrouillés</option>
              </select>
            </div>

            {/* 🌍 Pays */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pays
              </label>
              <input
                type="text"
                placeholder="France..."
                value={filters.country}
                onChange={(e) => updateFilters({ country: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* 🏢 Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={filters.vendeur_type || ''}
                onChange={(e) => updateFilters({ vendeur_type: e.target.value as any || undefined })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Tous</option>
                <option value="INDIVIDUEL">Individuel</option>
                <option value="ENTREPRISE">Entreprise</option>
              </select>
            </div>
          </div>

          {/* 🛠️ Actions en masse */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                📊 Exporter CSV
              </button>

              {selectedVendors.length > 0 && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  📧 Notifier ({selectedVendors.length})
                </button>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {pagination && `${pagination.total} vendeurs au total`}
            </div>
          </div>
        </div>
      </div>

      {/* 📋 Tableau des vendeurs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des vendeurs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600">❌ {error}</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Aucun vendeur trouvé</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {vendors.map((vendor) => (
              <VendorListItem
                key={vendor.id}
                vendor={vendor}
                isSelected={selectedVendors.includes(vendor.id)}
                isActionLoading={actionLoading[vendor.id] || false}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedVendors(prev => [...prev, vendor.id]);
                  } else {
                    setSelectedVendors(prev => prev.filter(id => id !== vendor.id));
                  }
                }}
                onStatusChange={(status, reason) => handleStatusChange(vendor.id, status, reason)}
                onUnlock={() => handleUnlockAccount(vendor.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* 📄 Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              disabled={pagination.offset === 0}
              onClick={() => updateFilters({ offset: Math.max(0, pagination.offset - pagination.limit) })}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              disabled={!pagination.hasMore}
              onClick={() => updateFilters({ offset: pagination.offset + pagination.limit })}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">{pagination.offset + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(pagination.offset + pagination.limit, pagination.total)}
                </span>{' '}
                sur <span className="font-medium">{pagination.total}</span> résultats
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Composant item de vendeur (optimisé pour performance)
interface VendorListItemProps {
  vendor: VendorWithStats;
  isSelected: boolean;
  isActionLoading: boolean;
  onSelect: (selected: boolean) => void;
  onStatusChange: (status: boolean, reason?: string) => void;
  onUnlock: () => void;
}

const VendorListItem: React.FC<VendorListItemProps> = ({
  vendor,
  isSelected,
  isActionLoading,
  onSelect,
  onStatusChange,
  onUnlock
}) => {
  const [showActions, setShowActions] = useState(false);

  const statusColors = VendorUtils.getStatusColor(vendor);
  const statusText = VendorUtils.getStatusText(vendor);
  const activityScore = VendorUtils.calculateActivityScore(vendor);
  const needsAttention = VendorUtils.needsAttention(vendor);

  return (
    <li className={`${statusColors.bg} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
      <div className="px-4 py-4 flex items-center justify-between space-x-4">
        {/* ☑️ Checkbox de sélection */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        </div>

        {/* 👤 Informations vendeur */}
        <div className="flex-1 min-w-0 flex items-center space-x-4">
          <img
            className="h-10 w-10 rounded-full"
            src={vendor.profile_photo_url || '/default-avatar.png'}
            alt=""
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {VendorUtils.getFullName(vendor)}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors.badge}`}>
                {statusText}
              </span>
              {needsAttention && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⚠️ Attention
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{vendor.email}</span>
              {vendor.country && <span>📍 {vendor.country}</span>}
              <span>📅 {DateUtils.formatMemberSince(vendor.created_at, 'short')}</span>
              {vendor.last_login_at && (
                <span>🕐 {DateUtils.formatLastSeen(vendor.last_login_at)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 📊 Statistiques */}
        <div className="hidden md:flex md:items-center md:space-x-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{vendor.statistics.totalProducts}</div>
            <div className="text-gray-500">Produits</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{vendor.statistics.totalDesigns}</div>
            <div className="text-gray-500">Designs</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{activityScore}/100</div>
            <div className="text-gray-500">Score</div>
          </div>
        </div>

        {/* 🛠️ Actions */}
        <div className="flex items-center space-x-2">
          {VendorUtils.isAccountLocked(vendor) && (
            <button
              onClick={onUnlock}
              disabled={isActionLoading}
              className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              title="Déverrouiller le compte"
            >
              🔓
            </button>
          )}

          <button
            onClick={() => onStatusChange(!vendor.status)}
            disabled={isActionLoading}
            className={`inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              vendor.status
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
            title={vendor.status ? 'Désactiver' : 'Activer'}
          >
            {vendor.status ? '❌' : '✅'}
          </button>

          <button
            onClick={() => setShowActions(!showActions)}
            className="inline-flex items-center p-1 border border-gray-300 rounded-full shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ⋮
          </button>
        </div>
      </div>

      {/* 📋 Actions détaillées (dépliable) */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="flex space-x-4 text-sm">
            <button className="text-indigo-600 hover:text-indigo-900">
              👤 Voir le profil
            </button>
            <button className="text-indigo-600 hover:text-indigo-900">
              📊 Voir les stats
            </button>
            <button className="text-indigo-600 hover:text-indigo-900">
              📧 Envoyer un message
            </button>
            <button className="text-red-600 hover:text-red-900">
              🗑️ Supprimer
            </button>
          </div>
        </div>
      )}
    </li>
  );
};
```

## 📦 Créer le commit final

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyser le guide backend pro.md pour comprendre l'architecture", "status": "completed", "activeForm": "Analysant le guide backend pro.md pour comprendre l'architecture"}, {"content": "Adapter l'architecture backend pour le frontend", "status": "completed", "activeForm": "Adaptant l'architecture backend pour le frontend"}, {"content": "Cr\u00e9er les composants frontend correspondant aux services backend", "status": "completed", "activeForm": "Cr\u00e9ant les composants frontend correspondant aux services backend"}, {"content": "Impl\u00e9menter la gestion d'\u00e9tat pour les vendeurs", "status": "completed", "activeForm": "Impl\u00e9mentant la gestion d'\u00e9tat pour les vendeurs"}, {"content": "Cr\u00e9er les hooks et utilitaires frontend", "status": "completed", "activeForm": "Cr\u00e9ant les hooks et utilitaires frontend"}, {"content": "Finaliser et commiter les guides adapt\u00e9s", "status": "in_progress", "activeForm": "Finalisant et commitant les guides adapt\u00e9s"}]