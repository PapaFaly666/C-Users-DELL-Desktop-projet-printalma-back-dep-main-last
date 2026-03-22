import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Photos réalistes depuis randomuser.me (portraits stables par numéro)
const photos: Record<string, string> = {
  'moussa.diallo.design@gmail.com':  'https://randomuser.me/api/portraits/men/32.jpg',
  'fatou.sow.design@gmail.com':      'https://randomuser.me/api/portraits/women/44.jpg',
  'ibrahima.ndoye.studio@gmail.com': 'https://randomuser.me/api/portraits/men/54.jpg',
  'aminata.cisse.creative@gmail.com':'https://randomuser.me/api/portraits/women/68.jpg',
  'ousmane.ba.art@gmail.com':        'https://randomuser.me/api/portraits/men/76.jpg',
  'khady.faye.artiste@gmail.com':    'https://randomuser.me/api/portraits/women/22.jpg',
  'lamine.diop.artiste@gmail.com':   'https://randomuser.me/api/portraits/men/41.jpg',
  'rokhaya.mbaye.art@gmail.com':     'https://randomuser.me/api/portraits/women/55.jpg',
  'cheikh.ndiaye.influx@gmail.com':  'https://randomuser.me/api/portraits/men/62.jpg',
  'mariama.diagne.infl@gmail.com':   'https://randomuser.me/api/portraits/women/33.jpg',
  'pape.sarr.influenceur@gmail.com': 'https://randomuser.me/api/portraits/men/85.jpg',
  'ndeye.thiam.lifestyle@gmail.com': 'https://randomuser.me/api/portraits/women/79.jpg',
};

async function main() {
  console.log('🖼️  Ajout des photos de profil...\n');

  for (const [email, url] of Object.entries(photos)) {
    const updated = await prisma.user.update({
      where: { email },
      data: { profile_photo_url: url },
    });
    console.log(`✅ ${updated.firstName} ${updated.lastName} → ${url}`);
  }

  console.log('\n✅ Photos ajoutées pour les 12 vendeurs.');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
