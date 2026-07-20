import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.checklistCompletion.deleteMany();
  await prisma.dailyChecklist.deleteMany();
  await prisma.formulaCheck.deleteMany();
  await prisma.requestTimeline.deleteMany();
  await prisma.clientRequest.deleteMany();
  await prisma.financialData.deleteMany();
  await prisma.whatsAppWebhookLog.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@synthonia.com',
      password: 'password123',
      name: 'Admin User',
      role: 'ADMIN' as Role,
      status: 'ACTIVE',
      whatsappPhone: '+393331234567',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@synthonia.com',
      password: 'password123',
      name: 'Manager User',
      role: 'MANAGER' as Role,
      status: 'ACTIVE',
      whatsappPhone: '+393337654321',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@synthonia.com',
      password: 'password123',
      name: 'Staff User',
      role: 'STAFF' as Role,
      status: 'ACTIVE',
    },
  });

  console.log('✓ Users created:', { admin, manager, staff });

  // Create sample financial data
  const today = new Date();
  const financialData = await prisma.financialData.create({
    data: {
      date: today,
      totalCash: 5000,
      budgetAllocated: 10000,
      budgetUsed: 3500,
      projectedRevenue: 15000,
      notes: 'Daily cash and budget tracking',
      createdById: admin.id,
    },
  });

  console.log('✓ Financial data created:', financialData);

  // Create sample checklist items
  const dayChecklist = await prisma.dailyChecklist.create({
    data: {
      date: today,
      createdById: manager.id,
      items: [
        { id: '1', text: 'Controllare messaggi WhatsApp', completed: true, completedAt: new Date() },
        { id: '2', text: 'Processare nuove richieste', completed: true, completedAt: new Date() },
        { id: '3', text: 'Preparare report giornaliero', completed: false },
        { id: '4', text: 'Contattare clienti follow-up', completed: false },
      ],
      status: 'IN_PROGRESS',
    },
  });

  console.log('✓ Day checklist created:', dayChecklist);

  // Create formula checks
  const formulaCheck1 = await prisma.formulaCheck.create({
    data: {
      name: 'Pre-Quote Check',
      description: 'Checklist da completare prima di inviare un preventivo',
      checkItems: [
        { id: '1', text: 'Verificare dettagli cliente', required: true },
        { id: '2', text: 'Controllare prezzi attuali', required: true },
        { id: '3', text: 'Calcolare margine profitto', required: true },
        { id: '4', text: 'Aggiungere termini e condizioni', required: false },
      ],
      frequency: 'AS_NEEDED',
      isActive: true,
    },
  });

  console.log('✓ Formula check created:', formulaCheck1);

  console.log('✓ Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
