import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  // PRD §7.3.3 — exact 19 templates, production sequence first, then general
  const templates = [
    { name: 'Tellimuse ettevalmistus',        type: 'production' as const, sort_order: 1  },
    { name: 'Materjali ettevalmistus',         type: 'production' as const, sort_order: 2  },
    { name: 'Lõikamine',                       type: 'production' as const, sort_order: 3  },
    { name: 'Freesimine',                      type: 'production' as const, sort_order: 4  },
    { name: 'Profilli liimimine klaasile',     type: 'production' as const, sort_order: 5  },
    { name: 'Liimi pealekandmine',             type: 'production' as const, sort_order: 6  },
    { name: 'Kuivamine',                       type: 'production' as const, sort_order: 7  },
    { name: 'Värvimine',                       type: 'production' as const, sort_order: 8  },
    { name: 'Komplekteerimine ja kiletamine',  type: 'production' as const, sort_order: 9  },
    { name: 'Pakkimine',                       type: 'production' as const, sort_order: 10 },
    { name: 'Transport',                       type: 'production' as const, sort_order: 11 },
    { name: 'Paigaldus',                       type: 'production' as const, sort_order: 12 },
    { name: 'Konsultatsioon',                  type: 'general'    as const, sort_order: 13 },
    { name: 'Koolitus',                        type: 'general'    as const, sort_order: 14 },
    { name: 'Kontor',                          type: 'general'    as const, sort_order: 15 },
    { name: 'Inventuur',                       type: 'general'    as const, sort_order: 16 },
    { name: 'Kaubik',                          type: 'general'    as const, sort_order: 17 },
    { name: 'Mõõtmine',                        type: 'general'    as const, sort_order: 18 },
    { name: 'Prügivedu',                       type: 'general'    as const, sort_order: 19 },
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

  // Seed admin user (idempotent — upsert by email)
  const adminRole = await prisma.role.findUnique({ where: { name: 'Administraator' } });
  if (adminRole) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.employee.upsert({
      where: { email: 'admin@lumico.ee' },
      update: {},
      create: {
        full_name: 'Admin Lumico',
        initials: 'AL',
        email: 'admin@lumico.ee',
        password_hash: passwordHash,
        group: 'Kontor',
        avatar_color: '#4F46E5',
        language: 'et',
        time_format: 'H24',
      },
    });
    // Assign Administraator role (idempotent)
    await prisma.employeeRole.upsert({
      where: { employee_id_role_id: { employee_id: admin.id, role_id: adminRole.id } },
      update: {},
      create: { employee_id: admin.id, role_id: adminRole.id },
    });
    console.log(`Seeded admin user: admin@lumico.ee / admin123`);
  }

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
