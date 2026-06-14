/**
 * Seed de données de démonstration pour la version déployée (Cloud SQL).
 * Connecte via les variables DB_* du .env racine du projet.
 * Ne touche PAS aux tables user / order / address / time_slot.
 *
 * Usage : npm run seed:prod  (depuis le dossier backend/)
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger le .env racine du projet (3 niveaux au-dessus de database/seeds/)
config({ path: resolve(__dirname, '../../../.env') });

import {
  Product,
  ProductCategory,
} from '../../src/modules/products/entity/product.entity';
import {
  Ingredient,
  IngredientCategory,
} from '../../src/modules/ingredients/entity/ingredient.entity';
import { ProductIngredient } from '../../src/modules/product-ingredients/entity/product-ingredient.entity';
import { Menu } from '../../src/modules/menus/entity/menu.entity';

// ─── Connexion Cloud SQL ───────────────────────────────────────────────────────
const ProdDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [Product, Ingredient, ProductIngredient, Menu],
  synchronize: false,
  logging: false,
});

// ─── Images Unsplash (IDs verifies, coherents avec les produits) ──────────────
const IMG = {
  sandwichAmericain: 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=600&q=80',
  sandwichPoulet:    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
  sandwichHalal:     'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&q=80',
  sandwichVeggie:    'https://images.unsplash.com/photo-1534352211968-8d25dbe0e951?w=600&q=80',
  wrap:              'https://images.unsplash.com/photo-1571331421405-51b8feea1033?w=600&q=80',
  coca:              'https://images.unsplash.com/photo-1554169360-f86ef83314ec?w=600&q=80',
  iceTea:            'https://images.unsplash.com/photo-1598515502231-940301329314?w=600&q=80',
  eau:               'https://images.unsplash.com/photo-1612134678926-7592c521aa52?w=600&q=80',
  jus:               'https://images.unsplash.com/photo-1617108126666-3b4f0251913a?w=600&q=80',
  tiramisu:          'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80',
  cookie:            'https://images.unsplash.com/photo-1598839950984-034f6dc7b495?w=600&q=80',
  brownie:           'https://images.unsplash.com/photo-1566855833528-35bcc17ae9ce?w=600&q=80',
  frites:            'https://images.unsplash.com/photo-1529259266118-cf22737f713f?w=600&q=80',
  menuMidi:          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  menuHealthy:       'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  menuHalal:         'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&q=80',
  menuClassique:     'https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=600&q=80',
};

async function run() {
  console.log('[1/4] Connexion a Cloud SQL...');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   User: ${process.env.DB_USERNAME}`);
  console.log(`   DB:   ${process.env.DB_DATABASE}`);

  await ProdDataSource.initialize();
  console.log('    Connecte.\n');

  await cleanCatalog();
  const ingredients = await seedIngredients();
  const products = await seedProducts(ingredients);
  await seedMenus(products);

  console.log('\n[DONE] Seed prod termine.');
  await ProdDataSource.destroy();
}

// ─── Nettoyage uniquement du catalogue ────────────────────────────────────────
async function cleanCatalog() {
  console.log('[2/4] Nettoyage du catalogue (produits / menus / ingredients)...');
  await ProdDataSource.query(`TRUNCATE TABLE "menu_products" CASCADE`);
  await ProdDataSource.query(`TRUNCATE TABLE "menu" CASCADE`);
  await ProdDataSource.query(`TRUNCATE TABLE "product_ingredient" CASCADE`);
  await ProdDataSource.query(`TRUNCATE TABLE "product" CASCADE`);
  await ProdDataSource.query(`TRUNCATE TABLE "stock_movement" CASCADE`);
  await ProdDataSource.query(`TRUNCATE TABLE "ingredient" CASCADE`);
  console.log('    Catalogue nettoye.');
}

// ─── Ingrédients ───────────────────────────────────────────────────────────────
async function seedIngredients() {
  console.log('[3/4] Creation des ingredients...');
  const repo = ProdDataSource.getRepository(Ingredient);

  const data = [
    // Pains
    {
      name: 'Pain blanc',
      category: IngredientCategory.BREAD,
      currentStock: 200,
      minStock: 30,
      unit: 'pièces',
      costPerUnit: 0.5,
      isAvailable: true,
    },
    {
      name: 'Pain complet',
      category: IngredientCategory.BREAD,
      currentStock: 150,
      minStock: 20,
      unit: 'pièces',
      costPerUnit: 0.6,
      isAvailable: true,
    },
    {
      name: 'Pain ciabatta',
      category: IngredientCategory.BREAD,
      currentStock: 120,
      minStock: 20,
      unit: 'pièces',
      costPerUnit: 0.7,
      isAvailable: true,
    },
    {
      name: 'Tortilla',
      category: IngredientCategory.BREAD,
      currentStock: 100,
      minStock: 15,
      unit: 'pièces',
      costPerUnit: 0.4,
      isAvailable: true,
    },
    // Protéines
    {
      name: 'Jambon',
      category: IngredientCategory.PROTEIN,
      currentStock: 8.0,
      minStock: 1.5,
      unit: 'kg',
      costPerUnit: 8.5,
      isAvailable: true,
    },
    {
      name: 'Poulet halal',
      category: IngredientCategory.PROTEIN,
      currentStock: 8.0,
      minStock: 1.5,
      unit: 'kg',
      costPerUnit: 9.5,
      isAvailable: true,
    },
    {
      name: 'Poulet',
      category: IngredientCategory.PROTEIN,
      currentStock: 8.0,
      minStock: 1.5,
      unit: 'kg',
      costPerUnit: 9.0,
      isAvailable: true,
    },
    {
      name: 'Bacon',
      category: IngredientCategory.PROTEIN,
      currentStock: 4.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 10.0,
      isAvailable: true,
    },
    {
      name: 'Thon',
      category: IngredientCategory.PROTEIN,
      currentStock: 5.0,
      minStock: 1.0,
      unit: 'kg',
      costPerUnit: 7.0,
      isAvailable: true,
    },
    // Fromages
    {
      name: 'Fromage cheddar',
      category: IngredientCategory.CHEESE,
      currentStock: 5.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 7.5,
      isAvailable: true,
    },
    {
      name: 'Mozzarella',
      category: IngredientCategory.CHEESE,
      currentStock: 4.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 8.0,
      isAvailable: true,
    },
    // Légumes
    {
      name: 'Salade',
      category: IngredientCategory.VEGETABLE,
      currentStock: 5.0,
      minStock: 0.8,
      unit: 'kg',
      costPerUnit: 2.5,
      isAvailable: true,
    },
    {
      name: 'Tomate',
      category: IngredientCategory.VEGETABLE,
      currentStock: 6.0,
      minStock: 1.0,
      unit: 'kg',
      costPerUnit: 3.0,
      isAvailable: true,
    },
    {
      name: 'Avocat',
      category: IngredientCategory.VEGETABLE,
      currentStock: 4.0,
      minStock: 0.5,
      unit: 'kg',
      costPerUnit: 6.0,
      isAvailable: true,
    },
    {
      name: 'Oignon rouge',
      category: IngredientCategory.VEGETABLE,
      currentStock: 3.0,
      minStock: 0.3,
      unit: 'kg',
      costPerUnit: 1.5,
      isAvailable: true,
    },
    {
      name: 'Concombre',
      category: IngredientCategory.VEGETABLE,
      currentStock: 3.0,
      minStock: 0.3,
      unit: 'kg',
      costPerUnit: 1.5,
      isAvailable: true,
    },
    {
      name: 'Poivron',
      category: IngredientCategory.VEGETABLE,
      currentStock: 3.0,
      minStock: 0.3,
      unit: 'kg',
      costPerUnit: 2.0,
      isAvailable: true,
    },
    // Sauces
    {
      name: 'Mayonnaise',
      category: IngredientCategory.SAUCE,
      currentStock: 3.0,
      minStock: 0.3,
      unit: 'kg',
      costPerUnit: 4.5,
      isAvailable: true,
    },
    {
      name: 'Sauce harissa',
      category: IngredientCategory.SAUCE,
      currentStock: 2.0,
      minStock: 0.2,
      unit: 'kg',
      costPerUnit: 5.0,
      isAvailable: true,
    },
    {
      name: 'Sauce curry',
      category: IngredientCategory.SAUCE,
      currentStock: 2.0,
      minStock: 0.2,
      unit: 'kg',
      costPerUnit: 5.0,
      isAvailable: true,
    },
    {
      name: 'Moutarde',
      category: IngredientCategory.SAUCE,
      currentStock: 2.0,
      minStock: 0.2,
      unit: 'kg',
      costPerUnit: 3.5,
      isAvailable: true,
    },
    {
      name: 'Pesto',
      category: IngredientCategory.SAUCE,
      currentStock: 1.5,
      minStock: 0.2,
      unit: 'kg',
      costPerUnit: 6.0,
      isAvailable: true,
    },
    // Boissons
    {
      name: 'Coca-Cola (33cl)',
      category: IngredientCategory.OTHER,
      currentStock: 150,
      minStock: 30,
      unit: 'pièces',
      costPerUnit: 0.8,
      isAvailable: true,
    },
    {
      name: 'Ice Tea Pêche (50cl)',
      category: IngredientCategory.OTHER,
      currentStock: 120,
      minStock: 20,
      unit: 'pièces',
      costPerUnit: 0.9,
      isAvailable: true,
    },
    {
      name: 'Eau minérale (50cl)',
      category: IngredientCategory.OTHER,
      currentStock: 120,
      minStock: 20,
      unit: 'pièces',
      costPerUnit: 0.4,
      isAvailable: true,
    },
    {
      name: "Jus d'orange (25cl)",
      category: IngredientCategory.OTHER,
      currentStock: 100,
      minStock: 20,
      unit: 'pièces',
      costPerUnit: 0.7,
      isAvailable: true,
    },
    // Desserts
    {
      name: 'Tiramisu (portion)',
      category: IngredientCategory.OTHER,
      currentStock: 60,
      minStock: 10,
      unit: 'pièces',
      costPerUnit: 2.0,
      isAvailable: true,
    },
    {
      name: 'Cookie choco',
      category: IngredientCategory.OTHER,
      currentStock: 100,
      minStock: 15,
      unit: 'pièces',
      costPerUnit: 0.6,
      isAvailable: true,
    },
    {
      name: 'Brownie',
      category: IngredientCategory.OTHER,
      currentStock: 60,
      minStock: 10,
      unit: 'pièces',
      costPerUnit: 1.0,
      isAvailable: true,
    },
    // Frites
    {
      name: 'Frites (portion)',
      category: IngredientCategory.OTHER,
      currentStock: 200,
      minStock: 30,
      unit: 'pièces',
      costPerUnit: 0.8,
      isAvailable: true,
    },
  ];

  const saved = await repo.save(data.map((d) => repo.create(d)));
  console.log(`    ${saved.length} ingredients crees.`);

  const map: Record<string, Ingredient> = {};
  for (const ing of saved) map[ing.name] = ing;
  return map;
}

// ─── Produits ──────────────────────────────────────────────────────────────────
async function seedProducts(ing: Record<string, Ingredient>) {
  console.log('[4/4] Creation des produits...');

  const productRepo = ProdDataSource.getRepository(Product);
  const piRepo = ProdDataSource.getRepository(ProductIngredient);

  async function make(
    data: Partial<Product>,
    pis: {
      ingredient: Ingredient;
      quantity: number;
      isRequired: boolean;
      extraPrice?: number;
    }[],
  ): Promise<Product> {
    const p = await productRepo.save(productRepo.create(data as Product));
    if (pis.length) {
      await piRepo.save(
        pis.map((pi) =>
          piRepo.create({
            product: p,
            ingredient: pi.ingredient,
            quantity: pi.quantity,
            unit: pi.ingredient.unit,
            isRequired: pi.isRequired,
            extraPrice: pi.extraPrice ?? 0,
          }),
        ),
      );
    }
    return p;
  }

  // ── SANDWICHS ──
  const sandwichAmericain = await make(
    {
      name: 'Sandwich Américain',
      category: ProductCategory.SANDWICH,
      description:
        'Jambon, fromage cheddar, salade, tomate, mayonnaise. Un classique généreux.',
      basePrice: 6.5,
      imageUrl: IMG.sandwichAmericain,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: ing['Pain blanc'], quantity: 1, isRequired: true },
      { ingredient: ing['Jambon'], quantity: 0.1, isRequired: true },
      { ingredient: ing['Fromage cheddar'], quantity: 0.05, isRequired: true },
      { ingredient: ing['Salade'], quantity: 0.03, isRequired: true },
      { ingredient: ing['Tomate'], quantity: 0.04, isRequired: true },
      { ingredient: ing['Mayonnaise'], quantity: 0.02, isRequired: false },
      {
        ingredient: ing['Bacon'],
        quantity: 0.05,
        isRequired: false,
        extraPrice: 1.5,
      },
    ],
  );

  const sandwichHalal = await make(
    {
      name: 'Sandwich Poulet Halal',
      category: ProductCategory.SANDWICH,
      description:
        'Halal - Poulet halal grille, salade, tomate, oignon rouge, harissa maison.',
      basePrice: 7.0,
      imageUrl: IMG.sandwichHalal,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: ing['Pain ciabatta'], quantity: 1, isRequired: true },
      { ingredient: ing['Poulet halal'], quantity: 0.12, isRequired: true },
      { ingredient: ing['Salade'], quantity: 0.03, isRequired: true },
      { ingredient: ing['Tomate'], quantity: 0.04, isRequired: true },
      { ingredient: ing['Oignon rouge'], quantity: 0.03, isRequired: false },
      { ingredient: ing['Sauce harissa'], quantity: 0.02, isRequired: false },
      { ingredient: ing['Mayonnaise'], quantity: 0.02, isRequired: false },
    ],
  );

  const sandwichPoulet = await make(
    {
      name: 'Sandwich Poulet Avocat',
      category: ProductCategory.SANDWICH,
      description:
        'Poulet grillé, avocat frais, salade, tomate, sauce curry. Frais et savoureux.',
      basePrice: 7.5,
      imageUrl: IMG.sandwichPoulet,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: ing['Pain complet'], quantity: 1, isRequired: true },
      { ingredient: ing['Poulet'], quantity: 0.12, isRequired: true },
      { ingredient: ing['Avocat'], quantity: 0.08, isRequired: true },
      { ingredient: ing['Salade'], quantity: 0.03, isRequired: true },
      { ingredient: ing['Sauce curry'], quantity: 0.02, isRequired: false },
      { ingredient: ing['Tomate'], quantity: 0.04, isRequired: false },
    ],
  );

  const sandwichVeggie = await make(
    {
      name: 'Sandwich Végétarien',
      category: ProductCategory.SANDWICH,
      description:
        'Mozzarella, avocat, tomate, concombre, poivron, pesto. 100% végétarien.',
      basePrice: 6.5,
      imageUrl: IMG.sandwichVeggie,
      isActive: true,
      isCustomizable: true,
    },
    [
      { ingredient: ing['Pain complet'], quantity: 1, isRequired: true },
      { ingredient: ing['Mozzarella'], quantity: 0.07, isRequired: true },
      { ingredient: ing['Avocat'], quantity: 0.06, isRequired: true },
      { ingredient: ing['Tomate'], quantity: 0.04, isRequired: true },
      { ingredient: ing['Concombre'], quantity: 0.04, isRequired: false },
      { ingredient: ing['Poivron'], quantity: 0.03, isRequired: false },
      { ingredient: ing['Pesto'], quantity: 0.02, isRequired: false },
    ],
  );

  const wrap = await make(
    {
      name: 'Wrap Poulet Halal',
      category: ProductCategory.SANDWICH,
      description:
        'Halal - Poulet halal, salade, tomate, fromage, sauce curry dans une tortilla croustillante.',
      basePrice: 7.0,
      imageUrl: IMG.wrap,
      isActive: true,
      isCustomizable: false,
    },
    [
      { ingredient: ing['Tortilla'], quantity: 1, isRequired: true },
      { ingredient: ing['Poulet halal'], quantity: 0.12, isRequired: true },
      { ingredient: ing['Salade'], quantity: 0.03, isRequired: true },
      { ingredient: ing['Tomate'], quantity: 0.03, isRequired: true },
      { ingredient: ing['Fromage cheddar'], quantity: 0.04, isRequired: false },
      { ingredient: ing['Sauce curry'], quantity: 0.02, isRequired: false },
    ],
  );

  // ── BOISSONS ──
  const coca = await make(
    {
      name: 'Coca-Cola',
      category: ProductCategory.DRINK,
      description: 'Canette 33cl bien fraîche.',
      basePrice: 2.5,
      imageUrl: IMG.coca,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing['Coca-Cola (33cl)'], quantity: 1, isRequired: true }],
  );

  const iceTea = await make(
    {
      name: 'Ice Tea Pêche',
      category: ProductCategory.DRINK,
      description: 'Bouteille 50cl, saveur pêche.',
      basePrice: 3.0,
      imageUrl: IMG.iceTea,
      isActive: true,
      isCustomizable: false,
    },
    [
      {
        ingredient: ing['Ice Tea Pêche (50cl)'],
        quantity: 1,
        isRequired: true,
      },
    ],
  );

  const eau = await make(
    {
      name: 'Eau minérale',
      category: ProductCategory.DRINK,
      description: 'Bouteille 50cl.',
      basePrice: 2.0,
      imageUrl: IMG.eau,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing['Eau minérale (50cl)'], quantity: 1, isRequired: true }],
  );

  const jus = await make(
    {
      name: "Jus d'orange",
      category: ProductCategory.DRINK,
      description: '100% pur jus, 25cl.',
      basePrice: 2.5,
      imageUrl: IMG.jus,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing["Jus d'orange (25cl)"], quantity: 1, isRequired: true }],
  );

  // ── DESSERTS ──
  const tiramisu = await make(
    {
      name: 'Tiramisu',
      category: ProductCategory.DESSERT,
      description: 'Tiramisu maison, mascarpone et café.',
      basePrice: 4.5,
      imageUrl: IMG.tiramisu,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing['Tiramisu (portion)'], quantity: 1, isRequired: true }],
  );

  const cookie = await make(
    {
      name: 'Cookie',
      category: ProductCategory.DESSERT,
      description: 'Cookie pépites de chocolat, cuit à la commande.',
      basePrice: 2.5,
      imageUrl: IMG.cookie,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing['Cookie choco'], quantity: 1, isRequired: true }],
  );

  const brownie = await make(
    {
      name: 'Brownie',
      category: ProductCategory.DESSERT,
      description: 'Brownie fondant au chocolat noir.',
      basePrice: 3.0,
      imageUrl: IMG.brownie,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing['Brownie'], quantity: 1, isRequired: true }],
  );

  // ── ACCOMPAGNEMENTS ──
  const frites = await make(
    {
      name: 'Frites maison',
      category: ProductCategory.SIDE,
      description: 'Frites fraîches cuites à la commande.',
      basePrice: 3.5,
      imageUrl: IMG.frites,
      isActive: true,
      isCustomizable: false,
    },
    [{ ingredient: ing['Frites (portion)'], quantity: 1, isRequired: true }],
  );

  console.log(
    '    13 produits crees (5 sandwichs, 4 boissons, 3 desserts, 1 accompagnement).',
  );

  return {
    sandwichAmericain,
    sandwichHalal,
    sandwichPoulet,
    sandwichVeggie,
    wrap,
    coca,
    iceTea,
    eau,
    jus,
    tiramisu,
    cookie,
    brownie,
    frites,
  };
}

// ─── Menus ─────────────────────────────────────────────────────────────────────
async function seedMenus(p: Awaited<ReturnType<typeof seedProducts>>) {
  console.log('    Creation des menus...');
  const repo = ProdDataSource.getRepository(Menu);

  const configSandwichDrink = {
    sandwich: { required: true, quantity: 1 },
    drink: { required: true, quantity: 1 },
    dessert: { required: false, quantity: 0 },
    side: { required: false, quantity: 0 },
  };

  const configComplet = {
    sandwich: { required: true, quantity: 1 },
    drink: { required: true, quantity: 1 },
    dessert: { required: true, quantity: 1 },
    side: { required: false, quantity: 0 },
  };

  const configAvecFrites = {
    sandwich: { required: true, quantity: 1 },
    drink: { required: true, quantity: 1 },
    dessert: { required: false, quantity: 0 },
    side: { required: true, quantity: 1 },
  };

  await repo.save([
    repo.create({
      name: 'Menu Midi',
      description: 'Sandwich + Boisson au choix. Idéal pour une pause rapide.',
      price: 9.5,
      imageUrl: IMG.menuMidi,
      isActive: true,
      configuration: configSandwichDrink,
      allowedProducts: [
        p.sandwichAmericain,
        p.sandwichPoulet,
        p.sandwichVeggie,
        p.coca,
        p.iceTea,
        p.eau,
        p.jus,
      ],
    }),
    repo.create({
      name: 'Menu Halal',
      description: 'Sandwich Halal + Boisson + Dessert. Certifie halal.',
      price: 11.5,
      imageUrl: IMG.menuHalal,
      isActive: true,
      configuration: configComplet,
      allowedProducts: [
        p.sandwichHalal,
        p.wrap,
        p.coca,
        p.iceTea,
        p.eau,
        p.jus,
        p.cookie,
        p.brownie,
        p.tiramisu,
      ],
    }),
    repo.create({
      name: 'Menu Healthy',
      description:
        'Sandwich Poulet Avocat ou Végétarien + Jus + Dessert. Léger et équilibré.',
      price: 12.0,
      imageUrl: IMG.menuHealthy,
      isActive: true,
      configuration: configComplet,
      allowedProducts: [
        p.sandwichPoulet,
        p.sandwichVeggie,
        p.jus,
        p.eau,
        p.tiramisu,
        p.brownie,
      ],
    }),
    repo.create({
      name: 'Menu Classique',
      description:
        'Sandwich + Frites maison + Boisson. Le combo incontournable.',
      price: 12.5,
      imageUrl: IMG.menuClassique,
      isActive: true,
      configuration: configAvecFrites,
      allowedProducts: [
        p.sandwichAmericain,
        p.sandwichPoulet,
        p.sandwichHalal,
        p.sandwichVeggie,
        p.frites,
        p.coca,
        p.iceTea,
        p.eau,
        p.jus,
      ],
    }),
  ]);

  console.log(
    '    4 menus crees (Midi 9.50, Halal 11.50, Healthy 12.00, Classique 12.50).',
  );
}

run().catch((err) => {
  console.error('[ERROR] Seed prod :', err);
  process.exit(1);
});
