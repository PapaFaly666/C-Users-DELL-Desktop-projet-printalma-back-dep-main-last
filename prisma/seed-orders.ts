import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedOrders(users: any, products: any[]) {
  console.log('📦 Seeding orders...');

  const { clients, vendors } = users;
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const orders = [];

  // Générer 100 commandes
  for (let i = 0; i < 100; i++) {
    // Sélectionner un client aléatoire
    const client = clients[Math.floor(Math.random() * clients.length)];

    // Sélectionner un statut aléatoire (plus de commandes livrées/confirmées)
    let status;
    const rand = Math.random();
    if (rand < 0.3) status = 'DELIVERED';
    else if (rand < 0.5) status = 'SHIPPED';
    else if (rand < 0.7) status = 'CONFIRMED';
    else if (rand < 0.85) status = 'PROCESSING';
    else if (rand < 0.95) status = 'PENDING';
    else status = 'CANCELLED';

    // Générer une date de création aléatoire (3 derniers mois)
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90));

    // Nombre d'articles dans la commande (1 à 5)
    const itemCount = Math.floor(Math.random() * 5) + 1;

    // Calculer le sous-total
    let subtotal = 0;
    const orderItems = [];

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = product.price;

      // Récupérer une couleur et une taille aléatoires pour ce produit
      const colors = await prisma.colorVariation.findMany({
        where: { productId: product.id },
      });

      const sizes = await prisma.productSize.findMany({
        where: { productId: product.id },
      });

      if (colors.length > 0 && sizes.length > 0) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];

        orderItems.push({
          productId: product.id,
          quantity,
          unitPrice,
          size: size.sizeName,
          color: color.name,
          colorId: color.id,
        });

        subtotal += unitPrice * quantity;
      }
    }

    const shippingAmount = subtotal > 50 ? 0 : 5.99; // Livraison gratuite au-dessus de 50€
    const taxAmount = subtotal * 0.20; // TVA 20%
    const totalAmount = subtotal + shippingAmount + taxAmount;

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i.toString().padStart(4, '0')}`,
        userId: client.id,
        status: status as any,
        totalAmount,
        subtotal,
        shippingAmount,
        taxAmount,
        phoneNumber: client.phone || `+33 6 ${Math.floor(10000000 + Math.random() * 90000000)}`,
        notes: Math.random() > 0.7 ? 'Livraison rapide SVP' : null,
        createdAt: createdDate,
        updatedAt: createdDate,
        shippingName: `${client.firstName} ${client.lastName}`,
        shippingStreet: client.address || `${Math.floor(Math.random() * 200)} Rue de la République`,
        shippingCity: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux'][Math.floor(Math.random() * 7)],
        shippingRegion: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d\'Azur', 'Occitanie', 'Nouvelle-Aquitaine'][Math.floor(Math.random() * 5)],
        shippingPostalCode: `${Math.floor(10000 + Math.random() * 90000)}`,
        shippingCountry: 'France',
        paymentMethod: ['CARD', 'PAYPAL', 'WAVE', 'ORANGE_MONEY'][Math.floor(Math.random() * 4)],
        confirmedAt: status !== 'PENDING' && status !== 'CANCELLED' ? new Date(createdDate.getTime() + 3600000) : null, // +1h
        shippedAt: (status === 'SHIPPED' || status === 'DELIVERED') ? new Date(createdDate.getTime() + 86400000) : null, // +1 jour
        deliveredAt: status === 'DELIVERED' ? new Date(createdDate.getTime() + 259200000) : null, // +3 jours
      },
    });

    // Créer les items de commande
    for (const itemData of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          size: itemData.size,
          color: itemData.color,
          colorId: itemData.colorId,
        },
      });
    }

    orders.push(order);

    // Mettre à jour les earnings des vendeurs pour les commandes livrées
    if (status === 'DELIVERED') {
      // Pour simplifier, on attribue les gains à un vendeur aléatoire
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];

      const vendorCommission = await prisma.vendorCommission.findUnique({
        where: { vendorId: vendor.id },
      });

      if (vendorCommission) {
        const commissionRate = vendorCommission.commissionRate / 100;
        const vendorEarning = subtotal * (1 - commissionRate); // Le vendeur gagne le montant moins la commission
        const commissionAmount = subtotal * commissionRate;

        await prisma.vendorEarnings.update({
          where: { vendorId: vendor.id },
          data: {
            totalEarnings: { increment: vendorEarning },
            availableAmount: { increment: vendorEarning },
            thisMonthEarnings: { increment: vendorEarning },
            totalCommissionPaid: { increment: commissionAmount },
          },
        });
      }
    }
  }

  console.log(`✅ ${orders.length} orders created with order items`);

  return orders;
}
