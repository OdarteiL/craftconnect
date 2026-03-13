const { sequelize } = require('./config/db');
const { User, Category, Product, Auction } = require('./models');
const bcrypt = require('bcryptjs');

const categories = [
  { name: 'Beads & Jewelry', slug: 'beads-jewelry', description: 'Handcrafted beads and jewelry' },
  { name: 'Wood Carvings', slug: 'wood-carvings', description: 'Traditional wood carvings' },
  { name: 'Textiles & Kente', slug: 'textiles-kente', description: 'Authentic Kente cloth and textiles' },
  { name: 'Baskets & Weaving', slug: 'baskets-weaving', description: 'Woven baskets and crafts' },
  { name: 'Pottery & Ceramics', slug: 'pottery-ceramics', description: 'Handmade pottery and ceramics' },
  { name: 'Leather Goods', slug: 'leather-goods', description: 'Leather bags and accessories' },
  { name: 'Paintings & Art', slug: 'paintings-art', description: 'Traditional and modern art' },
  { name: 'Musical Instruments', slug: 'musical-instruments', description: 'Traditional drums and instruments' }
];

const products = [
  { name: 'Handcrafted Kente Cloth', description: 'Authentic Ghanaian Kente cloth with traditional patterns', price: 250.00, stock: 15, category: 'Textiles & Kente' },
  { name: 'Wooden Elephant Carving', description: 'Beautiful hand-carved elephant from local wood', price: 85.00, stock: 8, category: 'Wood Carvings' },
  { name: 'Beaded Necklace Set', description: 'Colorful beaded necklace with matching earrings', price: 45.00, stock: 25, category: 'Beads & Jewelry' },
  { name: 'Traditional Djembe Drum', description: 'Authentic African djembe drum, hand-carved', price: 180.00, stock: 5, category: 'Musical Instruments' },
  { name: 'Woven Basket Large', description: 'Large handwoven basket perfect for storage', price: 65.00, stock: 12, category: 'Baskets & Weaving' },
  { name: 'Ceramic Vase', description: 'Hand-painted ceramic vase with traditional motifs', price: 55.00, stock: 10, category: 'Pottery & Ceramics' },
  { name: 'Leather Messenger Bag', description: 'Handcrafted leather bag with adjustable strap', price: 120.00, stock: 7, category: 'Leather Goods' },
  { name: 'Adinkra Symbol Painting', description: 'Canvas painting featuring Adinkra symbols', price: 95.00, stock: 6, category: 'Paintings & Art' },
  { name: 'Glass Bead Bracelet', description: 'Recycled glass beads in vibrant colors', price: 28.00, stock: 30, category: 'Beads & Jewelry' },
  { name: 'Kente Stole', description: 'Graduation or ceremonial Kente stole', price: 75.00, stock: 20, category: 'Textiles & Kente' },
  { name: 'Wooden Mask', description: 'Traditional ceremonial mask, hand-carved', price: 110.00, stock: 4, category: 'Wood Carvings' },
  { name: 'Talking Drum', description: 'Traditional talking drum with leather straps', price: 95.00, stock: 8, category: 'Musical Instruments' },
  { name: 'Woven Table Mat Set', description: 'Set of 4 handwoven table mats', price: 35.00, stock: 18, category: 'Baskets & Weaving' },
  { name: 'Clay Pot Set', description: 'Set of 3 traditional clay cooking pots', price: 48.00, stock: 15, category: 'Pottery & Ceramics' },
  { name: 'Leather Wallet', description: 'Handcrafted leather wallet with card slots', price: 42.00, stock: 22, category: 'Leather Goods' },
  { name: 'Abstract Canvas Art', description: 'Modern abstract art inspired by African patterns', price: 150.00, stock: 3, category: 'Paintings & Art' }
];

async function seed() {
  try {
    console.log('Starting database seed...');
    
    await sequelize.sync({ force: false });

    // Create artisan users
    const artisans = [];
    for (let i = 1; i <= 5; i++) {
      const artisan = await User.create({
        email: `artisan${i}@craftconnect.com`,
        password_hash: await bcrypt.hash('password123', 10),
        first_name: ['Kwame', 'Ama', 'Kofi', 'Akua', 'Yaw'][i - 1],
        last_name: ['Mensah', 'Asante', 'Boateng', 'Owusu', 'Adjei'][i - 1],
        role: 'artisan',
        is_verified: true,
        is_active: true,
        location: 'Aburi, Ghana',
        bio: `Experienced artisan specializing in traditional Ghanaian crafts with ${5 + i * 2} years of experience.`
      });
      artisans.push(artisan);
    }
    console.log(`✓ Created ${artisans.length} artisan users`);

    // Create categories
    const createdCategories = {};
    for (const cat of categories) {
      const category = await Category.create(cat);
      createdCategories[cat.name] = category;
    }
    console.log(`✓ Created ${categories.length} categories`);

    // Create products
    let productCount = 0;
    for (const prod of products) {
      const category = createdCategories[prod.category];
      const artisan = artisans[Math.floor(Math.random() * artisans.length)];
      
      await Product.create({
        name: prod.name,
        description: prod.description,
        price: prod.price,
        stock_quantity: prod.stock,
        category_id: category.id,
        artisan_id: artisan.id,
        images: [`https://placehold.co/600x600/2E7D32/FFF?text=${encodeURIComponent(prod.name.substring(0, 20))}`],
        is_featured: Math.random() > 0.7,
        status: 'active'
      });
      productCount++;
    }
    console.log(`✓ Created ${productCount} products`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Artisan: artisan1@craftconnect.com / password123');
    console.log('Artisan: artisan2@craftconnect.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
