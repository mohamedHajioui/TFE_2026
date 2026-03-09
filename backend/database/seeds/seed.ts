import { faker } from '@faker-js/faker';
import { User } from '../../src/modules/users/entity/user.entity';
import { Product, ProductCategory } from '../../src/modules/products/entity/product.entity';
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
import {
  OrderItem,
  ProductCustomization,
} from '../../src/modules/order-item/entity/order-item.entity';
import { Address } from '../../src/modules/adress/entity/address.entity';
import { CryptoUtil } from '../../src/common/utils/crypto.util';
import { AppDataSource } from '../data-source';
import { UserRole } from '../../src/modules/users/enums/user-role.enum';

/**
 * Script de seeding - VERSION ALLÉGÉE
 */
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

/**
 * Nettoyer la base de données
 */
async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');

  const entities = [
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

/**
 * Créer des utilisateurs de test
 */
async function createUsers() {
  console.log('👥 Création des utilisateurs...');

  const userRepo = AppDataSource.getRepository(User);

  // Admin
  const admin = userRepo.create({
    email: 'admin@sandwicherie.be',
    displayName: 'Admin',
    passwordHash: await CryptoUtil.hashPassword('Admin123!'),
    phoneNumber: '+32470123456',
    role: UserRole.ADMIN,
    isActive: true,
  });

  // Employé
  const employee = userRepo.create({
    email: 'employee@sandwicherie.be',
    displayName: 'Employé',
    passwordHash: await CryptoUtil.hashPassword('Employee123!'),
    phoneNumber: '+32471234567',
    role: UserRole.EMPLOYEE,
    isActive: true,
  });

  // Client test
  const client = userRepo.create({
    email: 'client@test.be',
    displayName: 'Client Test',
    passwordHash: await CryptoUtil.hashPassword('Client123!'),
    phoneNumber: '+32472345678',
    role: UserRole.CLIENT,
    isActive: true,
  });

  // 3 clients aléatoires (au lieu de 10)
  const randomClients: User[] = [];
  for (let i = 0; i < 3; i++) {
    const randomClient = userRepo.create({
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      passwordHash: await CryptoUtil.hashPassword('Password123!'),
      phoneNumber: `+3247${faker.string.numeric(7)}`,
      role: UserRole.CLIENT,
      isActive: true,
    });
    randomClients.push(randomClient);
  }

  await userRepo.save([admin, employee, client, ...randomClients]);

  console.log('✅ Utilisateurs créés :');
  console.log('   - Admin: admin@sandwicherie.be / Admin123!');
  console.log('   - Employé: employee@sandwicherie.be / Employee123!');
  console.log('   - Client: client@test.be / Client123!');
  console.log(`   - ${randomClients.length} clients aléatoires`);
}

/**
 * Créer des ingrédients (divisé par 2)
 */
async function createIngredients() {
  console.log('🥬 Création des ingrédients...');

  const ingredientRepo = AppDataSource.getRepository(Ingredient);

  const ingredientsData = [
    // Pains (2 au lieu de 3)
    {
      name: 'Pain blanc',
      category: IngredientCategory.BREAD,
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      unit: 'pièces',
      costPerUnit: 0.5,
      isAvailable: true,
    },
    {
      name: 'Pain complet',
      category: IngredientCategory.BREAD,
      currentStock: 40,
      minStock: 10,
      maxStock: 80,
      unit: 'pièces',
      costPerUnit: 0.6,
      isAvailable: true,
    },

    // Protéines (3 au lieu de 4)
    {
      name: 'Jambon',
      category: IngredientCategory.PROTEIN,
      currentStock: 3.0,
      minStock: 0.5,
      maxStock: 5.0,
      unit: 'kg',
      costPerUnit: 8.5,
      isAvailable: true,
    },
    {
      name: 'Poulet',
      category: IngredientCategory.PROTEIN,
      currentStock: 2.5,
      minStock: 0.5,
      maxStock: 4.0,
      unit: 'kg',
      costPerUnit: 9.0,
      isAvailable: true,
    },
    {
      name: 'Bacon',
      category: IngredientCategory.PROTEIN,
      currentStock: 1.5,
      minStock: 0.3,
      maxStock: 3.0,
      unit: 'kg',
      costPerUnit: 10.0,
      isAvailable: true,
    },

    // Fromages (1 au lieu de 2)
    {
      name: 'Fromage cheddar',
      category: IngredientCategory.CHEESE,
      currentStock: 2.0,
      minStock: 0.5,
      maxStock: 3.0,
      unit: 'kg',
      costPerUnit: 7.5,
      isAvailable: true,
    },

    // Légumes (3 au lieu de 5)
    {
      name: 'Salade',
      category: IngredientCategory.VEGETABLE,
      currentStock: 2.0,
      minStock: 0.5,
      maxStock: 4.0,
      unit: 'kg',
      costPerUnit: 2.5,
      isAvailable: true,
    },
    {
      name: 'Tomate',
      category: IngredientCategory.VEGETABLE,
      currentStock: 2.5,
      minStock: 0.8,
      maxStock: 5.0,
      unit: 'kg',
      costPerUnit: 3.0,
      isAvailable: true,
    },
    {
      name: 'Avocat',
      category: IngredientCategory.VEGETABLE,
      currentStock: 1.0,
      minStock: 0.3,
      maxStock: 2.0,
      unit: 'kg',
      costPerUnit: 6.0,
      isAvailable: true,
    },

    // Sauces (1 au lieu de 3)
    {
      name: 'Mayonnaise',
      category: IngredientCategory.SAUCE,
      currentStock: 1.0,
      minStock: 0.3,
      maxStock: 2.0,
      unit: 'litres',
      costPerUnit: 4.5,
      isAvailable: true,
    },
  ];

  const ingredients = ingredientsData.map((data) => ingredientRepo.create(data));
  const savedIngredients = await ingredientRepo.save(ingredients);

  console.log(`✅ ${savedIngredients.length} ingrédients créés`);
  return savedIngredients;
}

/**
 * Créer des produits (divisé par 2)
 */
async function createProducts() {
  console.log('🍔 Création des produits...');

  const productRepo = AppDataSource.getRepository(Product);
  const ingredientRepo = AppDataSource.getRepository(Ingredient);
  const productIngredientRepo = AppDataSource.getRepository(ProductIngredient);

  // Récupérer les ingrédients
  const painBlanc = await ingredientRepo.findOneBy({ name: 'Pain blanc' });
  const painComplet = await ingredientRepo.findOneBy({ name: 'Pain complet' });
  const jambon = await ingredientRepo.findOneBy({ name: 'Jambon' });
  const fromage = await ingredientRepo.findOneBy({ name: 'Fromage cheddar' });
  const salade = await ingredientRepo.findOneBy({ name: 'Salade' });
  const tomate = await ingredientRepo.findOneBy({ name: 'Tomate' });
  const bacon = await ingredientRepo.findOneBy({ name: 'Bacon' });
  const poulet = await ingredientRepo.findOneBy({ name: 'Poulet' });
  const avocat = await ingredientRepo.findOneBy({ name: 'Avocat' });
  const mayo = await ingredientRepo.findOneBy({ name: 'Mayonnaise' });

  if (!painBlanc || !jambon || !fromage || !salade || !tomate || !bacon) {
    throw new Error('Certains ingrédients sont manquants');
  }

  // Produit 1 : Sandwich Américain
  const sandwichAmericain = productRepo.create({
    name: 'Sandwich Américain',
    category: ProductCategory.SANDWICH,
    description: 'Pain blanc, jambon, fromage, salade, tomate',
    basePrice: 6.5,
    isActive: true,
    isCustomizable: true,
  });
  await productRepo.save(sandwichAmericain);

  const americainIngredients = [
    productIngredientRepo.create({
      product: sandwichAmericain,
      ingredient: painBlanc,
      quantity: 1,
      unit: 'pièce',
      isRequired: true,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichAmericain,
      ingredient: jambon,
      quantity: 100,
      unit: 'grammes',
      isRequired: true,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichAmericain,
      ingredient: fromage,
      quantity: 50,
      unit: 'grammes',
      isRequired: false,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichAmericain,
      ingredient: salade,
      quantity: 30,
      unit: 'grammes',
      isRequired: false,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichAmericain,
      ingredient: tomate,
      quantity: 40,
      unit: 'grammes',
      isRequired: false,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichAmericain,
      ingredient: bacon,
      quantity: 50,
      unit: 'grammes',
      isRequired: false,
      extraPrice: 1.5,
    }),
  ];

  await productIngredientRepo.save(americainIngredients);

  // Produit 2 : Sandwich Poulet Avocat
  if (!painComplet || !poulet || !avocat || !mayo) {
    throw new Error('Certains ingrédients sont manquants');
  }

  const sandwichPoulet = productRepo.create({
    name: 'Sandwich Poulet Avocat',
    category: ProductCategory.SANDWICH,
    description: 'Pain complet, poulet grillé, avocat, salade',
    basePrice: 7.5,
    isActive: true,
    isCustomizable: true,
  });
  await productRepo.save(sandwichPoulet);

  const pouletIngredients = [
    productIngredientRepo.create({
      product: sandwichPoulet,
      ingredient: painComplet,
      quantity: 1,
      unit: 'pièce',
      isRequired: true,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichPoulet,
      ingredient: poulet,
      quantity: 120,
      unit: 'grammes',
      isRequired: true,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichPoulet,
      ingredient: avocat,
      quantity: 60,
      unit: 'grammes',
      isRequired: true,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichPoulet,
      ingredient: salade,
      quantity: 30,
      unit: 'grammes',
      isRequired: false,
      extraPrice: 0,
    }),
    productIngredientRepo.create({
      product: sandwichPoulet,
      ingredient: mayo,
      quantity: 20,
      unit: 'ml',
      isRequired: false,
      extraPrice: 0,
    }),
  ];

  await productIngredientRepo.save(pouletIngredients);

  // Boissons (3 au lieu de 6)
  const boissonsData = [
    {
      name: 'Coca-Cola',
      category: ProductCategory.DRINK,
      description: 'Canette 33cl',
      basePrice: 2.5,
      isActive: true,
      isCustomizable: false,
    },
    {
      name: 'Ice Tea Pêche',
      category: ProductCategory.DRINK,
      description: 'Bouteille 50cl',
      basePrice: 3.0,
      isActive: true,
      isCustomizable: false,
    },
    {
      name: 'Eau minérale',
      category: ProductCategory.DRINK,
      description: 'Bouteille 50cl',
      basePrice: 2.0,
      isActive: true,
      isCustomizable: false,
    },
  ];

  const boissons = boissonsData.map((data) => productRepo.create(data));
  await productRepo.save(boissons);

  // Desserts (2 au lieu de 3)
  const dessertsData = [
    {
      name: 'Tiramisu',
      category: ProductCategory.DESSERT,
      description: 'Tiramisu maison',
      basePrice: 4.5,
      isActive: true,
      isCustomizable: false,
    },
    {
      name: 'Cookie',
      category: ProductCategory.DESSERT,
      description: 'Cookie aux pépites de chocolat',
      basePrice: 2.5,
      isActive: true,
      isCustomizable: false,
    },
  ];

  const desserts = dessertsData.map((data) => productRepo.create(data));
  await productRepo.save(desserts);

  console.log('✅ Produits créés :');
  console.log('   - 2 sandwichs personnalisables');
  console.log('   - 3 boissons');
  console.log('   - 2 desserts');
}

/**
 * Créer des menus (2 au lieu de 4)
 */
async function createMenus() {
  console.log('🍱 Création des menus...');

  const menuRepo = AppDataSource.getRepository(Menu);
  const productRepo = AppDataSource.getRepository(Product);

  const sandwichAmericain = await productRepo.findOneBy({
    name: 'Sandwich Américain',
  });
  const sandwichPoulet = await productRepo.findOneBy({
    name: 'Sandwich Poulet Avocat',
  });
  const coca = await productRepo.findOneBy({ name: 'Coca-Cola' });
  const iceTea = await productRepo.findOneBy({ name: 'Ice Tea Pêche' });
  const tiramisu = await productRepo.findOneBy({ name: 'Tiramisu' });
  const cookie = await productRepo.findOneBy({ name: 'Cookie' });

  if (!sandwichAmericain || !sandwichPoulet || !coca || !tiramisu || !cookie || !iceTea) {
    throw new Error('Certains produits sont manquants');
  }

  // Menu 1 : Menu Midi
  const menuMidi = menuRepo.create({
    name: 'Menu Midi',
    description: 'Sandwich Américain + Boisson + Cookie',
    price: 10.0,
    isActive: true,
    allowedProducts: [sandwichAmericain, coca, cookie],
    configuration: {
      sandwich: { required: true, quantity: 1 },
      drink: { required: true, quantity: 1 },
      dessert: { required: true, quantity: 1 },
      side: { required: false, quantity: 0 },
    },
  });

  // Menu 2 : Menu Healthy
  const menuHealthy = menuRepo.create({
    name: 'Menu Healthy',
    description: 'Sandwich Poulet Avocat + Ice Tea + Tiramisu',
    price: 12.5,
    isActive: true,
    allowedProducts: [sandwichPoulet, iceTea, tiramisu],
    configuration: {
      sandwich: { required: true, quantity: 1 },
      drink: { required: true, quantity: 1 },
      dessert: { required: true, quantity: 1 },
      side: { required: false, quantity: 0 },
    },
  });

  await menuRepo.save([menuMidi, menuHealthy]);

  console.log('✅ Menus créés :');
  console.log('   - Menu Midi (10.00€)');
  console.log('   - Menu Healthy (12.50€)');
}

/**
 * Créer des créneaux horaires (3 jours au lieu de 7)
 */
async function createTimeSlots() {
  console.log('⏰ Création des créneaux horaires...');

  const timeSlotRepo = AppDataSource.getRepository(TimeSlot);

  const slots: TimeSlot[] = [];
  const today = new Date();

  // Créer des créneaux pour les 3 prochains jours
  for (let day = 0; day < 3; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    // Créneaux de 12h à 14h (4 créneaux au lieu de 6)
    const midaySlots = [
      { start: '12:00', end: '12:30' },
      { start: '12:30', end: '13:00' },
      { start: '13:00', end: '13:30' },
      { start: '13:30', end: '14:00' },
    ];

    // Créneaux de 18h30 à 20h30 (4 créneaux au lieu de 6)
    const eveningSlots = [
      { start: '18:30', end: '19:00' },
      { start: '19:00', end: '19:30' },
      { start: '19:30', end: '20:00' },
      { start: '20:00', end: '20:30' },
    ];

    const allSlots = [...midaySlots, ...eveningSlots];

    for (const slot of allSlots) {
      const timeSlot = timeSlotRepo.create({
        date: dateStr,
        startTime: slot.start,
        endTime: slot.end,
        maxCapacity: 10,
        currentBookings: 0,
        isAvailable: true,
      });
      slots.push(timeSlot);
    }
  }

  await timeSlotRepo.save(slots);

  console.log(`✅ ${slots.length} créneaux horaires créés (3 jours)`);
}

/**
 * Créer des adresses (divisé par 2)
 */
async function createAddresses() {
  console.log('📍 Création des adresses...');

  const addressRepo = AppDataSource.getRepository(Address);
  const userRepo = AppDataSource.getRepository(User);

  const clients = await userRepo.find({
    where: { role: UserRole.CLIENT },
  });

  if (clients.length === 0) {
    console.log('⚠️  Aucun client trouvé');
    return;
  }

  const addresses: Address[] = [];

  // 1 adresse par client (au lieu de 1-2)
  for (const client of clients) {
    const address = addressRepo.create({
      user: client,
      street: faker.location.streetAddress(),
      number: faker.number.int({ min: 1, max: 999 }).toString(),
      postalCode: faker.helpers.arrayElement(['1000', '1050', '1070', '1200']),
      city: 'Bruxelles',
      country: 'Belgium',
      label: 'Domicile',
      complement: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['Code porte: 1234', '2ème étage', 'Sonnette à gauche']),
        { probability: 0.3 },
      ),
    });

    addresses.push(address);
  }

  await addressRepo.save(addresses);

  console.log(`${addresses.length} adresses créées pour ${clients.length} clients`);
}

/**
 * Créer des commandes (12 au lieu de 25)
 */
async function createOrders() {
  console.log('📦 Création des commandes...');

  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const timeSlotRepo = AppDataSource.getRepository(TimeSlot);
  const addressRepo = AppDataSource.getRepository(Address);

  const clients = await userRepo.find({ where: { role: UserRole.CLIENT } });
  const products = await productRepo.find({ where: { isActive: true } });
  const timeSlots = await timeSlotRepo.find({ take: 15 });
  const addresses = await addressRepo.find({ relations: ['user'] });

  if (clients.length === 0 || products.length === 0 || timeSlots.length === 0) {
    console.log('⚠️  Données insuffisantes');
    return;
  }

  // Créer 12 commandes
  for (let i = 0; i < 12; i++) {
    const client = faker.helpers.arrayElement(clients);
    const timeSlot = faker.helpers.arrayElement(timeSlots);
    const orderType = faker.helpers.arrayElement([OrderType.PICKUP, OrderType.DELIVERY]);

    let deliveryAddress: Address | undefined = undefined;
    if (orderType === OrderType.DELIVERY) {
      const clientAddresses = addresses.filter((a) => a.user.id === client.id);
      if (clientAddresses.length > 0) {
        deliveryAddress = faker.helpers.arrayElement(clientAddresses);
      }
    }

    const order = orderRepo.create({
      orderNumber: `CMD-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`,
      user: client,
      timeSlot,
      type: orderType,
      status: faker.helpers.arrayElement([
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.IN_PREPARATION,
        OrderStatus.READY,
        OrderStatus.COMPLETED,
      ]),
      paymentStatus: faker.helpers.weightedArrayElement([
        { value: PaymentStatus.PAID, weight: 8 },
        { value: PaymentStatus.PENDING, weight: 2 },
      ]),
      deliveryAddress,
      subtotal: 0,
      deliveryFee: orderType === OrderType.DELIVERY ? 3.5 : 0,
      total: 0,
      customerNote: faker.helpers.maybe(
        () => faker.helpers.arrayElement(['Sans oignons SVP', 'Bien cuit', 'Livrer après 13h']),
        { probability: 0.3 },
      ),
    });

    await orderRepo.save(order);

    // 2-3 produits par commande (au lieu de 1-4)
    const numItems = faker.number.int({ min: 2, max: 3 });
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 2 });
      const unitPrice = product.basePrice;

      let customization: ProductCustomization | undefined = undefined;
      let totalPrice = unitPrice * quantity;

      if (product.isCustomizable && product.category === ProductCategory.SANDWICH) {
        const hasCustomization = faker.datatype.boolean();
        if (hasCustomization) {
          customization = {
            removed: faker.helpers.maybe(() => [faker.number.int({ min: 1, max: 5 })], {
              probability: 0.3,
            }),
            extra: faker.helpers.maybe(() => [faker.number.int({ min: 1, max: 10 })], {
              probability: 0.4,
            }),
          };

          if (customization && customization.extra) {
            totalPrice += 1.5 * quantity;
          }
        }
      }

      const orderItem = orderItemRepo.create({
        order,
        product,
        itemType: 'product',
        quantity,
        unitPrice,
        totalPrice,
        customization,
      });

      await orderItemRepo.save(orderItem);
      subtotal += totalPrice;
    }

    order.subtotal = subtotal;
    order.total = subtotal + order.deliveryFee;
    await orderRepo.save(order);

    timeSlot.currentBookings += 1;
    await timeSlotRepo.save(timeSlot);
  }

  console.log('✅ Commandes créées :');
  console.log('   - 12 commandes aléatoires');
}

// Exécuter
seed()
  .then(() => {
    console.log('✨ Terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
