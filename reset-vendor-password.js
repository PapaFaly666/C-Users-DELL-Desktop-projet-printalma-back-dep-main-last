const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetVendorPassword() {
  try {
    console.log('🔐 Réinitialisation du mot de passe vendeur...');
    
    // Trouver le vendeur
    const vendor = await prisma.user.findUnique({
      where: { email: 'pf.d@zig.univ.sn' },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
    
    if (!vendor) {
      console.log('❌ Vendeur non trouvé');
      return;
    }
    
    console.log('👤 Vendeur trouvé:', vendor);
    
    // Nouveau mot de passe
    const newPassword = 'test123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: vendor.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Mot de passe réinitialisé avec succès');
    console.log('🔑 Nouveau mot de passe:', newPassword);
    console.log('📧 Email:', vendor.email);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetVendorPassword(); 
 
 
 
 