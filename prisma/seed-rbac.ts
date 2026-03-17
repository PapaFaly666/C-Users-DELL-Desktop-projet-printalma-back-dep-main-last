import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed RBAC...');

  // Créer les permissions
  console.log('📝 Création des permissions...');

  const permissions = [
    // Module: users
    { key: 'users.view', name: 'Voir les utilisateurs', description: 'Consulter la liste des utilisateurs', module: 'users' },
    { key: 'users.create', name: 'Créer des utilisateurs', description: 'Ajouter de nouveaux utilisateurs', module: 'users' },
    { key: 'users.edit', name: 'Modifier les utilisateurs', description: 'Éditer les informations utilisateurs', module: 'users' },
    { key: 'users.delete', name: 'Supprimer les utilisateurs', description: 'Supprimer des utilisateurs', module: 'users' },
    { key: 'users.manage', name: 'Gérer les utilisateurs', description: 'Accès complet à la gestion des utilisateurs', module: 'users' },

    // Module: products
    { key: 'products.view', name: 'Voir les produits', description: 'Consulter le catalogue produits', module: 'products' },
    { key: 'products.create', name: 'Créer des produits', description: 'Ajouter de nouveaux produits', module: 'products' },
    { key: 'products.edit', name: 'Modifier les produits', description: 'Éditer les produits existants', module: 'products' },
    { key: 'products.delete', name: 'Supprimer des produits', description: 'Supprimer des produits', module: 'products' },
    { key: 'products.validate', name: 'Valider les produits', description: 'Approuver ou rejeter des produits', module: 'products' },

    // Module: stock
    { key: 'stock.view', name: 'Voir les stocks', description: 'Consulter les niveaux de stock', module: 'stock' },
    { key: 'stock.edit', name: 'Modifier les stocks', description: 'Ajuster les quantités en stock', module: 'stock' },
    { key: 'stock.manage', name: 'Gérer les stocks', description: 'Accès complet à la gestion des stocks', module: 'stock' },

    // Module: orders
    { key: 'orders.view', name: 'Voir les commandes', description: 'Consulter les commandes', module: 'orders' },
    { key: 'orders.edit', name: 'Modifier les commandes', description: 'Modifier le statut des commandes', module: 'orders' },
    { key: 'orders.manage', name: 'Gérer les commandes', description: 'Accès complet aux commandes', module: 'orders' },

    // Module: finance
    { key: 'finance.view', name: 'Voir les finances', description: 'Consulter les données financières', module: 'finance' },
    { key: 'finance.manage', name: 'Gérer les finances', description: 'Gérer paiements et transactions', module: 'finance' },
    { key: 'finance.reports', name: 'Rapports financiers', description: 'Générer des rapports financiers', module: 'finance' },

    // Module: vendors
    { key: 'vendors.view', name: 'Voir les vendeurs', description: 'Consulter la liste des vendeurs', module: 'vendors' },
    { key: 'vendors.create', name: 'Créer des vendeurs', description: 'Ajouter de nouveaux vendeurs', module: 'vendors' },
    { key: 'vendors.edit', name: 'Modifier les vendeurs', description: 'Éditer les vendeurs', module: 'vendors' },
    { key: 'vendors.delete', name: 'Supprimer des vendeurs', description: 'Supprimer des vendeurs', module: 'vendors' },
    { key: 'vendors.validate', name: 'Valider les vendeurs', description: 'Approuver ou rejeter des vendeurs', module: 'vendors' },

    // Module: categories
    { key: 'categories.view', name: 'Voir les catégories', description: 'Consulter les catégories', module: 'categories' },
    { key: 'categories.manage', name: 'Gérer les catégories', description: 'Créer, modifier, supprimer des catégories', module: 'categories' },

    // Module: marketing
    { key: 'marketing.view', name: 'Voir le marketing', description: 'Accéder aux outils marketing', module: 'marketing' },
    { key: 'marketing.manage', name: 'Gérer le marketing', description: 'Gérer campagnes et promotions', module: 'marketing' },

    // Module: settings
    { key: 'settings.view', name: 'Voir les paramètres', description: 'Consulter les paramètres système', module: 'settings' },
    { key: 'settings.manage', name: 'Gérer les paramètres', description: 'Modifier les paramètres système', module: 'settings' },

    // Module: reports
    { key: 'reports.view', name: 'Voir les rapports', description: 'Consulter les rapports et analytics', module: 'reports' },
    { key: 'reports.export', name: 'Exporter les rapports', description: 'Exporter les données', module: 'reports' },

    // Module: designs
    { key: 'designs.view', name: 'Voir les designs', description: 'Consulter les designs', module: 'designs' },
    { key: 'designs.create', name: 'Créer des designs', description: 'Ajouter de nouveaux designs', module: 'designs' },
    { key: 'designs.edit', name: 'Modifier les designs', description: 'Éditer les designs', module: 'designs' },
    { key: 'designs.delete', name: 'Supprimer des designs', description: 'Supprimer des designs', module: 'designs' },
    { key: 'designs.validate', name: 'Valider les designs', description: 'Approuver ou rejeter des designs', module: 'designs' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ ${permissions.length} permissions créées`);

  // Récupérer toutes les permissions
  const allPermissions = await prisma.permission.findMany();
  const permissionIds = allPermissions.map((p) => p.id);

  // Créer les rôles système
  console.log('👥 Création des rôles système...');

  // 1. Super Administrateur (accès total)
  const superAdmin = await prisma.customRole.upsert({
    where: { slug: 'superadmin' },
    update: {},
    create: {
      name: 'Super Administrateur',
      slug: 'superadmin',
      description: 'Accès complet à toutes les fonctionnalités',
      isSystem: true,
    },
  });

  // Assigner toutes les permissions au superadmin
  await prisma.rolePermission.deleteMany({
    where: { roleId: superAdmin.id },
  });
  await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: superAdmin.id,
      permissionId,
    })),
  });

  // 2. Administrateur (gestion quotidienne)
  const admin = await prisma.customRole.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Administrateur',
      slug: 'admin',
      description: 'Gestion quotidienne de la plateforme',
      isSystem: true,
    },
  });

  const adminPermissions = allPermissions.filter(
    (p) => !p.key.includes('settings.manage')
  );
  await prisma.rolePermission.deleteMany({
    where: { roleId: admin.id },
  });
  await prisma.rolePermission.createMany({
    data: adminPermissions.map((p) => ({
      roleId: admin.id,
      permissionId: p.id,
    })),
  });

  // 3. Finance
  const finance = await prisma.customRole.upsert({
    where: { slug: 'finance' },
    update: {},
    create: {
      name: 'Finance',
      slug: 'finance',
      description: 'Accès aux données financières et paiements',
      isSystem: false,
    },
  });

  const financePermissions = allPermissions.filter((p) =>
    ['finance', 'orders', 'vendors', 'reports'].includes(p.module)
  );
  await prisma.rolePermission.deleteMany({
    where: { roleId: finance.id },
  });
  await prisma.rolePermission.createMany({
    data: financePermissions.map((p) => ({
      roleId: finance.id,
      permissionId: p.id,
    })),
  });

  // 4. Production / Stock
  const production = await prisma.customRole.upsert({
    where: { slug: 'production' },
    update: {},
    create: {
      name: 'Production',
      slug: 'production',
      description: 'Gestion des stocks et de la production',
      isSystem: false,
    },
  });

  const productionPermissions = allPermissions.filter((p) =>
    ['stock', 'products', 'orders'].includes(p.module)
  );
  await prisma.rolePermission.deleteMany({
    where: { roleId: production.id },
  });
  await prisma.rolePermission.createMany({
    data: productionPermissions.map((p) => ({
      roleId: production.id,
      permissionId: p.id,
    })),
  });

  // 5. Marketing
  const marketing = await prisma.customRole.upsert({
    where: { slug: 'marketing' },
    update: {},
    create: {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Gestion du marketing et des promotions',
      isSystem: false,
    },
  });

  const marketingPermissions = allPermissions.filter((p) =>
    ['marketing', 'products', 'reports', 'designs'].includes(p.module)
  );
  await prisma.rolePermission.deleteMany({
    where: { roleId: marketing.id },
  });
  await prisma.rolePermission.createMany({
    data: marketingPermissions.map((p) => ({
      roleId: marketing.id,
      permissionId: p.id,
    })),
  });

  // 6. Vendeur
  const vendor = await prisma.customRole.upsert({
    where: { slug: 'vendor' },
    update: {},
    create: {
      name: 'Vendeur',
      slug: 'vendor',
      description: 'Compte vendeur avec accès limité',
      isSystem: true,
    },
  });

  const vendorPermissionKeys = [
    'products.view',
    'products.create',
    'products.edit',
    'designs.view',
    'designs.create',
    'designs.edit',
    'orders.view',
    'finance.view',
    'reports.view',
  ];
  const vendorPermissions = allPermissions.filter((p) =>
    vendorPermissionKeys.includes(p.key)
  );
  await prisma.rolePermission.deleteMany({
    where: { roleId: vendor.id },
  });
  await prisma.rolePermission.createMany({
    data: vendorPermissions.map((p) => ({
      roleId: vendor.id,
      permissionId: p.id,
    })),
  });

  console.log('✅ Rôles système créés avec succès');
  console.log('🎉 Seed RBAC terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
