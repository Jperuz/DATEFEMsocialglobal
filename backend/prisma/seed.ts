import { PrismaClient, Role, UserStatus, Vertical, BusinessStatus, PromotionType, PromotionStatus, Category } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpia la base de datos
  await prisma.booking.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.serviceStaff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.businessStaff.deleteMany();
  await prisma.business.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.comuna.deleteMany();

  console.log('✅ Base de datos limpiada');

  // Crea comunas
  const comunas = await Promise.all([
    prisma.comuna.create({
      data: {
        name: 'Palermo',
        slug: 'palermo',
        description: 'El barrio más grande de Buenos Aires',
        primaryColor: '#FF6B9D',
        secondaryColor: '#4ECDC4',
        isActive: true,
      },
    }),
    prisma.comuna.create({
      data: {
        name: 'Recoleta',
        slug: 'recoleta',
        description: 'Elegancia y cultura',
        primaryColor: '#9B59B6',
        secondaryColor: '#E74C3C',
        isActive: true,
      },
    }),
    prisma.comuna.create({
      data: {
        name: 'Belgrano',
        slug: 'belgrano',
        description: 'Residencial y tranquilo',
        primaryColor: '#3498DB',
        secondaryColor: '#2ECC71',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Creadas ${comunas.length} comunas`);

  // Crea usuario admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@datefem.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'DATEFEM',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  console.log('✅ Usuario admin creado');

  // Crea usuarios de prueba
  const userPassword = await bcrypt.hash('User123!', 10);
  const users = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `usuario${i + 1}@ejemplo.com`,
          password: userPassword,
          firstName: `Usuario${i + 1}`,
          lastName: 'Test',
          role: Role.CUSTOMER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          comunaId: comunas[i % comunas.length].id,
        },
      }),
    ),
  );

  console.log(`✅ Creados ${users.length} usuarios de prueba`);

  // Crea categorías para cada vertical
  const categoriesData = [
    { name: 'Peluquerías', slug: 'peluquerias', vertical: Vertical.BELLEZA },
    { name: 'Spas', slug: 'spas', vertical: Vertical.BELLEZA },
    { name: 'Uñas', slug: 'unas', vertical: Vertical.BELLEZA },
    { name: 'Gimnasios', slug: 'gimnasios', vertical: Vertical.DATEFIT },
    { name: 'Entrenadores', slug: 'entrenadores', vertical: Vertical.DATEFIT },
    { name: 'Yoga', slug: 'yoga', vertical: Vertical.BIENESTAR },
    { name: 'Meditación', slug: 'meditacion', vertical: Vertical.BIENESTAR },
    { name: 'Masajes', slug: 'masajes', vertical: Vertical.BIENESTAR },
    { name: 'Consultorios', slug: 'consultorios', vertical: Vertical.SALUD },
    { name: 'Odontología', slug: 'odontologia', vertical: Vertical.SALUD },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.category.create({
        data: {
          ...cat,
          isActive: true,
        },
      }),
    ),
  );

  console.log(`✅ Creadas ${categories.length} categorías`);

  // Crea comercios de prueba
  const businessOwners = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `negocio${i + 1}@ejemplo.com`,
          password: userPassword,
          firstName: `Dueño${i + 1}`,
          lastName: 'Negocio',
          role: Role.BUSINESS_OWNER,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          comunaId: comunas[0].id,
        },
      }),
    ),
  );

  const businessesData = [
    {
      name: 'Spa Relax Total',
      slug: 'spa-relax-total',
      description: 'El mejor spa de Palermo',
      vertical: Vertical.BIENESTAR,
      categoryId: categories[1].id,
      email: 'contacto@sparelax.com',
      phone: '+541123456789',
      address: 'Av. Santa Fe 1234',
      comunaId: comunas[0].id,
      ownerId: businessOwners[0].id,
      status: BusinessStatus.ACTIVE,
      isFeatured: true,
      schedule: {
        monday: { open: '09:00', close: '20:00' },
        tuesday: { open: '09:00', close: '20:00' },
        wednesday: { open: '09:00', close: '20:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '21:00' },
        saturday: { open: '10:00', close: '18:00' },
      },
    },
    {
      name: 'Gym Power Fit',
      slug: 'gym-power-fit',
      description: 'Tu gimnasio de confianza',
      vertical: Vertical.DATEFIT,
      categoryId: categories[3].id,
      email: 'info@gympower.com',
      phone: '+541198765432',
      address: 'Av. Córdoba 5678',
      comunaId: comunas[0].id,
      ownerId: businessOwners[1].id,
      status: BusinessStatus.ACTIVE,
      isFeatured: false,
      schedule: {
        monday: { open: '06:00', close: '23:00' },
        tuesday: { open: '06:00', close: '23:00' },
        wednesday: { open: '06:00', close: '23:00' },
        thursday: { open: '06:00', close: '23:00' },
        friday: { open: '06:00', close: '23:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '20:00' },
      },
    },
    {
      name: 'Peluquería Estilo',
      slug: 'peluqueria-estilo',
      description: 'Los mejores cortes y color',
      vertical: Vertical.BELLEZA,
      categoryId: categories[0].id,
      email: 'turnos@estilo.com',
      phone: '+541134567890',
      address: 'Av. Las Heras 901',
      comunaId: comunas[1].id,
      ownerId: businessOwners[2].id,
      status: BusinessStatus.ACTIVE,
      isFeatured: true,
      schedule: {
        monday: { open: '10:00', close: '19:00' },
        tuesday: { open: '10:00', close: '19:00' },
        wednesday: { open: '10:00', close: '19:00' },
        thursday: { open: '10:00', close: '19:00' },
        friday: { open: '10:00', close: '20:00' },
        saturday: { open: '09:00', close: '18:00' },
      },
    },
  ];

  const businesses = await Promise.all(
    businessesData.map((biz) =>
      prisma.business.create({
        data: biz,
      }),
    ),
  );

  console.log(`✅ Creados ${businesses.length} comercios`);

  // Crea servicios
  const servicesData = [
    {
      name: 'Masaje Relajante',
      description: 'Masaje de cuerpo completo',
      businessId: businesses[0].id,
      categoryId: categories[7].id,
      duration: 60,
      price: 5000,
      isActive: true,
    },
    {
      name: 'Masaje Descontracturante',
      description: 'Para aliviar tensiones',
      businessId: businesses[0].id,
      categoryId: categories[7].id,
      duration: 45,
      price: 4000,
      isActive: true,
    },
    {
      name: 'Clase de Yoga',
      description: 'Yoga para todos los niveles',
      businessId: businesses[1].id,
      categoryId: categories[5].id,
      duration: 60,
      price: 1500,
      isActive: true,
    },
    {
      name: 'Entrenamiento Personal',
      description: 'Sesión personalizada',
      businessId: businesses[1].id,
      categoryId: categories[4].id,
      duration: 45,
      price: 3000,
      isActive: true,
    },
    {
      name: 'Corte de Cabello',
      description: 'Corte y peinado',
      businessId: businesses[2].id,
      categoryId: categories[0].id,
      duration: 45,
      price: 2500,
      isActive: true,
    },
  ];

  const services = await Promise.all(
    servicesData.map((svc) =>
      prisma.service.create({
        data: svc,
      }),
    ),
  );

  console.log(`✅ Creados ${services.length} servicios`);

  // Crea promociones
  const promotionsData = [
    {
      title: '50% OFF en tu primera visita',
      description: 'Válido para nuevos clientes',
      type: PromotionType.PERCENTAGE,
      vertical: Vertical.BIENESTAR,
      discountValue: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      comunaId: comunas[0].id,
      businessId: businesses[0].id,
      status: PromotionStatus.ACTIVE,
    },
    {
      title: '2x1 en clases de Yoga',
      description: 'Trae un amigo gratis',
      type: PromotionType.BUY_X_GET_Y,
      vertical: Vertical.DATEFIT,
      discountValue: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      comunaId: comunas[0].id,
      businessId: businesses[1].id,
      status: PromotionStatus.ACTIVE,
    },
  ];

  const promotions = await Promise.all(
    promotionsData.map((promo) =>
      prisma.promotion.create({
        data: promo,
      }),
    ),
  );

  console.log(`✅ Creadas ${promotions.length} promociones`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📧 Credenciales de prueba:');
  console.log('  Admin: admin@datefem.com / Admin123!');
  console.log('  Usuario: usuario1@ejemplo.com / User123!');
  console.log('  Negocio: negocio1@ejemplo.com / User123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
