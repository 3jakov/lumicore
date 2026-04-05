import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Seed default roles (idempotent)
  const roles = ['Administraator', 'Projektijuht', 'Paigaldaja', 'Laospetsialist', 'Pakkija'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${roles.length} roles`);

  // Seed 19 task templates (from PRD/ARCHITECTURE)
  const templates = [
    { name: 'Mõõduvõtt', type: 'general' as const, sort_order: 1 },
    { name: 'Projekteerimine', type: 'general' as const, sort_order: 2 },
    { name: 'Tootmine', type: 'production' as const, sort_order: 3 },
    { name: 'Kvaliteedikontroll', type: 'production' as const, sort_order: 4 },
    { name: 'Pakkimine', type: 'production' as const, sort_order: 5 },
    { name: 'Transport', type: 'general' as const, sort_order: 6 },
    { name: 'Paigaldus', type: 'general' as const, sort_order: 7 },
    { name: 'Seadistamine', type: 'general' as const, sort_order: 8 },
    { name: 'Koristus', type: 'general' as const, sort_order: 9 },
    { name: 'Ülevaatus', type: 'general' as const, sort_order: 10 },
    { name: 'Garantiitöö', type: 'general' as const, sort_order: 11 },
    { name: 'Konsultatsioon', type: 'general' as const, sort_order: 12 },
    { name: 'Dokumentatsioon', type: 'general' as const, sort_order: 13 },
    { name: 'Koolitus', type: 'general' as const, sort_order: 14 },
    { name: 'Hanked', type: 'general' as const, sort_order: 15 },
    { name: 'Alltöövõtt', type: 'general' as const, sort_order: 16 },
    { name: 'Järelkontroll', type: 'general' as const, sort_order: 17 },
    { name: 'Arhiveerimine', type: 'general' as const, sort_order: 18 },
    { name: 'Muu', type: 'general' as const, sort_order: 19 },
  ];

  for (const template of templates) {
    await prisma.taskTemplate.upsert({
      where: { name: template.name },
      update: { sort_order: template.sort_order, type: template.type },
      create: {
        name: template.name,
        type: template.type,
        sort_order: template.sort_order,
      },
    });
  }
  console.log(`Seeded ${templates.length} task templates`);

  // Seed company settings (idempotent — only create if none exist)
  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        company_name: 'LUMICO OÜ',
      },
    });
    console.log('Seeded company settings');
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
