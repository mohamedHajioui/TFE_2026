import { faker } from '@faker-js/faker';
import { User } from '../../src/modules/users/entity/user.entity';
import {
  Product,
  ProductCategory,
} from '../../src/modules/products/entity/product.entity';
import {
  Ingredient,
  IngredientCategory,
} from '../../src/modules/ingredients/entity/ingredient.entity';
import { ProductIngredient } from '../../src/modules/product-ingredients/entity/product-ingredient.entity';
import { TimeSlot } from '../../src/modules/time-slot/entity/time-slot.entity';
import { Menu } from '../../src/modules/menus/entity/menu.entity';
import {
  Order,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from '../../src/modules/order/entity/order.entity';
import { OrderItem } from '../../src/modules/order-item/entity/order-item.entity';
import { Address } from '../../src/modules/adress/entity/address.entity';
import { CryptoUtil } from '../../src/common/utils/crypto.util';
import { AppDataSource } from '../data-source';
import { UserRole } from '../../src/modules/users/enums/user-role.enum';

async function seed() {
  console.log('🌱 Début du seeding...');
  await AppDataSource.initialize();
  console.log('✅ Connexion DB établie');

  await cleanDatabase();
  await createUsers();
  await createIngredients();
  await createProducts();
  await createMenus();
  await createTimeSlots();
  await createAddresses();
  await createOrders();

  console.log('🎉 Seeding terminé avec succès !');
  await AppDataSource.destroy();
}

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');

  const entities = [
    'stock_movement',
    'order_item',
    'order',
    'product_ingredient',
    'menu_products',
    'menu',
    'product',
    'ingredient',
    'time_slot',
    'address',
    'user',
  ];

  for (const entity of entities) {
    await AppDataSource.query(`TRUNCATE TABLE "${entity}" CASCADE`);
  }

  console.log('✅ Base de données nettoyée');
}

async function createUsers() {
  console.log('👥 Création des utilisateurs...');

  const userRepo = AppDataSource.getRepository(User);

  const admin = userRepo.create({
    email: 'admin@sandwicherie.be',
    displayName: 'Admin',
    passwordHash: await CryptoUtil.hashPassword('Admin123!'),
    phoneNumber: '+32470123456',
    role: UserRole.ADMIN,
    isActive: true,
  });

  const employee = userRepo.create({
    email: 'employee@sandwicherie.be',
    displayName: 'Employé',
    passwordHash: await CryptoUtil.hashPassword('Employee123!'),
    phoneNumber: '+32471234567',
    role: UserRole.EMPLOYEE,
    isActive: true,
  });

  const client = userRepo.create({
    email: 'client@test.be',
    displayName: 'Client Test',
    passwordHash: await CryptoUtil.hashPassword('Client123!'),
    phoneNumber: '+32472345678',
    role: UserRole.CLIENT,
    isActive: true,
  });

  const randomClients: User[] = [];
  for (let i = 0; i < 3; i++) {
    randomClients.push(
      userRepo.create({
        email: faker.internet.email(),
        displayName: faker.person.fullName(),
        passwordHash: await CryptoUtil.hashPassword('Password123!'),
        phoneNumber: `+3247${faker.string.numeric(7)}`,
        role: UserRole.CLIENT,
        isActive: true,
      }),
    );
  }

  await userRepo.save([admin, employee, client, ...randomClients]);

  console.log('✅ Utilisateurs créés :');
  console.log('   - Admin: admin@sandwicherie.be / Admin123!');
  console.log('   - Employé: employee@sandwicherie.be / Employee123!');
  console.log('   - Client: client@test.be / Client123!');
}

/**
 * RÈGLE IMPORTANTE : la quantité dans product_ingredient doit être
 * dans la MÊME unité que le currentStock de l'ingrédient.
 * Ex : si l'ingrédient est en kg, la quantité doit être en kg (0.15, pas 150).
 * Ex : si l'ingrédient est en pièces, la quantité est 1.
 */
async function createIngredients() {
  console.log('🥬 Création des ingrédients...');

  const ingredientRepo = AppDataSource.getRepository(Ingredient);

  const ingredientsData = [
    // Pains — unité : pièces
    {
      name: 'Pain blanc',
      category: IngredientCategory.BREAD,
      currentStock: 100,
      minStock: 15,
      unit: 'pièces',
      costPerUnit: 0.5,
      isAvailable: true,
    },
    {
      name: 'Pain complet',
      category: IngredientCategory.BREAD,
      currentStock: 80,
      minStock: 15,
      unit: 'pièces',
      costPerUnit: 0.6,
      isAvailable: true,
    },
    {
      name: 'Pain ciabatta',
      category: IngredientCategory.BREAD,
      currentStock: 60,
      minStock: 10,
      unit: 'pièces',
      costPerUnit: 0.7,
      isAvailable: true,
    },

    // Protéines — unité : kg
    // Jambon (porc) — non halal
    {
      name: 'Jambon',
      category: IngredientCategory.PROTEIN,
      currentStock: 5.0,
      minStock: 1.0,
      unit: 'kg',
      costPerUnit: 8.5,
      isAvailable: true,
    },
    // Poulet halal
    {
      name: 'Poulet halal',
      category: IngredientCategory.PROTEIN,
      currentStock: 5.0,
      minStock: 1.0,
      unit: 'kg',
      costPerUnit: 9.5,
      isAvailable: true,
    },
    // Poulet standard
    {
      name: 'Poulet',
      category: IngredientCategory.PROTEIN,
      currentStock: 5.0,
      minStock: 1.0,
      unit: 'kg',
      costPerUnit: 9.0,
      isAvailable: true,
    },
    {
      name: 'Bacon',
      category: IngredientCategory.PROTEIN,
      currentStock: 3.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 10.0,
      isAvailable: true,
    },

    // Fromages — unité : kg
    {
      name: 'Fromage cheddar',
      category: IngredientCategory.CHEESE,
      currentStock: 4.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 7.5,
      isAvailable: true,
    },

    // Légumes — unité : kg
    {
      name: 'Salade',
      category: IngredientCategory.VEGETABLE,
      currentStock: 3.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 2.5,
      isAvailable: true,
    },
    {
      name: 'Tomate',
      category: IngredientCategory.VEGETABLE,
      currentStock: 4.0,
      minStock: 0.8,
      unit: 'kg',
      costPerUnit: 3.0,
      isAvailable: true,
    },
    {
      name: 'Avocat',
      category: IngredientCategory.VEGETABLE,
      currentStock: 3.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 6.0,
      isAvailable: true,
    },
    {
      name: 'Oignon rouge',
      category: IngredientCategory.VEGETABLE,
      currentStock: 2.0,
      minStock: 0.3,
      unit: 'kg',
      costPerUnit: 1.5,
      isAvailable: true,
    },

    // Sauces — unité : kg
    {
      name: 'Mayonnaise',
      category: IngredientCategory.SAUCE,
      currentStock: 2.0,
      minStock: 0.3,
      unit: 'kg',
      costPerUnit: 4.5,
      isAvailable: true,
    },
    {
      name: 'Sauce harissa',
      category: IngredientCategory.SAUCE,
      currentStock: 1.5,
      minStock: 0.2,
      unit: 'kg',
      costPerUnit: 5.0,
      isAvailable: true,
    },
    {
      name: 'Sauce mayo-curry',
      category: IngredientCategory.SAUCE,
      currentStock: 1.5,
      minStock: 0.2,
      unit: 'kg',
      costPerUnit: 5.0,
      isAvailable: true,
    },

    // Boissons — unité : pièces (canettes/bouteilles)
    {
      name: 'Coca-Cola (33cl)',
      category: IngredientCategory.OTHER,
      currentStock: 100,
      minStock: 20,
      unit: 'pièces',
      costPerUnit: 0.8,
      isAvailable: true,
    },
    {
      name: 'Ice Tea Pêche (50cl)',
      category: IngredientCategory.OTHER,
      currentStock: 80,
      minStock: 15,
      unit: 'pièces',
      costPerUnit: 0.9,
      isAvailable: true,
    },
    {
      name: 'Eau minérale (50cl)',
      category: IngredientCategory.OTHER,
      currentStock: 80,
      minStock: 15,
      unit: 'pièces',
      costPerUnit: 0.4,
      isAvailable: true,
    },

    // Desserts — unité : pièces
    {
      name: 'Tiramisu (portion)',
      category: IngredientCategory.OTHER,
      currentStock: 40,
      minStock: 5,
      unit: 'pièces',
      costPerUnit: 2.0,
      isAvailable: true,
    },
    {
      name: 'Cookie choco',
      category: IngredientCategory.OTHER,
      currentStock: 60,
      minStock: 10,
      unit: 'pièces',
      costPerUnit: 0.6,
      isAvailable: true,
    },
  ];

  const saved = await ingredientRepo.save(
    ingredientsData.map((d) => ingredientRepo.create(d)),
  );

  console.log(`✅ ${saved.length} ingrédients créés`);
  return saved;
}

async function createProducts() {
  console.log('🍔 Création des produits...');

  const productRepo = AppDataSource.getRepository(Product);
  const ingredientRepo = AppDataSource.getRepository(Ingredient);
  const piRepo = AppDataSource.getRepository(ProductIngredient);

  const get = (name: string) => ingredientRepo.findOneByOrFail({ name });

  // Ingrédients
  const painBlanc = await get('Pain blanc');
  const painComplet = await get('Pain complet');
  const painCiabatta = await get('Pain ciabatta');
  const jambon = await get('Jambon');
  const pouletHalal = await get('Poulet halal');
  const poulet = await get('Poulet');
  const bacon = await get('Bacon');
  const fromage = await get('Fromage cheddar');
  const salade = await get('Salade');
  const tomate = await get('Tomate');
  const avocat = await get('Avocat');
  const oignon = await get('Oignon rouge');
  const mayo = await get('Mayonnaise');
  const harissa = await get('Sauce harissa');
  const mayoCurry = await get('Sauce mayo-curry');
  const cocaCola = await get('Coca-Cola (33cl)');
  const iceTea = await get('Ice Tea Pêche (50cl)');
  const eau = await get('Eau minérale (50cl)');
  const tiramisu = await get('Tiramisu (portion)');
  const cookie = await get('Cookie choco');

  // ─── Helper pour créer un produit + ses ingrédients ───────────────────────
  async function makeProduct(
    data: Partial<Product>,
    pis: Array<{
      ingredient: Ingredient;
      quantity: number;
      isRequired: boolean;
      extraPrice?: number;
    }>,
  ): Promise<Product> {
    const product = await productRepo.save(productRepo.create(data as Product));
    await piRepo.save(
      pis.map((pi) =>
        piRepo.create({
          product,
          ingredient: pi.ingredient,
          quantity: pi.quantity,
          unit: pi.ingredient.unit,
          isRequired: pi.isRequired,
          extraPrice: pi.extraPrice ?? 0,
        }),
      ),
    );
    return product;
  }

  // ─── SANDWICHS ────────────────────────────────────────────────────────────

  // Quantités en kg : 0.1 kg = 100g, 0.05 kg = 50g, etc.

  await makeProduct(
    {
      name: 'Sandwich Américain',
      category: ProductCategory.SANDWICH,
      description: 'Jambon, fromage cheddar, salade, tomate',
      basePrice: 6.5,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: painBlanc, quantity: 1, isRequired: true },
      { ingredient: jambon, quantity: 0.1, isRequired: true },
      { ingredient: fromage, quantity: 0.05, isRequired: true },
      { ingredient: salade, quantity: 0.03, isRequired: true },
      { ingredient: tomate, quantity: 0.04, isRequired: true },
      { ingredient: mayo, quantity: 0.02, isRequired: false },
      { ingredient: bacon, quantity: 0.05, isRequired: false, extraPrice: 1.5 },
    ],
  );

  await makeProduct(
    {
      name: 'Sandwich Poulet Avocat',
      category: ProductCategory.SANDWICH,
      description: 'Poulet grillé, avocat, salade, sauce mayo-curry',
      basePrice: 7.5,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: painComplet, quantity: 1, isRequired: true },
      { ingredient: poulet, quantity: 0.12, isRequired: true },
      { ingredient: avocat, quantity: 0.08, isRequired: true },
      { ingredient: salade, quantity: 0.03, isRequired: true },
      { ingredient: mayoCurry, quantity: 0.02, isRequired: false },
      { ingredient: tomate, quantity: 0.04, isRequired: false },
    ],
  );

  // ─── SANDWICH HALAL ───────────────────────────────────────────────────────
  await makeProduct(
    {
      name: 'Sandwich Poulet Halal',
      category: ProductCategory.SANDWICH,
      description:
        'Halal · Poulet halal, salade, tomate, oignon rouge, harissa',
      basePrice: 7.0,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: painCiabatta, quantity: 1, isRequired: true },
      { ingredient: pouletHalal, quantity: 0.12, isRequired: true },
      { ingredient: salade, quantity: 0.03, isRequired: true },
      { ingredient: tomate, quantity: 0.04, isRequired: true },
      { ingredient: oignon, quantity: 0.03, isRequired: false },
      { ingredient: harissa, quantity: 0.02, isRequired: false },
      { ingredient: mayo, quantity: 0.02, isRequired: false, extraPrice: 0 },
    ],
  );

  // ─── BOISSONS (produits simples, pas d'ingrédient géré) ───────────────────
  await makeProduct(
    {
      name: 'Coca-Cola',
      category: ProductCategory.DRINK,
      description: 'Canette 33cl',
      basePrice: 2.5,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: cocaCola, quantity: 1, isRequired: true }],
  );

  await makeProduct(
    {
      name: 'Ice Tea Pêche',
      category: ProductCategory.DRINK,
      description: 'Bouteille 50cl',
      basePrice: 3.0,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: iceTea, quantity: 1, isRequired: true }],
  );

  await makeProduct(
    {
      name: 'Eau minérale',
      category: ProductCategory.DRINK,
      description: 'Bouteille 50cl',
      basePrice: 2.0,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: eau, quantity: 1, isRequired: true }],
  );

  // ─── DESSERTS ─────────────────────────────────────────────────────────────
  await makeProduct(
    {
      name: 'Tiramisu',
      category: ProductCategory.DESSERT,
      description: 'Tiramisu maison',
      basePrice: 4.5,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: tiramisu, quantity: 1, isRequired: true }],
  );

  await makeProduct(
    {
      name: 'Cookie',
      category: ProductCategory.DESSERT,
      description: 'Cookie pépites de chocolat',
      basePrice: 2.5,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: cookie, quantity: 1, isRequired: true }],
  );

  console.log('✅ Produits créés :');
  console.log('   - Sandwich Américain');
  console.log('   - Sandwich Poulet Avocat');
  console.log('   - Sandwich Poulet Halal 🥩');
  console.log('   - 3 boissons, 2 desserts');
}

async function createMenus() {
  console.log('🍱 Création des menus...');

  const menuRepo = AppDataSource.getRepository(Menu);
  const productRepo = AppDataSource.getRepository(Product);

  const get = (name: string) => productRepo.findOneByOrFail({ name });

  const sandwichAmericain = await get('Sandwich Américain');
  const sandwichPoulet = await get('Sandwich Poulet Avocat');
  const sandwichHalal = await get('Sandwich Poulet Halal');
  const coca = await get('Coca-Cola');
  const iceTea = await get('Ice Tea Pêche');
  const eau = await get('Eau minérale');
  const tiramisu = await get('Tiramisu');
  const cookie = await get('Cookie');

  const config = {
    sandwich: { required: true, quantity: 1 },
    drink: { required: true, quantity: 1 },
    dessert: { required: true, quantity: 1 },
    side: { required: false, quantity: 0 },
  };

  await menuRepo.save([
    menuRepo.create({
      name: 'Menu Midi',
      description: 'Sandwich Américain + Boisson + Cookie',
      price: 10.0,
      isActive: true,
      configuration: config,
      allowedProducts: [sandwichAmericain, coca, eau, cookie],
    }),
    menuRepo.create({
      name: 'Menu Healthy',
      description: 'Sandwich Poulet Avocat + Ice Tea + Tiramisu',
      price: 12.5,
      isActive: true,
      configuration: config,
      allowedProducts: [sandwichPoulet, iceTea, tiramisu],
    }),
    menuRepo.create({
      name: 'Menu Halal',
      description: 'Sandwich Poulet Halal + Boisson + Dessert',
      price: 11.5,
      isActive: true,
      configuration: config,
      allowedProducts: [sandwichHalal, coca, eau, iceTea, cookie, tiramisu],
    }),
  ]);

  console.log('✅ Menus créés :');
  console.log('   - Menu Midi (10.00€)');
  console.log('   - Menu Healthy (12.50€)');
  console.log('   - Menu Halal (11.50€) 🥩');
}

async function createTimeSlots() {
  console.log('⏰ Création des créneaux horaires...');

  const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
  const slots: TimeSlot[] = [];
  const today = new Date();

  for (let day = 0; day < 3; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    const allSlots = [
      { start: '12:00', end: '12:30' },
      { start: '12:30', end: '13:00' },
      { start: '13:00', end: '13:30' },
      { start: '13:30', end: '14:00' },
      { start: '18:30', end: '19:00' },
      { start: '19:00', end: '19:30' },
      { start: '19:30', end: '20:00' },
      { start: '20:00', end: '20:30' },
    ];

    for (const slot of allSlots) {
      slots.push(
        timeSlotRepo.create({
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          maxCapacity: 10,
          currentBookings: 0,
          isAvailable: true,
        }),
      );
    }
  }

  await timeSlotRepo.save(slots);
  console.log(`✅ ${slots.length} créneaux horaires créés`);
}

async function createAddresses() {
  console.log('📍 Création des adresses...');

  const addressRepo = AppDataSource.getRepository(Address);
  const userRepo = AppDataSource.getRepository(User);

  const clients = await userRepo.find({ where: { role: UserRole.CLIENT } });
  const addresses: Address[] = [];

  for (const client of clients) {
    addresses.push(
      addressRepo.create({
        user: client,
        street: faker.location.street(),
        number: faker.number.int({ min: 1, max: 200 }).toString(),
        postalCode: faker.helpers.arrayElement([
          '1000',
          '1050',
          '1070',
          '1200',
        ]),
        city: 'Bruxelles',
        country: 'Belgium',
        label: 'Domicile',
        isDefault: true,
      }),
    );
  }

  await addressRepo.save(addresses);
  console.log(`✅ ${addresses.length} adresses créées`);
}

async function createOrders() {
  console.log('📦 Création des commandes...');

  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
  const addressRepo = AppDataSource.getRepository(Address);

  const clients = await userRepo.find({ where: { role: UserRole.CLIENT } });
  const sandwichs = await productRepo.find({
    where: { category: ProductCategory.SANDWICH, isActive: true },
  });
  const boissons = await productRepo.find({
    where: { category: ProductCategory.DRINK, isActive: true },
  });
  const desserts = await productRepo.find({
    where: { category: ProductCategory.DESSERT, isActive: true },
  });
  const timeSlots = await timeSlotRepo.find({ take: 10 });
  const addresses = await addressRepo.find({ relations: ['user'] });

  if (!clients.length || !sandwichs.length || !timeSlots.length) {
    console.log('⚠️  Données insuffisantes pour créer des commandes');
    return;
  }

  for (let i = 0; i < 10; i++) {
    const client = faker.helpers.arrayElement(clients);
    const timeSlot = faker.helpers.arrayElement(timeSlots);
    const orderType = faker.helpers.arrayElement([
      OrderType.PICKUP,
      OrderType.DELIVERY,
    ]);

    let deliveryAddress: Address | undefined;
    if (orderType === OrderType.DELIVERY) {
      const clientAddresses = addresses.filter((a) => a.user.id === client.id);
      if (clientAddresses.length)
        deliveryAddress = faker.helpers.arrayElement(clientAddresses);
    }

    const order = await orderRepo.save(
      orderRepo.create({
        orderNumber: `CMD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        user: client,
        timeSlot,
        type: orderType,
        status: faker.helpers.arrayElement([
          OrderStatus.CONFIRMED,
          OrderStatus.IN_PREPARATION,
          OrderStatus.READY,
          OrderStatus.COMPLETED,
        ]),
        paymentStatus: PaymentStatus.PAID,
        deliveryAddress,
        subtotal: 0,
        deliveryFee: orderType === OrderType.DELIVERY ? 3.5 : 0,
        total: 0,
        customerNote: faker.helpers.maybe(
          () =>
            faker.helpers.arrayElement([
              'Sans oignons SVP',
              'Bien cuit',
              'Livrer après 13h',
              'Pas de sauce',
            ]),
          { probability: 0.3 },
        ),
      }),
    );

    let subtotal = 0;

    // 1 sandwich + 1 boisson + optionnellement 1 dessert
    const items = [
      faker.helpers.arrayElement(sandwichs),
      faker.helpers.arrayElement(boissons),
      ...(faker.datatype.boolean() && desserts.length
        ? [faker.helpers.arrayElement(desserts)]
        : []),
    ];

    for (const product of items) {
      const quantity = 1;
      const unitPrice = Number(product.basePrice);
      const totalPrice = unitPrice * quantity;

      await orderItemRepo.save(
        orderItemRepo.create({
          order,
          product,
          itemType: 'product',
          quantity,
          unitPrice,
          totalPrice,
        }),
      );

      subtotal += totalPrice;
    }

    order.subtotal = subtotal;
    order.total = subtotal + Number(order.deliveryFee);
    await orderRepo.save(order);

    timeSlot.currentBookings = Math.min(
      timeSlot.currentBookings + 1,
      timeSlot.maxCapacity,
    );
    await timeSlotRepo.save(timeSlot);
  }

  console.log('✅ 10 commandes créées');
}

seed()
  .then(() => {
    console.log('✨ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
