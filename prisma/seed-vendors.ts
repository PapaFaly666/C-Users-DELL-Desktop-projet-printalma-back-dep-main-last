import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('printalmatest123', 10);
  const now = new Date();

  const vendors = [
    // ── DESIGNERS (4) ──────────────────────────────────────────────────────
    {
      firstName: 'Moussa',
      lastName: 'Diallo',
      email: 'moussa.diallo.design@gmail.com',
      shop_name: 'Dakar Créa Studio',
      vendeur_type: 'DESIGNER',
      vendor_bio: 'Designer graphique basé à Dakar, spécialisé dans la culture sénégalaise moderne.',
    },
    {
      firstName: 'Fatou',
      lastName: 'Sow',
      email: 'fatou.sow.design@gmail.com',
      shop_name: 'Teranga Designs',
      vendeur_type: 'DESIGNER',
      vendor_bio: 'Créatrice de motifs africains contemporains inspirés du Sénégal.',
    },
    {
      firstName: 'Ibrahima',
      lastName: 'Ndoye',
      email: 'ibrahima.ndoye.studio@gmail.com',
      shop_name: 'Ndoye Graphix',
      vendeur_type: 'DESIGNER',
      vendor_bio: 'Studio de design visuel à Saint-Louis, mêlant tradition et modernité.',
    },
    {
      firstName: 'Aminata',
      lastName: 'Cissé',
      email: 'aminata.cisse.creative@gmail.com',
      shop_name: 'Aminata Créative',
      vendeur_type: 'DESIGNER',
      vendor_bio: 'Passionnée de typographie africaine et d\'illustrations colorées.',
    },

    // ── ARTISTES (4) ───────────────────────────────────────────────────────
    {
      firstName: 'Ousmane',
      lastName: 'Ba',
      email: 'ousmane.ba.art@gmail.com',
      shop_name: 'Ba Art Sénégal',
      vendeur_type: 'ARTISTE',
      vendor_bio: 'Artiste peintre et illustrateur, ses œuvres racontent l\'âme de Dakar.',
    },
    {
      firstName: 'Khady',
      lastName: 'Faye',
      email: 'khady.faye.artiste@gmail.com',
      shop_name: 'Khady Fine Arts',
      vendeur_type: 'ARTISTE',
      vendor_bio: 'Artiste plasticienne spécialisée dans les portraits afro et la culture wolof.',
    },
    {
      firstName: 'Lamine',
      lastName: 'Diop',
      email: 'lamine.diop.artiste@gmail.com',
      shop_name: 'Lamine Urban Art',
      vendeur_type: 'ARTISTE',
      vendor_bio: 'Street artist dakarois, connu pour ses fresques murales et ses créations de t-shirts.',
    },
    {
      firstName: 'Rokhaya',
      lastName: 'Mbaye',
      email: 'rokhaya.mbaye.art@gmail.com',
      shop_name: 'Rokhaya Couleurs',
      vendeur_type: 'ARTISTE',
      vendor_bio: 'Artiste textile et illustratrice, inspirée par les pagnes et tenues traditionnelles.',
    },

    // ── INFLUENCEURS (4) ───────────────────────────────────────────────────
    {
      firstName: 'Cheikh',
      lastName: 'Ndiaye',
      email: 'cheikh.ndiaye.influx@gmail.com',
      shop_name: 'Cheikh Style Dakar',
      vendeur_type: 'INFLUENCEUR',
      vendor_bio: 'Influenceur mode et lifestyle à Dakar, 80k abonnés sur Instagram.',
    },
    {
      firstName: 'Mariama',
      lastName: 'Diagne',
      email: 'mariama.diagne.infl@gmail.com',
      shop_name: 'Mariama By Design',
      vendeur_type: 'INFLUENCEUR',
      vendor_bio: 'Créatrice de contenu mode africaine, passionnée de streetwear et de wax.',
    },
    {
      firstName: 'Pape',
      lastName: 'Sarr',
      email: 'pape.sarr.influenceur@gmail.com',
      shop_name: 'Pape Sarr Officiel',
      vendeur_type: 'INFLUENCEUR',
      vendor_bio: 'Influenceur culture urbaine sénégalaise, fan de musique et de mode.',
    },
    {
      firstName: 'Ndéye',
      lastName: 'Thiam',
      email: 'ndeye.thiam.lifestyle@gmail.com',
      shop_name: 'Ndéye Lifestyle',
      vendeur_type: 'INFLUENCEUR',
      vendor_bio: 'Influenceuse beauté et mode, ambassadrice du made-in-Sénégal.',
    },
  ];

  console.log('🌱 Création de 12 vendeurs sénégalais...\n');

  for (const v of vendors) {
    const existing = await prisma.user.findUnique({ where: { email: v.email } });
    if (existing) {
      console.log(`⚠️  Déjà existant : ${v.email}`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        password,
        role: 'VENDEUR',
        status: true,
        userStatus: 'ACTIVE',
        email_verified: true,
        vendeur_type: v.vendeur_type as any,
        shop_name: v.shop_name,
        vendor_bio: v.vendor_bio,
        onboarding_completed_at: now,
        must_change_password: false,
      },
    });

    console.log(`✅ ${v.vendeur_type.padEnd(11)} | ${v.firstName} ${v.lastName} | ${v.shop_name} | ${v.email} (id: ${user.id})`);
  }

  console.log('\n✅ Seed terminé — 12 vendeurs créés avec mot de passe: printalmatest123');
}

main()
  .catch(e => { console.error('❌ Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
