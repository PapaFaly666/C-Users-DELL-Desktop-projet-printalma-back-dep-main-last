# 🔧 Utilitaires Backend : Gestion Vendeurs

## 🎯 Fonctions Utilitaires Prêtes à l'Emploi

Ce fichier contient des fonctions utilitaires, helpers, et snippets de code réutilisables pour la gestion des vendeurs côté backend.

## 📅 Utilitaires de Dates

### ⏰ **DateHelper Class**

```typescript
// src/core/utils/date.helper.ts
export class DateHelper {
  /**
   * 📊 Calculer le nombre de jours depuis une date
   */
  static daysSince(date: Date | string): number {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return Math.floor((Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 🔄 Vérifier si une mise à jour est nécessaire (éviter les spam)
   */
  static shouldUpdateLastLogin(lastLogin: Date | null, intervalMinutes: number = 5): boolean {
    if (!lastLogin) return true;
    const intervalMs = intervalMinutes * 60 * 1000;
    return (Date.now() - lastLogin.getTime()) > intervalMs;
  }

  /**
   * 📈 Générer des périodes pour statistiques
   */
  static getDateRange(period: 'day' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start, end: now };
  }

  /**
   * 🎯 Formater pour réponses API
   */
  static formatForApi(date: Date | null): string | null {
    return date ? date.toISOString() : null;
  }

  /**
   * 🔒 Calculer la fin de verrouillage
   */
  static calculateLockUntil(attempts: number): Date | null {
    if (attempts < 3) return null;

    const lockDuration = Math.min(Math.pow(2, attempts - 3) * 5, 60); // Max 60 min
    return new Date(Date.now() + lockDuration * 60 * 1000);
  }
}
```

## 🔍 Utilitaires de Requêtes Prisma

### 🎯 **VendorQueryBuilder Class**

```typescript
// src/core/utils/vendor-query.builder.ts
import { VendorFiltersDto } from '../dto/vendor-filters.dto';

export class VendorQueryBuilder {
  /**
   * 🔍 Construire les conditions WHERE pour filtres vendeur
   */
  static buildWhereClause(filters: VendorFiltersDto) {
    const where: any = { role: 'VENDEUR' };

    // Filtre par statut
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          where.status = true;
          where.locked_until = { lte: new Date() }; // Pas verrouillé
          break;
        case 'inactive':
          where.status = false;
          break;
        case 'locked':
          where.locked_until = { gt: new Date() };
          break;
      }
    }

    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { shop_name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filtre par pays
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    // Filtre par type de vendeur
    if (filters.vendeur_type) {
      where.vendeur_type = filters.vendeur_type;
    }

    return where;
  }

  /**
   * 📊 Construire les options ORDER BY
   */
  static buildOrderBy(sortBy: string = 'created_at', sortOrder: 'asc' | 'desc' = 'desc') {
    const orderOptions = {
      created_at: { created_at: sortOrder },
      last_login_at: { last_login_at: sortOrder },
      status: [{ status: 'desc' }, { created_at: 'desc' }],
      name: [{ firstName: sortOrder }, { lastName: sortOrder }],
      shop_name: { shop_name: sortOrder }
    };

    return orderOptions[sortBy] || orderOptions.created_at;
  }

  /**
   * 🔧 Champs de sélection standardisés
   */
  static getVendorSelectFields(includePrivate: boolean = false) {
    const baseFields = {
      id: true,
      firstName: true,
      lastName: true,
      email: includePrivate, // Email seulement pour admin
      phone: includePrivate,
      country: true,
      address: includePrivate,
      shop_name: true,
      profile_photo_url: true,
      vendeur_type: true,
      created_at: true,
      last_login_at: true,
      updated_at: true,
      status: true
    };

    if (includePrivate) {
      return {
        ...baseFields,
        login_attempts: true,
        locked_until: true
      };
    }

    return baseFields;
  }

  /**
   * 📈 Inclusions pour statistiques complètes
   */
  static getStatsInclusion() {
    return {
      _count: {
        select: {
          vendorProducts: { where: { isDelete: false } },
          designs: { where: { isDelete: false } },
          orders: true
        }
      }
    };
  }
}
```

## 📊 Utilitaires de Statistiques

### 📈 **StatsCalculator Class**

```typescript
// src/core/utils/stats.calculator.ts
export class StatsCalculator {
  /**
   * 🎯 Calculer les statistiques enrichies d'un vendeur
   */
  static calculateVendorStats(vendor: any, additionalData?: any) {
    const memberSinceDays = DateHelper.daysSince(vendor.created_at);
    const lastSeenDays = vendor.last_login_at ? DateHelper.daysSince(vendor.last_login_at) : null;
    const isLocked = vendor.locked_until && new Date(vendor.locked_until) > new Date();

    return {
      // 📅 Temporel
      memberSinceDays,
      lastSeenDays,
      memberSinceMonths: Math.floor(memberSinceDays / 30),

      // ⚡ Statut
      isActive: vendor.status,
      isLocked,
      needsAttention: this.needsAttention(vendor),

      // 📊 Activité
      totalProducts: vendor._count?.vendorProducts || 0,
      totalDesigns: vendor._count?.designs || 0,
      totalOrders: vendor._count?.orders || 0,

      // 💰 Financier (si fourni)
      totalEarnings: additionalData?.earnings?.totalEarnings || 0,
      availableBalance: additionalData?.earnings?.availableBalance || 0,

      // 🎯 Indicateurs de performance
      productionRate: this.calculateProductionRate(vendor),
      activityScore: this.calculateActivityScore(vendor)
    };
  }

  /**
   * ⚠️ Détecter si un vendeur nécessite de l'attention
   */
  private static needsAttention(vendor: any): boolean {
    // Tentatives de connexion élevées
    if (vendor.login_attempts >= 3) return true;

    // Pas connecté depuis 30 jours
    if (vendor.last_login_at) {
      const daysSinceLogin = DateHelper.daysSince(vendor.last_login_at);
      if (daysSinceLogin > 30) return true;
    }

    // Compte récent sans activité (plus de 7 jours)
    const memberSinceDays = DateHelper.daysSince(vendor.created_at);
    if (memberSinceDays > 7 && (!vendor._count?.vendorProducts || vendor._count.vendorProducts === 0)) {
      return true;
    }

    return false;
  }

  /**
   * 📈 Taux de production (produits/mois)
   */
  private static calculateProductionRate(vendor: any): number {
    const memberSinceMonths = Math.max(1, Math.floor(DateHelper.daysSince(vendor.created_at) / 30));
    const totalProducts = vendor._count?.vendorProducts || 0;
    return Math.round((totalProducts / memberSinceMonths) * 100) / 100; // 2 décimales
  }

  /**
   * 🎯 Score d'activité (0-100)
   */
  private static calculateActivityScore(vendor: any): number {
    let score = 0;

    // Connexion récente (30 points max)
    if (vendor.last_login_at) {
      const daysSinceLogin = DateHelper.daysSince(vendor.last_login_at);
      score += Math.max(0, 30 - daysSinceLogin);
    }

    // Produits (30 points max)
    const productCount = vendor._count?.vendorProducts || 0;
    score += Math.min(30, productCount * 3);

    // Designs (20 points max)
    const designCount = vendor._count?.designs || 0;
    score += Math.min(20, designCount * 2);

    // Ancienneté (20 points max)
    const memberSinceDays = DateHelper.daysSince(vendor.created_at);
    score += Math.min(20, Math.floor(memberSinceDays / 7) * 2);

    return Math.min(100, Math.round(score));
  }

  /**
   * 📊 Statistiques globales des vendeurs
   */
  static calculateGlobalStats(vendors: any[]) {
    const total = vendors.length;
    const active = vendors.filter(v => v.status).length;
    const inactive = total - active;
    const locked = vendors.filter(v =>
      v.locked_until && new Date(v.locked_until) > new Date()
    ).length;
    const needsAttention = vendors.filter(v =>
      this.needsAttention(v)
    ).length;

    const withProducts = vendors.filter(v =>
      v._count?.vendorProducts > 0
    ).length;

    const avgProductsPerVendor = vendors.reduce((sum, v) =>
      sum + (v._count?.vendorProducts || 0), 0
    ) / total;

    return {
      total,
      active,
      inactive,
      locked,
      needsAttention,
      withProducts,
      withoutProducts: total - withProducts,
      avgProductsPerVendor: Math.round(avgProductsPerVendor * 100) / 100,
      activePercentage: Math.round((active / total) * 100)
    };
  }
}
```

## 🔐 Utilitaires de Sécurité

### 🛡️ **SecurityHelper Class**

```typescript
// src/core/utils/security.helper.ts
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

export class SecurityHelper {
  /**
   * 🔒 Vérifier si un compte est verrouillé
   */
  static isAccountLocked(user: { locked_until?: Date | null }): boolean {
    return user.locked_until ? new Date(user.locked_until) > new Date() : false;
  }

  /**
   * 🎲 Générer un code d'activation à 6 chiffres
   */
  static generateActivationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 🔐 Hasher un mot de passe
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12); // Niveau de sécurité élevé
  }

  /**
   * ✅ Vérifier un mot de passe
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 🎯 Générer un token de reset sécurisé
   */
  static generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 🔍 Hasher un email pour anonymisation logs
   */
  static hashEmail(email: string): string {
    return createHash('sha256').update(email).digest('hex').substring(0, 8);
  }

  /**
   * ⚠️ Valider la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 25;
    else issues.push('Au moins 8 caractères requis');

    if (/[a-z]/.test(password)) score += 15;
    else issues.push('Au moins une minuscule requise');

    if (/[A-Z]/.test(password)) score += 15;
    else issues.push('Au moins une majuscule requise');

    if (/\d/.test(password)) score += 15;
    else issues.push('Au moins un chiffre requis');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    else issues.push('Au moins un caractère spécial requis');

    if (password.length >= 12) score += 10;

    return {
      isValid: score >= 70 && issues.length === 0,
      score,
      issues
    };
  }

  /**
   * 🚫 Détecter les tentatives de brute force
   */
  static shouldLockAccount(attempts: number): { shouldLock: boolean; lockDuration: number } {
    const lockRules = [
      { threshold: 3, duration: 5 },    // 5 minutes après 3 tentatives
      { threshold: 5, duration: 15 },   // 15 minutes après 5 tentatives
      { threshold: 10, duration: 60 },  // 1 heure après 10 tentatives
      { threshold: 15, duration: 1440 } // 24 heures après 15 tentatives
    ];

    for (const rule of lockRules.reverse()) {
      if (attempts >= rule.threshold) {
        return {
          shouldLock: true,
          lockDuration: rule.duration
        };
      }
    }

    return { shouldLock: false, lockDuration: 0 };
  }
}
```

## 📧 Utilitaires de Notifications

### 📨 **NotificationHelper Class**

```typescript
// src/core/utils/notification.helper.ts
export class NotificationHelper {
  /**
   * 📧 Templates d'emails pour vendeurs
   */
  static getEmailTemplate(type: string, data: any): { subject: string; body: string } {
    const templates = {
      account_deactivated: {
        subject: '⚠️ Votre compte PrintAlma a été suspendu',
        body: `
          Bonjour ${data.firstName} ${data.lastName},

          Votre compte vendeur a été temporairement suspendu pour la raison suivante :
          ${data.reason}

          Pour réactiver votre compte, veuillez contacter notre support.

          Cordialement,
          L'équipe PrintAlma
        `
      },

      account_reactivated: {
        subject: '✅ Votre compte PrintAlma a été réactivé',
        body: `
          Bonjour ${data.firstName} ${data.lastName},

          Bonne nouvelle ! Votre compte vendeur a été réactivé.
          Vous pouvez maintenant accéder à votre tableau de bord.

          Cordialement,
          L'équipe PrintAlma
        `
      },

      account_locked: {
        subject: '🔒 Compte verrouillé temporairement',
        body: `
          Bonjour ${data.firstName} ${data.lastName},

          Votre compte a été verrouillé temporairement suite à plusieurs tentatives
          de connexion échouées.

          Votre compte sera automatiquement déverrouillé le ${data.unlockDate}.

          Cordialement,
          L'équipe PrintAlma
        `
      },

      product_validated: {
        subject: '🎉 Votre produit a été validé',
        body: `
          Bonjour ${data.firstName} ${data.lastName},

          Votre produit "${data.productName}" a été validé et publié !
          Il est maintenant visible sur la plateforme.

          Cordialement,
          L'équipe PrintAlma
        `
      }
    };

    return templates[type] || { subject: 'Notification PrintAlma', body: 'Notification' };
  }

  /**
   * 📱 Notification in-app pour vendeurs
   */
  static createInAppNotification(
    vendorId: number,
    type: string,
    message: string,
    actionUrl?: string
  ) {
    return {
      userId: vendorId,
      type,
      title: this.getNotificationTitle(type),
      message,
      actionUrl,
      isRead: false,
      createdAt: new Date()
    };
  }

  /**
   * 🎯 Titres standardisés pour notifications
   */
  private static getNotificationTitle(type: string): string {
    const titles = {
      account_status: '⚡ Statut du compte',
      product_update: '📦 Mise à jour produit',
      order_notification: '🛒 Nouvelle commande',
      earnings_update: '💰 Mise à jour gains',
      system_alert: '🔔 Alerte système'
    };

    return titles[type] || '📢 Notification';
  }

  /**
   * 📊 Préparer données pour notification en masse
   */
  static prepareBulkNotification(
    vendorIds: number[],
    template: string,
    customData: any = {}
  ) {
    return vendorIds.map(vendorId => ({
      vendorId,
      template,
      data: {
        ...customData,
        vendorId
      },
      scheduledAt: new Date()
    }));
  }
}
```

## 🔄 Utilitaires de Conversion

### 🎯 **DataTransformer Class**

```typescript
// src/core/utils/data.transformer.ts
export class DataTransformer {
  /**
   * 👤 Transformer un vendeur pour réponse API publique
   */
  static toPublicVendorProfile(vendor: any) {
    return {
      id: vendor.id,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      shop_name: vendor.shop_name,
      profile_photo_url: vendor.profile_photo_url,
      country: vendor.country,
      vendeur_type: vendor.vendeur_type,

      // 📅 Dates formatées
      created_at: DateHelper.formatForApi(vendor.created_at),
      last_login_at: DateHelper.formatForApi(vendor.last_login_at),

      // 📊 Statistiques calculées
      memberSinceDays: DateHelper.daysSince(vendor.created_at),
      isActive: vendor.status,

      // 🚫 Champs privés exclus: email, phone, address, login_attempts, etc.
    };
  }

  /**
   * 🔐 Transformer un vendeur pour réponse admin complète
   */
  static toAdminVendorProfile(vendor: any, stats?: any) {
    return {
      ...vendor,

      // 📅 Dates formatées
      created_at: DateHelper.formatForApi(vendor.created_at),
      last_login_at: DateHelper.formatForApi(vendor.last_login_at),
      updated_at: DateHelper.formatForApi(vendor.updated_at),
      locked_until: DateHelper.formatForApi(vendor.locked_until),

      // 📊 Statistiques enrichies
      statistics: stats ? StatsCalculator.calculateVendorStats(vendor, stats) : null,

      // ⚡ Indicateurs de statut
      isLocked: SecurityHelper.isAccountLocked(vendor),
      needsAttention: StatsCalculator.needsAttention(vendor)
    };
  }

  /**
   * 📊 Transformer pour export CSV
   */
  static toCsvRow(vendor: any): string[] {
    return [
      vendor.id.toString(),
      vendor.firstName,
      vendor.lastName,
      vendor.email,
      vendor.phone || '',
      vendor.country || '',
      vendor.shop_name || '',
      vendor.vendeur_type || '',
      vendor.status ? 'Actif' : 'Inactif',
      vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('fr-FR') : '',
      vendor.last_login_at ? new Date(vendor.last_login_at).toLocaleDateString('fr-FR') : 'Jamais',
      vendor.statistics?.totalProducts?.toString() || '0',
      vendor.statistics?.totalDesigns?.toString() || '0',
      vendor.statistics?.totalEarnings?.toString() || '0'
    ];
  }

  /**
   * 📈 Transformer pour graphiques/analytics
   */
  static toAnalyticsData(vendors: any[]) {
    const periods = ['7d', '30d', '90d', '1y'];

    return periods.map(period => {
      const days = this.periodToDays(period);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const newVendors = vendors.filter(v =>
        new Date(v.created_at) >= cutoffDate
      ).length;

      const activeVendors = vendors.filter(v =>
        v.status && v.last_login_at && new Date(v.last_login_at) >= cutoffDate
      ).length;

      return {
        period,
        newVendors,
        activeVendors,
        timestamp: cutoffDate.toISOString()
      };
    });
  }

  private static periodToDays(period: string): number {
    const map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    return map[period] || 30;
  }
}
```

## 🔍 Utilitaires de Validation

### ✅ **ValidationHelper Class**

```typescript
// src/core/utils/validation.helper.ts
export class ValidationHelper {
  /**
   * 📧 Valider format email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 📱 Valider numéro de téléphone français
   */
  static isValidFrenchPhone(phone: string): boolean {
    const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * 🏪 Valider nom de boutique
   */
  static isValidShopName(shopName: string): { isValid: boolean; error?: string } {
    if (!shopName || shopName.trim().length < 3) {
      return { isValid: false, error: 'Le nom de boutique doit contenir au moins 3 caractères' };
    }

    if (shopName.length > 50) {
      return { isValid: false, error: 'Le nom de boutique ne peut pas dépasser 50 caractères' };
    }

    // Caractères autorisés : lettres, chiffres, espaces, tirets, apostrophes
    const validChars = /^[a-zA-ZÀ-ÿ0-9\s\-']+$/;
    if (!validChars.test(shopName)) {
      return { isValid: false, error: 'Le nom de boutique contient des caractères non autorisés' };
    }

    return { isValid: true };
  }

  /**
   * 🌍 Valider code pays ISO
   */
  static isValidCountryCode(country: string): boolean {
    const validCountries = [
      'FR', 'BE', 'CH', 'LU', 'MC', 'CA', 'SN', 'CI', 'MA', 'TN', 'DZ', 'MG'
      // Ajouter d'autres codes pays selon vos besoins
    ];
    return validCountries.includes(country.toUpperCase());
  }

  /**
   * 🔒 Valider données sensibles avant mise à jour
   */
  static sanitizeVendorData(data: any): any {
    const sanitized = { ...data };

    // Nettoyer les champs texte
    if (sanitized.firstName) sanitized.firstName = sanitized.firstName.trim();
    if (sanitized.lastName) sanitized.lastName = sanitized.lastName.trim();
    if (sanitized.shop_name) sanitized.shop_name = sanitized.shop_name.trim();

    // Supprimer les champs non autorisés
    delete sanitized.id;
    delete sanitized.password;
    delete sanitized.login_attempts;
    delete sanitized.locked_until;
    delete sanitized.created_at;

    return sanitized;
  }

  /**
   * 📊 Valider paramètres de pagination
   */
  static validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
    return {
      limit: Math.min(Math.max(limit || 20, 1), 100), // Entre 1 et 100
      offset: Math.max(offset || 0, 0) // Minimum 0
    };
  }
}
```

## 🎯 Middleware Personnalisés

### 📊 **VendorLoggingMiddleware**

```typescript
// src/core/middleware/vendor-logging.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class VendorLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('VendorActivity');

  use(req: Request, res: Response, next: NextFunction) {
    if (this.shouldLog(req)) {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logVendorActivity(req, res, duration);
      });
    }

    next();
  }

  private shouldLog(req: Request): boolean {
    // Logger seulement les routes importantes
    const importantRoutes = [
      '/auth/login',
      '/auth/vendor/profile',
      '/vendor-products/',
      '/designs/',
      '/orders/'
    ];

    return importantRoutes.some(route => req.path.startsWith(route));
  }

  private logVendorActivity(req: Request, res: Response, duration: number) {
    const user = req.user;
    const logData = {
      vendorId: user?.id,
      email: user?.email ? SecurityHelper.hashEmail(user.email) : undefined,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    if (res.statusCode >= 400) {
      this.logger.error(`Vendor activity error: ${JSON.stringify(logData)}`);
    } else {
      this.logger.log(`Vendor activity: ${JSON.stringify(logData)}`);
    }
  }
}
```

## 🎉 Décorateurs Utiles

### 🔐 **Custom Decorators**

```typescript
// src/core/decorators/vendor.decorators.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

/**
 * 👤 Décorateur pour récupérer le vendeur actuel
 */
export const CurrentVendor = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 🛡️ Décorateur pour exiger un statut vendeur actif
 */
export const RequireActiveVendor = () => SetMetadata('requireActiveVendor', true);

/**
 * 📊 Décorateur pour logger automatiquement les actions
 */
export const LogVendorAction = (action: string) => SetMetadata('logAction', action);

// Utilisation dans un contrôleur :
/*
@Put('profile')
@RequireActiveVendor()
@LogVendorAction('update_profile')
async updateProfile(
  @CurrentVendor() vendor: User,
  @Body() updateDto: UpdateVendorProfileDto
) {
  // Le vendeur est automatiquement injecté
  return this.authService.updateVendorProfile(vendor.id, updateDto);
}
*/
```

## 📊 Configuration et Constants

### ⚙️ **Vendor Constants**

```typescript
// src/core/constants/vendor.constants.ts
export const VENDOR_CONSTANTS = {
  // 🔐 Sécurité
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_DURATIONS: [5, 15, 60, 1440], // minutes
  PASSWORD_MIN_LENGTH: 8,
  ACTIVATION_CODE_EXPIRY: 24, // heures

  // 📱 Validation
  SHOP_NAME_MIN_LENGTH: 3,
  SHOP_NAME_MAX_LENGTH: 50,
  PHONE_REGEX: /^(?:\+33|0)[1-9](?:[0-9]{8})$/,

  // 📊 Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // 📧 Notifications
  EMAIL_TEMPLATES: {
    ACCOUNT_DEACTIVATED: 'account_deactivated',
    ACCOUNT_REACTIVATED: 'account_reactivated',
    PRODUCT_VALIDATED: 'product_validated',
    ACCOUNT_LOCKED: 'account_locked'
  },

  // 🎯 Statuts
  VENDOR_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    LOCKED: 'locked',
    ALL: 'all'
  },

  // 📈 Métriques
  ACTIVITY_THRESHOLDS: {
    INACTIVE_DAYS: 30,
    NEW_VENDOR_DAYS: 7,
    HIGH_PRODUCTION_RATE: 2 // produits/mois
  }
};

export const VENDOR_PERMISSIONS = {
  // Actions autorisées même si compte désactivé
  DISABLED_ACCOUNT_ALLOWED: [
    'view_profile',
    'view_products',
    'view_orders',
    'contact_support'
  ],

  // Actions interdites si compte verrouillé
  LOCKED_ACCOUNT_FORBIDDEN: [
    'create_product',
    'update_product',
    'upload_design',
    'withdraw_funds'
  ]
};
```

---

## ✅ Checklist d'Utilisation

- [ ] **Copier les classes utilitaires** dans `src/core/utils/`
- [ ] **Importer les helpers** dans vos services existants
- [ ] **Ajouter les décorateurs** pour simplifier les contrôleurs
- [ ] **Configurer les middlewares** de logging et mise à jour
- [ ] **Utiliser les constants** pour centraliser la configuration
- [ ] **Implémenter les validations** avec `ValidationHelper`
- [ ] **Standardiser les transformations** avec `DataTransformer`
- [ ] **Optimiser les requêtes** avec `VendorQueryBuilder`
- [ ] **Calculer les statistiques** avec `StatsCalculator`
- [ ] **Sécuriser avec** `SecurityHelper`

Ces utilitaires vous feront gagner un temps considérable et assureront la cohérence de votre code ! 🚀