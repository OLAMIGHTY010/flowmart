const path = require('path');
const root = path.resolve(__dirname, '..');
require(path.join(root, 'node_modules/dotenv')).config({ path: path.join(root, '.env') });
const { Pool } = require(path.join(root, 'node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const VENDOR_ID = '242dbfa1-19f7-426e-a8a9-0336113dd745'; // Primary test vendor (Mama Put / Rea Kelly)

const CATEGORIES_DATA = [
  { name: 'Grains & Bulk Staples', slug: 'grains-staples', iconUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100' },
  { name: 'Oils & Condiments', slug: 'oils-condiments', iconUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100' },
  { name: 'Fresh Produce & Tubers', slug: 'fresh-produce', iconUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100' },
  { name: 'Packaged Foods & Provisions', slug: 'packaged-provisions', iconUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100' },
  { name: 'Meat, Fish & Poultry', slug: 'meat-proteins', iconUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=100' },
  { name: 'Prepared Meals & Kitchen', slug: 'food-catering', iconUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100' },
  { name: 'Drinks & Beverages', slug: 'drinks-beverages', iconUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=100' },
  { name: 'Household & Cleaning', slug: 'household-essentials', iconUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=100' },
];

const COMMODITIES_DATA = [
  // ═══ 1. GRAINS & BULK STAPLES ═══
  {
    categorySlug: 'grains-staples',
    name: '50kg Royal Stallion Long Grain Rice',
    sku: 'GRN-RIC-50KG-01',
    brand: 'Royal Stallion',
    weight: 50.0,
    price: 88000.0,
    oldPrice: 94000.0,
    stockQuantity: 120,
    productType: 'grocery',
    description: 'Premium quality polished long grain parboiled rice in original sealed 50kg jute sack. Stone-free, clean grain for commercial catering and bulk household supply.',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'grains-staples',
    name: '25kg Mama Gold Thai Parboiled Rice',
    sku: 'GRN-RIC-25KG-02',
    brand: 'Mama Gold',
    weight: 25.0,
    price: 46500.0,
    oldPrice: 49000.0,
    stockQuantity: 240,
    productType: 'grocery',
    description: 'High grade 25kg bag of Mama Gold Thai parboiled long grain rice. Clean, non-sticky and fast cooking.',
    images: ['https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'grains-staples',
    name: '100kg Bag of White Garri (Ijebu Special)',
    sku: 'GRN-GAR-100K-03',
    brand: 'Ijebu Local Farm',
    weight: 100.0,
    price: 52000.0,
    oldPrice: 56000.0,
    stockQuantity: 85,
    productType: 'grocery',
    description: 'Original sour taste crispy Ijebu garri, finely sieved and free of sand or impurities. Ideal for soaking and eba preparation.',
    images: ['https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'grains-staples',
    name: '100kg Bag of Yellow Honey Beans (Oloyin)',
    sku: 'GRN-BNS-100K-04',
    brand: 'Kano Harvest',
    weight: 100.0,
    price: 115000.0,
    oldPrice: 125000.0,
    stockQuantity: 45,
    productType: 'grocery',
    description: 'Naturally sweet yellow honey beans (Ewa Oloyin) direct from Northern farm warehouses. Zero weevil infestation, clean sorted bag.',
    images: ['https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'grains-staples',
    name: '50kg Golden Penny Semovita',
    sku: 'GRN-SMO-50KG-05',
    brand: 'Golden Penny',
    weight: 50.0,
    price: 48000.0,
    oldPrice: 51500.0,
    stockQuantity: 160,
    productType: 'grocery',
    description: 'Fortified high-fiber semovita wheat flour. Smooth, lump-free swallow loved across Nigerian households.',
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'grains-staples',
    name: '50kg Dangote Refined Pure White Sugar',
    sku: 'GRN-SGR-50KG-06',
    brand: 'Dangote',
    weight: 50.0,
    price: 41000.0,
    oldPrice: 44000.0,
    stockQuantity: 95,
    productType: 'grocery',
    description: '100% fine granulated pure cane white sugar in moisture-proof 50kg bag. Essential for bakeries, restaurants, and wholesale retail.',
    images: ['https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'grains-staples',
    name: '50kg Bag of Dried Yellow Maize (Corn)',
    sku: 'GRN-CRN-50KG-07',
    brand: 'Northern Agro',
    weight: 50.0,
    price: 42000.0,
    oldPrice: 45000.0,
    stockQuantity: 70,
    productType: 'grocery',
    description: 'Sun-dried high protein yellow corn suitable for ogi, animal feed processing, or flour milling.',
    images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },

  // ═══ 2. OILS & CONDIMENTS ═══
  {
    categorySlug: 'oils-condiments',
    name: '25 Litres Kings Pure Vegetable Cooking Oil',
    sku: 'OIL-KNG-25LT-08',
    brand: 'Kings',
    weight: 23.5,
    price: 48500.0,
    oldPrice: 52000.0,
    stockQuantity: 180,
    productType: 'grocery',
    description: 'Cholesterol-free, vitamin A fortified pure vegetable cooking oil in heavy-duty yellow jerrycan. Ideal for commercial frying and daily family meals.',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'oils-condiments',
    name: '25 Litres Okomu Pure Palm Oil (Keg)',
    sku: 'OIL-PLM-25LT-09',
    brand: 'Okomu',
    weight: 24.0,
    price: 44000.0,
    oldPrice: 47500.0,
    stockQuantity: 110,
    productType: 'grocery',
    description: 'Pure unadulterated red palm oil directly from Edo oil palm plantations. Deep rich aroma, low free-fatty-acid content, completely unbleached.',
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'oils-condiments',
    name: 'Carton of Gino Pepper & Onion Sachet Tomato Paste (70g x 50)',
    sku: 'CND-GNO-70GX-10',
    brand: 'Gino',
    weight: 3.5,
    price: 14200.0,
    oldPrice: 15500.0,
    stockQuantity: 300,
    productType: 'grocery',
    description: 'Triple concentrated rich red tomato paste with scotch bonnet pepper and sweet onions. 50 easy-tear sachets per pack.',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'oils-condiments',
    name: 'Carton of Maggi Star Seasoning Cubes (100 packets)',
    sku: 'CND-MGG-100P-11',
    brand: 'Nestle Maggi',
    weight: 4.0,
    price: 22500.0,
    oldPrice: 24000.0,
    stockQuantity: 150,
    productType: 'grocery',
    description: 'Iodized iconic Maggi Star seasoning cubes made with fermented soybeans. Enhances taste of jollof, stews, and soups.',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'oils-condiments',
    name: '50kg Dangote Iodized Pure Fine Table Salt',
    sku: 'CND-SLT-50KG-12',
    brand: 'Dangote',
    weight: 50.0,
    price: 18500.0,
    oldPrice: 20000.0,
    stockQuantity: 80,
    productType: 'grocery',
    description: 'High-purity vacuum dried edible fine table salt fortified with iodine.',
    images: ['https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },

  // ═══ 3. FRESH PRODUCE & TUBERS ═══
  {
    categorySlug: 'fresh-produce',
    name: 'Large Basket of Fresh Red Tomatoes (Derica / Jumbo)',
    sku: 'FSH-TOM-BSKT-13',
    brand: 'Mile 12 Direct',
    weight: 35.0,
    price: 38000.0,
    oldPrice: 42000.0,
    stockQuantity: 40,
    productType: 'food',
    description: 'Firm, fresh Jos & Kano plum tomatoes. Zero rot, sorted same-day from arrival trucks.',
    images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'fresh-produce',
    name: '50kg Bundle of New Benue Yams (20 Large Tubers)',
    sku: 'FSH-YAM-20TB-14',
    brand: 'Zaki Biam Farms',
    weight: 50.0,
    price: 35000.0,
    oldPrice: 39000.0,
    stockQuantity: 55,
    productType: 'food',
    description: '20 dry, sweet white yam tubers from Benue State. Excellent for pounding and frying.',
    images: ['https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'fresh-produce',
    name: '50kg Bag of Fresh Red Bell Peppers (Tatase)',
    sku: 'FSH-PEP-50KG-15',
    brand: 'Kaduna Farms',
    weight: 50.0,
    price: 28000.0,
    oldPrice: 31000.0,
    stockQuantity: 30,
    productType: 'food',
    description: 'Large fleshy sweet bell peppers for deep red party jollof and obe ata stews.',
    images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'fresh-produce',
    name: '50kg Bag of Red Onions (Kano Special)',
    sku: 'FSH-ONN-50KG-16',
    brand: 'Kano Agro',
    weight: 50.0,
    price: 45000.0,
    oldPrice: 49000.0,
    stockQuantity: 65,
    productType: 'food',
    description: 'Spicy dry red bulb onions in ventilated mesh bag. Long storage life.',
    images: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },

  // ═══ 4. PACKAGED FOODS & PROVISIONS ═══
  {
    categorySlug: 'packaged-provisions',
    name: 'Carton of Indomie Instant Noodles (Hungry Man 180g x 24)',
    sku: 'PRV-IND-180G-17',
    brand: 'Indomie',
    weight: 4.3,
    price: 16800.0,
    oldPrice: 18000.0,
    stockQuantity: 320,
    productType: 'grocery',
    description: 'Original Onion Chicken flavor Hungry Man size noodles. 24 packs per carton.',
    images: ['https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'packaged-provisions',
    name: 'Carton of Peak Evaporated Milk (160g x 48 Tins)',
    sku: 'PRV-PEK-160G-18',
    brand: 'Peak Milk',
    weight: 7.7,
    price: 39000.0,
    oldPrice: 42000.0,
    stockQuantity: 110,
    productType: 'grocery',
    description: 'Full cream evaporated milk rich in vitamins A & D. 48 easy-open tins per carton.',
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'packaged-provisions',
    name: 'Carton of Titus Sardines in Vegetable Oil (50 Tins)',
    sku: 'PRV-TTS-50TN-19',
    brand: 'Titus',
    weight: 6.2,
    price: 46000.0,
    oldPrice: 49500.0,
    stockQuantity: 90,
    productType: 'grocery',
    description: 'Authentic Portuguese wild caught sardines in pure soybean oil with omega-3 fatty acids.',
    images: ['https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'packaged-provisions',
    name: 'Carton of Milo Chocolate Drink (500g Tin x 12)',
    sku: 'PRV-MLO-500G-20',
    brand: 'Nestle Milo',
    weight: 6.0,
    price: 42000.0,
    oldPrice: 45000.0,
    stockQuantity: 75,
    productType: 'grocery',
    description: 'Nourishing malt chocolate beverage with Activ-Go micronutrients for champions.',
    images: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },

  // ═══ 5. MEAT, FISH & POULTRY ═══
  {
    categorySlug: 'meat-proteins',
    name: '10kg Carton of Imported Turkey Wings',
    sku: 'PRT-TRK-10KG-21',
    brand: 'EuroFrozen',
    weight: 10.0,
    price: 38500.0,
    oldPrice: 41000.0,
    stockQuantity: 140,
    productType: 'food',
    description: 'Flash-frozen meaty turkey wings in 10kg master carton. Grade A certified cold-chain handled.',
    images: ['https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'meat-proteins',
    name: '10kg Carton of Hard Chicken Quarters (Laps)',
    sku: 'PRT-CHK-10KG-22',
    brand: 'EuroFrozen',
    weight: 10.0,
    price: 31000.0,
    oldPrice: 34000.0,
    stockQuantity: 200,
    productType: 'food',
    description: 'Firm, flavorful hard chicken quarters for party catering and family stews.',
    images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'meat-proteins',
    name: '10kg Carton of Jumbo Croaker Fish',
    sku: 'PRT-CRK-10KG-23',
    brand: 'Atlantic Frozen',
    weight: 10.0,
    price: 42000.0,
    oldPrice: 46000.0,
    stockQuantity: 80,
    productType: 'food',
    description: 'Large size sea-caught croaker fish. Scaled and gutted cleanly, perfect for grilling and pepper soup.',
    images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'meat-proteins',
    name: '5 Crates of Fresh Large Farm Eggs (150 Eggs)',
    sku: 'PRT-EGG-5CRT-24',
    brand: 'Otta Golden Farms',
    weight: 10.0,
    price: 24000.0,
    oldPrice: 26000.0,
    stockQuantity: 120,
    productType: 'food',
    description: '5 sturdy paper crates containing 30 large brown eggs each. Same-day collected, zero breakage.',
    images: ['https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },

  // ═══ 6. PREPARED MEALS & KITCHEN SPECIALTIES ═══
  {
    categorySlug: 'food-catering',
    name: 'Smokey Party Jollof Platter with 2 Jumbo Chicken & Dodo',
    sku: 'KIT-JLF-PLT-25',
    brand: 'Mama Put Special',
    weight: 1.5,
    price: 4800.0,
    oldPrice: 5500.0,
    stockQuantity: 50,
    productType: 'food',
    preparationTime: 20,
    description: 'Firewood-cooked authentic Nigerian smokey jollof rice served with 2 crispy chicken quarters and fried plantain chips.',
    images: ['https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'food-catering',
    name: 'Special Fried Rice & Crispy Southern Chicken Box',
    sku: 'KIT-FRD-BOX-26',
    brand: 'Mama Put Special',
    weight: 1.4,
    price: 5200.0,
    oldPrice: 5800.0,
    stockQuantity: 40,
    productType: 'food',
    preparationTime: 20,
    description: 'Stir-fried rice loaded with sweet peas, liver bits, carrots, and sweetcorn with golden southern fried chicken.',
    images: ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'food-catering',
    name: 'Traditional Egusi Soup with Assorted Goat Meat & Semo',
    sku: 'KIT-EGS-SEM-27',
    brand: 'Mama Put Special',
    weight: 1.6,
    price: 4500.0,
    oldPrice: 5000.0,
    stockQuantity: 35,
    productType: 'food',
    preparationTime: 25,
    description: 'Melon seed soup simmered with stockfish, dry catfish, bitterleaf and chunky cuts of tender goat meat served with piping hot semo.',
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'food-catering',
    name: 'Flame Grilled Beef Suya Platter with Sliced Onions & Cabbage',
    sku: 'KIT-SYA-PLT-28',
    brand: 'Mama Put Special',
    weight: 0.8,
    price: 4000.0,
    oldPrice: 4500.0,
    stockQuantity: 60,
    productType: 'food',
    preparationTime: 15,
    description: 'Tender strips of grilled beef marinated in roasted peanut kuli-kuli spices, served with fresh red onions and tomatoes in foil wrap.',
    images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },

  // ═══ 7. DRINKS & BEVERAGES ═══
  {
    categorySlug: 'drinks-beverages',
    name: 'Pack of Chilled Malta Guinness Cans (330ml x 24 Cans)',
    sku: 'DRK-MLT-24CN-29',
    brand: 'Guinness Nigeria',
    weight: 8.5,
    price: 15600.0,
    oldPrice: 17000.0,
    stockQuantity: 190,
    productType: 'grocery',
    description: 'Full case of 24 cans of premium non-alcoholic malt beverage rich in B vitamins and cane sugar.',
    images: ['https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80'],
    isSponsored: true
  },
  {
    categorySlug: 'drinks-beverages',
    name: 'Pack of Coca-Cola Original Plastic Bottles (50cl x 12)',
    sku: 'DRK-COK-12BT-30',
    brand: 'Coca-Cola',
    weight: 6.5,
    price: 5400.0,
    oldPrice: 6000.0,
    stockQuantity: 220,
    productType: 'grocery',
    description: '12 chilled 50cl PET bottles of classic Coca-Cola refreshing carbonated soft drink.',
    images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'drinks-beverages',
    name: 'Pack of Eva Pure Spring Water (75cl x 12 Bottles)',
    sku: 'DRK-EVA-12BT-31',
    brand: 'Eva Water',
    weight: 9.0,
    price: 3200.0,
    oldPrice: 3800.0,
    stockQuantity: 300,
    productType: 'grocery',
    description: 'Natural mineral spring water filtered and bottled under hygienic international standards.',
    images: ['https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },

  // ═══ 8. HOUSEHOLD & CLEANING ═══
  {
    categorySlug: 'household-essentials',
    name: 'Carton of Sunlight Washing Detergent Powder (900g x 12)',
    sku: 'HSD-SNL-900G-32',
    brand: 'Sunlight',
    weight: 10.8,
    price: 16500.0,
    oldPrice: 18000.0,
    stockQuantity: 80,
    productType: 'retail',
    description: 'Fresh spring sensation laundry powder with stain-removing power for bright white and colored fabrics.',
    images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  },
  {
    categorySlug: 'household-essentials',
    name: 'Carton of Dettol Antiseptic Disinfectant Liquid (1L x 6)',
    sku: 'HSD-DTL-1LTX-33',
    brand: 'Dettol',
    weight: 6.5,
    price: 21000.0,
    oldPrice: 23500.0,
    stockQuantity: 60,
    productType: 'retail',
    description: 'Hospital grade multi-purpose germ protection and surface disinfection liquid.',
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'],
    isSponsored: false
  }
];

async function seedCommodities() {
  console.log('Connecting to database to seed commodities...');

  // 1. Ensure Categories exist
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES_DATA) {
    const existing = await pool.query('SELECT id, slug FROM categories WHERE slug = $1', [cat.slug]);
    if (existing.rows.length > 0) {
      categoryMap[cat.slug] = existing.rows[0].id;
    } else {
      const inserted = await pool.query(
        'INSERT INTO categories (name, slug, icon_url) VALUES ($1, $2, $3) RETURNING id, slug',
        [cat.name, cat.slug, cat.iconUrl]
      );
      categoryMap[cat.slug] = inserted.rows[0].id;
      console.log(`Created category: ${cat.name}`);
    }
  }

  // 2. Insert or update commodities
  let insertedCount = 0;
  for (const item of COMMODITIES_DATA) {
    const categoryId = categoryMap[item.categorySlug] || null;

    const existingProd = await pool.query('SELECT id FROM products WHERE sku = $1', [item.sku]);

    if (existingProd.rows.length === 0) {
      await pool.query(
        `INSERT INTO products (
          vendor_id, sku, name, description, price, old_price, category_id,
          brand, weight, condition, is_negotiable, is_sponsored, images,
          stock_quantity, product_type, preparation_time
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )`,
        [
          VENDOR_ID,
          item.sku,
          item.name,
          item.description,
          item.price,
          item.oldPrice || null,
          categoryId,
          item.brand,
          item.weight,
          'new',
          false,
          item.isSponsored || false,
          JSON.stringify(item.images),
          item.stockQuantity,
          item.productType,
          item.preparationTime || null
        ]
      );
      insertedCount++;
      console.log(`Inserted product: ${item.name} (₦${item.price.toLocaleString()})`);
    } else {
      console.log(`Already exists: ${item.name}`);
    }
  }

  console.log(`\n✅ Successfully seeded ${insertedCount} new goods and commodities for vendor ${VENDOR_ID}!`);
  await pool.end();
}

seedCommodities().catch(err => {
  console.error('Seeding failed:', err);
  pool.end();
  process.exit(1);
});

