import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed pour créer toutes les permissions nécessaires dans le système
 */
async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  const permissions = [
    // ============= USERS MODULE =============
    {
      key: 'users.view',
      name: 'Voir les utilisateurs',
      description: 'Permet de consulter la liste des utilisateurs et leurs détails',
      module: 'users',
    },
    {
      key: 'users.create',
      name: 'Créer des utilisateurs',
      description: 'Permet de créer de nouveaux utilisateurs',
      module: 'users',
    },
    {
      key: 'users.update',
      name: 'Modifier des utilisateurs',
      description: 'Permet de modifier les informations des utilisateurs',
      module: 'users',
    },
    {
      key: 'users.delete',
      name: 'Supprimer des utilisateurs',
      description: 'Permet de supprimer des utilisateurs (soft delete)',
      module: 'users',
    },
    {
      key: 'users.reset_password',
      name: 'Réinitialiser les mots de passe',
      description: 'Permet de réinitialiser le mot de passe d\'un utilisateur',
      module: 'users',
    },
    {
      key: 'users.update_status',
      name: 'Changer le statut des utilisateurs',
      description: 'Permet de changer le statut (actif, inactif, suspendu) d\'un utilisateur',
      module: 'users',
    },
    {
      key: 'users.manage_permissions',
      name: 'Gérer les permissions des utilisateurs',
      description: 'Permet d\'attribuer ou modifier des permissions personnalisées aux utilisateurs',
      module: 'users',
    },

    // ============= ROLES MODULE =============
    {
      key: 'roles.view',
      name: 'Voir les rôles',
      description: 'Permet de consulter la liste des rôles et leurs permissions',
      module: 'roles',
    },
    {
      key: 'roles.create',
      name: 'Créer des rôles',
      description: 'Permet de créer de nouveaux rôles avec des permissions',
      module: 'roles',
    },
    {
      key: 'roles.update',
      name: 'Modifier des rôles',
      description: 'Permet de modifier les rôles existants',
      module: 'roles',
    },
    {
      key: 'roles.delete',
      name: 'Supprimer des rôles',
      description: 'Permet de supprimer des rôles (sauf rôles système)',
      module: 'roles',
    },
    {
      key: 'permissions.view',
      name: 'Voir les permissions',
      description: 'Permet de consulter toutes les permissions disponibles',
      module: 'roles',
    },

    // ============= PRODUCTS MODULE =============
    {
      key: 'products.view',
      name: 'Voir les produits',
      description: 'Permet de consulter la liste des produits et leurs détails',
      module: 'products',
    },
    {
      key: 'products.create',
      name: 'Créer des produits',
      description: 'Permet de créer de nouveaux produits',
      module: 'products',
    },
    {
      key: 'products.update',
      name: 'Modifier des produits',
      description: 'Permet de modifier les produits existants',
      module: 'products',
    },
    {
      key: 'products.delete',
      name: 'Supprimer des produits',
      description: 'Permet de supprimer des produits',
      module: 'products',
    },
    {
      key: 'products.validate',
      name: 'Valider des produits',
      description: 'Permet de valider ou rejeter des produits en attente',
      module: 'products',
    },
    {
      key: 'products.manage_stock',
      name: 'Gérer les stocks',
      description: 'Permet de gérer les stocks des produits (ajout, retrait, historique)',
      module: 'products',
    },

    // ============= CATEGORIES MODULE =============
    {
      key: 'categories.view',
      name: 'Voir les catégories',
      description: 'Permet de consulter les catégories de produits',
      module: 'categories',
    },
    {
      key: 'categories.create',
      name: 'Créer des catégories',
      description: 'Permet de créer de nouvelles catégories',
      module: 'categories',
    },
    {
      key: 'categories.update',
      name: 'Modifier des catégories',
      description: 'Permet de modifier les catégories existantes',
      module: 'categories',
    },
    {
      key: 'categories.delete',
      name: 'Supprimer des catégories',
      description: 'Permet de supprimer des catégories',
      module: 'categories',
    },

    // ============= DESIGNS MODULE =============
    {
      key: 'designs.view',
      name: 'Voir les designs',
      description: 'Permet de consulter les designs uploadés par les vendeurs',
      module: 'designs',
    },
    {
      key: 'designs.create',
      name: 'Créer des designs',
      description: 'Permet de créer/uploader de nouveaux designs',
      module: 'designs',
    },
    {
      key: 'designs.update',
      name: 'Modifier des designs',
      description: 'Permet de modifier les designs existants',
      module: 'designs',
    },
    {
      key: 'designs.delete',
      name: 'Supprimer des designs',
      description: 'Permet de supprimer des designs',
      module: 'designs',
    },
    {
      key: 'designs.validate',
      name: 'Valider des designs',
      description: 'Permet de valider ou rejeter des designs en attente',
      module: 'designs',
    },
    {
      key: 'designs.auto_validate',
      name: 'Validation automatique des designs',
      description: 'Permet d\'activer/désactiver la validation automatique des designs',
      module: 'designs',
    },

    // ============= ORDERS MODULE =============
    {
      key: 'orders.view',
      name: 'Voir les commandes',
      description: 'Permet de consulter toutes les commandes',
      module: 'orders',
    },
    {
      key: 'orders.update',
      name: 'Modifier des commandes',
      description: 'Permet de modifier le statut ou les détails des commandes',
      module: 'orders',
    },
    {
      key: 'orders.validate',
      name: 'Valider des commandes',
      description: 'Permet de valider des commandes',
      module: 'orders',
    },
    {
      key: 'orders.cancel',
      name: 'Annuler des commandes',
      description: 'Permet d\'annuler des commandes',
      module: 'orders',
    },

    // ============= VENDORS MODULE =============
    {
      key: 'vendors.view',
      name: 'Voir les vendeurs',
      description: 'Permet de consulter la liste des vendeurs',
      module: 'vendors',
    },
    {
      key: 'vendors.products.view',
      name: 'Voir les produits des vendeurs',
      description: 'Permet de voir les produits mis en vente par les vendeurs',
      module: 'vendors',
    },
    {
      key: 'vendors.products.validate',
      name: 'Valider les produits des vendeurs',
      description: 'Permet de valider ou rejeter les produits des vendeurs',
      module: 'vendors',
    },
    {
      key: 'vendors.commissions.view',
      name: 'Voir les commissions',
      description: 'Permet de consulter les commissions des vendeurs',
      module: 'vendors',
    },
    {
      key: 'vendors.commissions.update',
      name: 'Modifier les commissions',
      description: 'Permet de modifier le taux de commission d\'un vendeur',
      module: 'vendors',
    },
    {
      key: 'vendors.funds.view',
      name: 'Voir les appels de fonds',
      description: 'Permet de consulter les demandes d\'appel de fonds des vendeurs',
      module: 'vendors',
    },
    {
      key: 'vendors.funds.process',
      name: 'Traiter les appels de fonds',
      description: 'Permet d\'approuver, rejeter ou marquer comme payé les appels de fonds',
      module: 'vendors',
    },

    // ============= THEMES MODULE =============
    {
      key: 'themes.view',
      name: 'Voir les thèmes',
      description: 'Permet de consulter les thèmes de produits',
      module: 'themes',
    },
    {
      key: 'themes.create',
      name: 'Créer des thèmes',
      description: 'Permet de créer de nouveaux thèmes',
      module: 'themes',
    },
    {
      key: 'themes.update',
      name: 'Modifier des thèmes',
      description: 'Permet de modifier les thèmes existants',
      module: 'themes',
    },
    {
      key: 'themes.delete',
      name: 'Supprimer des thèmes',
      description: 'Permet de supprimer des thèmes',
      module: 'themes',
    },

    // ============= NOTIFICATIONS MODULE =============
    {
      key: 'notifications.view',
      name: 'Voir les notifications',
      description: 'Permet de consulter les notifications',
      module: 'notifications',
    },
    {
      key: 'notifications.send',
      name: 'Envoyer des notifications',
      description: 'Permet d\'envoyer des notifications aux utilisateurs',
      module: 'notifications',
    },

    // ============= VENDOR TYPES MODULE =============
    {
      key: 'vendor_types.view',
      name: 'Voir les types de vendeurs',
      description: 'Permet de consulter les types de vendeurs',
      module: 'vendor_types',
    },
    {
      key: 'vendor_types.create',
      name: 'Créer des types de vendeurs',
      description: 'Permet de créer de nouveaux types de vendeurs',
      module: 'vendor_types',
    },
    {
      key: 'vendor_types.update',
      name: 'Modifier des types de vendeurs',
      description: 'Permet de modifier les types de vendeurs existants',
      module: 'vendor_types',
    },
    {
      key: 'vendor_types.delete',
      name: 'Supprimer des types de vendeurs',
      description: 'Permet de supprimer des types de vendeurs',
      module: 'vendor_types',
    },

    // ============= DESIGN CATEGORIES MODULE =============
    {
      key: 'design_categories.view',
      name: 'Voir les catégories de designs',
      description: 'Permet de consulter les catégories de designs',
      module: 'design_categories',
    },
    {
      key: 'design_categories.create',
      name: 'Créer des catégories de designs',
      description: 'Permet de créer de nouvelles catégories de designs',
      module: 'design_categories',
    },
    {
      key: 'design_categories.update',
      name: 'Modifier des catégories de designs',
      description: 'Permet de modifier les catégories de designs existantes',
      module: 'design_categories',
    },
    {
      key: 'design_categories.delete',
      name: 'Supprimer des catégories de designs',
      description: 'Permet de supprimer des catégories de designs',
      module: 'design_categories',
    },

    // ============= COLORS & SIZES MODULE =============
    {
      key: 'colors.manage',
      name: 'Gérer les couleurs',
      description: 'Permet de créer, modifier et supprimer des couleurs de produits',
      module: 'products',
    },
    {
      key: 'sizes.manage',
      name: 'Gérer les tailles',
      description: 'Permet de créer, modifier et supprimer des tailles de produits',
      module: 'products',
    },
  ];

  // Créer toutes les permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description,
        module: permission.module,
      },
      create: permission,
    });
    console.log(`✅ Permission créée/mise à jour: ${permission.key}`);
  }

  console.log(`\n🎉 ${permissions.length} permissions créées/mises à jour avec succès!\n`);

  // Créer les rôles de base avec leurs permissions
  await createDefaultRoles();
}

/**
 * Créer les rôles de base du système
 */
async function createDefaultRoles() {
  console.log('🌱 Creating default roles...\n');

  // 1. Rôle SUPERADMIN - Toutes les permissions
  const allPermissions = await prisma.permission.findMany();

  const superadminRole = await prisma.customRole.upsert({
    where: { slug: 'superadmin' },
    update: {
      name: 'Super Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système',
      isSystem: true,
    },
    create: {
      name: 'Super Administrateur',
      slug: 'superadmin',
      description: 'Accès complet à toutes les fonctionnalités du système',
      isSystem: true,
    },
  });

  // Assigner toutes les permissions au superadmin
  await prisma.rolePermission.deleteMany({
    where: { roleId: superadminRole.id },
  });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: superadminRole.id,
      permissionId: p.id,
    })),
  });
  console.log(`✅ Rôle créé: ${superadminRole.name} (${allPermissions.length} permissions)`);

  // 2. Rôle ADMIN - Permissions d'administration courantes
  const adminPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          'users.view',
          'users.create',
          'users.update',
          'products.view',
          'products.create',
          'products.update',
          'products.validate',
          'categories.view',
          'categories.create',
          'categories.update',
          'designs.view',
          'designs.validate',
          'orders.view',
          'orders.update',
          'orders.validate',
          'vendors.view',
          'vendors.products.view',
          'vendors.products.validate',
          'vendors.funds.view',
          'themes.view',
        ],
      },
    },
  });

  const adminRole = await prisma.customRole.upsert({
    where: { slug: 'admin' },
    update: {
      name: 'Administrateur',
      description: 'Accès administratif standard sans gestion des permissions',
      isSystem: true,
    },
    create: {
      name: 'Administrateur',
      slug: 'admin',
      description: 'Accès administratif standard sans gestion des permissions',
      isSystem: true,
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });
  await prisma.rolePermission.createMany({
    data: adminPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  console.log(`✅ Rôle créé: ${adminRole.name} (${adminPermissions.length} permissions)`);

  // 3. Rôle VENDOR - Permissions pour les vendeurs
  const vendorPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          'designs.view',
          'designs.create',
          'designs.update',
          'vendors.products.view',
          'vendors.commissions.view',
          'vendors.funds.view',
          'orders.view',
        ],
      },
    },
  });

  const vendorRole = await prisma.customRole.upsert({
    where: { slug: 'vendor' },
    update: {
      name: 'Vendeur',
      description: 'Accès vendeur pour gérer ses produits et designs',
      isSystem: true,
    },
    create: {
      name: 'Vendeur',
      slug: 'vendor',
      description: 'Accès vendeur pour gérer ses produits et designs',
      isSystem: true,
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: vendorRole.id },
  });
  await prisma.rolePermission.createMany({
    data: vendorPermissions.map((p) => ({
      roleId: vendorRole.id,
      permissionId: p.id,
    })),
  });
  console.log(`✅ Rôle créé: ${vendorRole.name} (${vendorPermissions.length} permissions)`);

  // 4. Rôle MANAGER - Gestionnaire de contenu
  const managerPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          'products.view',
          'products.create',
          'products.update',
          'products.validate',
          'categories.view',
          'categories.create',
          'categories.update',
          'designs.view',
          'designs.validate',
          'orders.view',
          'themes.view',
          'themes.create',
          'themes.update',
        ],
      },
    },
  });

  const managerRole = await prisma.customRole.upsert({
    where: { slug: 'manager' },
    update: {
      name: 'Gestionnaire',
      description: 'Gestionnaire de contenu et de validation',
      isSystem: true,
    },
    create: {
      name: 'Gestionnaire',
      slug: 'manager',
      description: 'Gestionnaire de contenu et de validation',
      isSystem: true,
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: managerRole.id },
  });
  await prisma.rolePermission.createMany({
    data: managerPermissions.map((p) => ({
      roleId: managerRole.id,
      permissionId: p.id,
    })),
  });
  console.log(`✅ Rôle créé: ${managerRole.name} (${managerPermissions.length} permissions)`);

  console.log('\n🎉 Rôles de base créés avec succès!\n');
}

// Exécuter le seed
seedPermissions()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding des permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
