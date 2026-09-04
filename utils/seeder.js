/**
 * Database Seeder Utility & Script
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

const User = require('../models/User');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');
const Order = require('../models/Order');
const Feedback = require('../models/Feedback');

const {
  ROLES,
  ORDER_STATUS,
  ORDER_TYPES,
  RESERVATION_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS
} = require('../config/constants');

const seedData = async (shouldExit = false) => {
  try {
    console.log('[Seeder] Clearing old records...');
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Reservation.deleteMany({});
    await Order.deleteMany({});
    await Feedback.deleteMany({});

    console.log('[Seeder] Seeding Branches...');
    const branches = await Branch.create([
      {
        name: 'The Royal Bistro - Indiranagar',
        address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
        city: 'Bangalore',
        phone: '+91 98450 11223',
        seatingCapacity: 60,
        openingTime: '11:00',
        closingTime: '23:30',
        isActive: true
      },
      {
        name: 'The Royal Bistro - Koramangala',
        address: '80 Feet Road, 4th Block, Koramangala',
        city: 'Bangalore',
        phone: '+91 98450 44556',
        seatingCapacity: 80,
        openingTime: '11:30',
        closingTime: '23:30',
        isActive: true
      }
    ]);

    const branch1 = branches[0];
    const branch2 = branches[1];

    console.log('[Seeder] Seeding Users...');
    const users = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@restaurant.com',
        passwordHash: 'admin123',
        role: ROLES.ADMIN,
        phone: '+91 98000 00001'
      },
      {
        name: 'Indiranagar Branch Manager',
        email: 'manager@restaurant.com',
        passwordHash: 'manager123',
        role: ROLES.MANAGER,
        phone: '+91 98000 00002',
        branchId: branch1._id
      },
      {
        name: 'Chef Alessandro (Kitchen Head)',
        email: 'kitchen@restaurant.com',
        passwordHash: 'kitchen123',
        role: ROLES.KITCHEN,
        phone: '+91 98000 00003',
        branchId: branch1._id
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'customer123',
        role: ROLES.CUSTOMER,
        phone: '+91 98451 23456'
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah@example.com',
        passwordHash: 'customer123',
        role: ROLES.CUSTOMER,
        phone: '+91 98452 34567'
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        passwordHash: 'customer123',
        role: ROLES.CUSTOMER,
        phone: '+91 98453 45678'
      }
    ]);

    const adminUser = users[0];
    const managerUser = users[1];
    const kitchenUser = users[2];
    const customerJohn = users[3];
    const customerSarah = users[4];
    const customerRajesh = users[5];

    console.log('[Seeder] Seeding Tables...');
    const tables = await Table.create([
      // Indiranagar Tables
      { branchId: branch1._id, tableNumber: 'T-01', capacity: 2, locationZone: 'Indoor Main Hall', isAvailable: true },
      { branchId: branch1._id, tableNumber: 'T-02', capacity: 2, locationZone: 'Outdoor Patio', isAvailable: true },
      { branchId: branch1._id, tableNumber: 'T-03', capacity: 4, locationZone: 'Indoor Main Hall', isAvailable: true },
      { branchId: branch1._id, tableNumber: 'T-04', capacity: 4, locationZone: 'Rooftop Garden', isAvailable: true },
      { branchId: branch1._id, tableNumber: 'T-05', capacity: 6, locationZone: 'Indoor Main Hall', isAvailable: true },
      { branchId: branch1._id, tableNumber: 'VIP-01', capacity: 8, locationZone: 'VIP Lounge', isAvailable: true },

      // Koramangala Tables
      { branchId: branch2._id, tableNumber: 'K-01', capacity: 2, locationZone: 'Indoor Main Hall', isAvailable: true },
      { branchId: branch2._id, tableNumber: 'K-02', capacity: 4, locationZone: 'Outdoor Patio', isAvailable: true },
      { branchId: branch2._id, tableNumber: 'K-03', capacity: 4, locationZone: 'Indoor Main Hall', isAvailable: true },
      { branchId: branch2._id, tableNumber: 'K-04', capacity: 6, locationZone: 'Rooftop Garden', isAvailable: true },
      { branchId: branch2._id, tableNumber: 'K-05', capacity: 6, locationZone: 'Indoor Main Hall', isAvailable: true },
      { branchId: branch2._id, tableNumber: 'VIP-K1', capacity: 10, locationZone: 'VIP Lounge', isAvailable: true }
    ]);

    console.log('[Seeder] Seeding Menu Items...');
    const menuItems = await MenuItem.create([
      // Starters
      {
        name: 'Crispy Truffle Fries',
        category: 'Starters',
        price: 249,
        description: 'Golden hand-cut potato fries tossed in aromatic black truffle oil, rosemary, and aged parmesan.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 12,
        dietaryTags: ['Vegetarian', 'Crispy', 'Chef Pick'],
        ratingAverage: 4.8,
        ratingCount: 14
      },
      {
        name: 'Woodfire Paneer Tikka',
        category: 'Starters',
        price: 349,
        description: 'Cottage cheese cubes marinated in tandoori spices and smoked in a clay oven with bell peppers and onions.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 18,
        dietaryTags: ['Vegetarian', 'Spicy', 'Gluten-Free'],
        ratingAverage: 4.9,
        ratingCount: 22
      },
      {
        name: 'Smoked Peri Peri Chicken Wings',
        category: 'Starters',
        price: 399,
        description: 'Slow-smoked succulent chicken wings glazed with fiery African peri-peri glaze and served with ranch dip.',
        isVeg: false,
        isAvailable: true,
        preparationTime: 15,
        dietaryTags: ['Non-Veg', 'Spicy', 'Popular'],
        ratingAverage: 4.7,
        ratingCount: 19
      },
      {
        name: 'Avocado Bruschetta',
        category: 'Starters',
        price: 299,
        description: 'Toasted sourdough topped with Hass avocado mash, heirloom cherry tomatoes, basil, and balsamic reduction.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 10,
        dietaryTags: ['Vegan', 'Healthy'],
        ratingAverage: 4.6,
        ratingCount: 8
      },

      // Main Course
      {
        name: 'Butter Chicken Grand Cru',
        category: 'Main Course',
        price: 499,
        description: 'Tender tandoor-roasted chicken in a rich, velvety tomato and cashew butter gravy infused with fenugreek.',
        isVeg: false,
        isAvailable: true,
        preparationTime: 20,
        dietaryTags: ['Non-Veg', 'Bestseller', 'Signature'],
        ratingAverage: 4.9,
        ratingCount: 35
      },
      {
        name: 'Paneer Makhani Royale',
        category: 'Main Course',
        price: 449,
        description: 'Soft cottage cheese simmered in a creamy, slow-simmered tomato makhani sauce with artisanal butter.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 18,
        dietaryTags: ['Vegetarian', 'Classic'],
        ratingAverage: 4.8,
        ratingCount: 28
      },
      {
        name: 'Wild Mushroom Risotto',
        category: 'Main Course',
        price: 479,
        description: 'Arborio rice slowly cooked with porcini and cremini mushrooms, white wine, thyme, and parmigiano.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 22,
        dietaryTags: ['Vegetarian', 'Gourmet'],
        ratingAverage: 4.7,
        ratingCount: 12
      },
      {
        name: 'Grilled Norwegian Salmon',
        category: 'Main Course',
        price: 749,
        description: 'Pan-seared Atlantic salmon fillet served with lemon-herb butter sauce, asparagus, and roasted baby potatoes.',
        isVeg: false,
        isAvailable: true,
        preparationTime: 25,
        dietaryTags: ['Non-Veg', 'Seafood', 'Gluten-Free'],
        ratingAverage: 4.9,
        ratingCount: 16
      },

      // Breads & Rice
      {
        name: 'Dum Hyderabadi Mutton Biryani',
        category: 'Breads & Rice',
        price: 549,
        description: 'Aromatic long-grain basmati rice and tender lamb cuts slow-cooked on dum with saffron, mint, and whole spices.',
        isVeg: false,
        isAvailable: true,
        preparationTime: 25,
        dietaryTags: ['Non-Veg', 'Bestseller', 'Spicy'],
        ratingAverage: 4.9,
        ratingCount: 42
      },
      {
        name: 'Subz Dum Biryani',
        category: 'Breads & Rice',
        price: 399,
        description: 'Garden fresh vegetables layered with fragranced basmati rice and sealed with dough for royal flavors.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 20,
        dietaryTags: ['Vegetarian', 'Aromatic'],
        ratingAverage: 4.6,
        ratingCount: 15
      },
      {
        name: 'Garlic Butter Naan Basket',
        category: 'Breads & Rice',
        price: 129,
        description: 'Tandoor baked fluffy flatbread smothered with roasted garlic and melted butter.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 8,
        dietaryTags: ['Vegetarian'],
        ratingAverage: 4.8,
        ratingCount: 30
      },

      // Desserts
      {
        name: 'Belgian Molten Lava Cake',
        category: 'Desserts',
        price: 289,
        description: 'Warm dark chocolate cake with a molten truffle center, accompanied by Madagascar vanilla bean gelato.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 15,
        dietaryTags: ['Vegetarian', 'Sweet Tooth', 'Bestseller'],
        ratingAverage: 4.9,
        ratingCount: 26
      },
      {
        name: 'Classic Tiramisu',
        category: 'Desserts',
        price: 299,
        description: 'Espresso-soaked ladyfingers layered with airy mascarpone cream and dusted with fine Dutch cocoa powder.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 10,
        dietaryTags: ['Vegetarian', 'Classic'],
        ratingAverage: 4.8,
        ratingCount: 18
      },
      {
        name: 'Saffron Gulab Jamun with Rabdi',
        category: 'Desserts',
        price: 229,
        description: 'Warm khoya dumplings steeped in rose saffron syrup served over chilled thickened rabdi and pistachios.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 8,
        dietaryTags: ['Vegetarian', 'Traditional'],
        ratingAverage: 4.9,
        ratingCount: 21
      },

      // Beverages
      {
        name: 'Signature Passionfruit Mint Mocktail',
        category: 'Beverages',
        price: 199,
        description: 'Fresh passionfruit puree shaken with garden mint, lime juice, and sparkling soda over crushed ice.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 6,
        dietaryTags: ['Vegan', 'Refreshing'],
        ratingAverage: 4.7,
        ratingCount: 11
      },
      {
        name: 'Iced Artisan Cold Brew',
        category: 'Beverages',
        price: 179,
        description: '18-hour slow steeped single-origin Arabica coffee served over ice block with oat milk option.',
        isVeg: true,
        isAvailable: true,
        preparationTime: 5,
        dietaryTags: ['Vegan', 'Coffee'],
        ratingAverage: 4.6,
        ratingCount: 9
      },

      // Chef Specials
      {
        name: 'Slow Roasted Lamb Shank',
        category: 'Chef Specials',
        price: 799,
        description: '8-hour braised lamb shank in red wine jus with creamy garlic mashed potatoes and glazed heirloom carrots.',
        isVeg: false,
        isAvailable: true,
        preparationTime: 30,
        dietaryTags: ['Non-Veg', 'Chef Special', 'Gourmet'],
        ratingAverage: 5.0,
        ratingCount: 14
      }
    ]);

    console.log('[Seeder] Seeding Sample Reservations...');
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const reservations = await Reservation.create([
      {
        customerId: customerJohn._id,
        branchId: branch1._id,
        tableId: tables[2]._id, // T-03 (4 seats)
        reservationDate: todayStr,
        timeSlot: '19:30',
        guestsCount: 4,
        specialRequests: 'Window side table for birthday dinner',
        status: RESERVATION_STATUS.CONFIRMED
      },
      {
        customerId: customerSarah._id,
        branchId: branch1._id,
        tableId: tables[5]._id, // VIP-01 (8 seats)
        reservationDate: todayStr,
        timeSlot: '20:00',
        guestsCount: 6,
        specialRequests: 'Corporate dinner gathering',
        status: RESERVATION_STATUS.CONFIRMED
      },
      {
        customerId: customerRajesh._id,
        branchId: branch2._id,
        tableId: tables[7]._id, // K-02 (4 seats)
        reservationDate: tomorrowStr,
        timeSlot: '13:00',
        guestsCount: 3,
        specialRequests: 'Baby high-chair needed',
        status: RESERVATION_STATUS.CONFIRMED
      }
    ]);

    console.log('[Seeder] Seeding Sample Orders across lifecycle...');
    const order1Items = [
      { menuItemId: menuItems[4]._id, name: menuItems[4].name, price: menuItems[4].price, quantity: 2, specialNotes: 'Medium spice' },
      { menuItemId: menuItems[10]._id, name: menuItems[10].name, price: menuItems[10].price, quantity: 4, specialNotes: 'Crispy' },
      { menuItemId: menuItems[14]._id, name: menuItems[14].name, price: menuItems[14].price, quantity: 2 }
    ];
    const sub1 = (499 * 2) + (129 * 4) + (199 * 2);
    const tax1 = Math.round(sub1 * 0.05 * 100) / 100;
    const sc1 = Math.round(sub1 * 0.05 * 100) / 100;
    const tot1 = Math.round((sub1 + tax1 + sc1) * 100) / 100;

    const order1 = await Order.create({
      orderNumber: 'ORD-20260904-1001',
      customerId: customerJohn._id,
      branchId: branch1._id,
      orderType: ORDER_TYPES.DINE_IN,
      tableId: tables[2]._id,
      reservationId: reservations[0]._id,
      items: order1Items,
      subtotal: sub1,
      discountAmount: 0,
      promoCode: null,
      taxRate: 0.05,
      taxAmount: tax1,
      serviceChargeRate: 0.05,
      serviceCharge: sc1,
      totalAmount: tot1,
      status: ORDER_STATUS.SERVED,
      statusHistory: [
        { status: ORDER_STATUS.PLACED, timestamp: new Date(Date.now() - 3600000), remarks: 'Order placed by John', updatedBy: customerJohn._id },
        { status: ORDER_STATUS.PREPARING, timestamp: new Date(Date.now() - 3000000), remarks: 'Kitchen preparation started', updatedBy: kitchenUser._id },
        { status: ORDER_STATUS.READY, timestamp: new Date(Date.now() - 1800000), remarks: 'Order plated and ready', updatedBy: kitchenUser._id },
        { status: ORDER_STATUS.SERVED, timestamp: new Date(Date.now() - 1200000), remarks: 'Served to Table T-03', updatedBy: managerUser._id }
      ],
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentMethod: PAYMENT_METHODS.CARD,
      estimatedPrepTimeMinutes: 25,
      createdAt: new Date(Date.now() - 3600000)
    });

    const order2Items = [
      { menuItemId: menuItems[0]._id, name: menuItems[0].name, price: menuItems[0].price, quantity: 2 },
      { menuItemId: menuItems[8]._id, name: menuItems[8].name, price: menuItems[8].price, quantity: 2 },
      { menuItemId: menuItems[11]._id, name: menuItems[11].name, price: menuItems[11].price, quantity: 2 }
    ];
    const sub2 = (249 * 2) + (549 * 2) + (289 * 2);
    const disc2 = 150;
    const net2 = sub2 - disc2;
    const tax2 = Math.round(net2 * 0.05 * 100) / 100;
    const sc2 = Math.round(net2 * 0.05 * 100) / 100;
    const tot2 = Math.round((net2 + tax2 + sc2) * 100) / 100;

    const order2 = await Order.create({
      orderNumber: 'ORD-20260904-1002',
      customerId: customerSarah._id,
      branchId: branch1._id,
      orderType: ORDER_TYPES.DINE_IN,
      tableId: tables[5]._id,
      items: order2Items,
      subtotal: sub2,
      discountAmount: disc2,
      promoCode: 'WELCOME10',
      taxRate: 0.05,
      taxAmount: tax2,
      serviceChargeRate: 0.05,
      serviceCharge: sc2,
      totalAmount: tot2,
      status: ORDER_STATUS.PREPARING,
      statusHistory: [
        { status: ORDER_STATUS.PLACED, timestamp: new Date(Date.now() - 1500000), remarks: 'Order placed by Sarah', updatedBy: customerSarah._id },
        { status: ORDER_STATUS.PREPARING, timestamp: new Date(Date.now() - 900000), remarks: 'Cooking in progress', updatedBy: kitchenUser._id }
      ],
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: PAYMENT_METHODS.UPI,
      estimatedPrepTimeMinutes: 20,
      createdAt: new Date(Date.now() - 1500000)
    });

    const order3Items = [
      { menuItemId: menuItems[1]._id, name: menuItems[1].name, price: menuItems[1].price, quantity: 1 },
      { menuItemId: menuItems[5]._id, name: menuItems[5].name, price: menuItems[5].price, quantity: 1 },
      { menuItemId: menuItems[10]._id, name: menuItems[10].name, price: menuItems[10].price, quantity: 2 }
    ];
    const sub3 = 349 + 449 + (129 * 2);
    const tax3 = Math.round(sub3 * 0.05 * 100) / 100;
    const sc3 = 0;
    const tot3 = Math.round((sub3 + tax3 + sc3) * 100) / 100;

    const order3 = await Order.create({
      orderNumber: 'ORD-20260904-1003',
      customerId: customerRajesh._id,
      branchId: branch2._id,
      orderType: ORDER_TYPES.TAKEAWAY,
      items: order3Items,
      subtotal: sub3,
      discountAmount: 0,
      promoCode: null,
      taxRate: 0.05,
      taxAmount: tax3,
      serviceChargeRate: 0,
      serviceCharge: 0,
      totalAmount: tot3,
      status: ORDER_STATUS.PLACED,
      statusHistory: [
        { status: ORDER_STATUS.PLACED, timestamp: new Date(Date.now() - 300000), remarks: 'Takeaway order placed', updatedBy: customerRajesh._id }
      ],
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentMethod: PAYMENT_METHODS.ONLINE,
      estimatedPrepTimeMinutes: 18,
      createdAt: new Date(Date.now() - 300000)
    });

    console.log('[Seeder] Seeding Sample Feedback...');
    await Feedback.create({
      orderId: order1._id,
      customerId: customerJohn._id,
      branchId: branch1._id,
      rating: 5,
      foodRating: 5,
      serviceRating: 5,
      comment: 'Exceptional food quality! Butter Chicken Grand Cru was divine and the service was top notch.'
    });

    console.log('[Seeder] Seeding completed successfully!');
    if (shouldExit) process.exit(0);
  } catch (error) {
    console.error('[Seeder] Error during database seed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seeder] Empty database detected. Auto-seeding mock data for immediate demo...');
      await seedData(false);
    }
  } catch (err) {
    console.error('[Seeder] Auto-seed check error:', err.message);
  }
};

// If run directly from CLI (npm run seed)
if (require.main === module) {
  const { connectDB } = require('../config/db');
  connectDB().then(() => seedData(true));
}

module.exports = { seedData, autoSeedIfEmpty };
