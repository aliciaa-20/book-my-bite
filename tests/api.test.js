/**
 * Automated Integration Test Suite
 * P07 - Restaurant Table Reservation & Food Ordering System
 * Tests all 13 Functional Modules, Validation, RBAC, Conflict Engine, Workflow & Reports
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');

let mongoServer;
let customerToken, managerToken, kitchenToken, adminToken;
let branchId, tableId, menuItemId, reservationId, orderId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('P07 Restaurant System Integration Tests', () => {
  
  // -------------------------------------------------------------
  // MODULE 1: CUSTOMER REGISTRATION & AUTHENTICATION
  // -------------------------------------------------------------
  describe('Module 1: Authentication & RBAC', () => {
    it('should register a new customer successfully (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Wonder',
          email: 'alice@example.com',
          password: 'password123',
          phone: '+91 98765 43210',
          role: 'customer'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@example.com');
      customerToken = res.body.data.token;
    });

    it('should prevent duplicate user registration (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Wonder Duplicate',
          email: 'alice@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should fail registration on invalid email format (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should register admin, manager, and kitchen personas', async () => {
      // Admin
      const adminRes = await request(app).post('/api/auth/register').send({
        name: 'Master Admin',
        email: 'admin.test@restaurant.com',
        password: 'adminpassword',
        role: 'admin'
      });
      adminToken = adminRes.body.data.token;

      // Manager
      const managerRes = await request(app).post('/api/auth/register').send({
        name: 'Floor Manager',
        email: 'manager.test@restaurant.com',
        password: 'managerpassword',
        role: 'manager'
      });
      managerToken = managerRes.body.data.token;

      // Kitchen
      const kitchenRes = await request(app).post('/api/auth/register').send({
        name: 'Sous Chef',
        email: 'kitchen.test@restaurant.com',
        password: 'kitchenpassword',
        role: 'kitchen'
      });
      kitchenToken = kitchenRes.body.data.token;

      expect(adminToken).toBeDefined();
      expect(managerToken).toBeDefined();
      expect(kitchenToken).toBeDefined();
    });

    it('should authenticate user via login endpoint (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject invalid password during login (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'wrong_password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });

  // -------------------------------------------------------------
  // MODULE 12: BRANCH MANAGEMENT
  // -------------------------------------------------------------
  describe('Module 12: Branch Management', () => {
    it('should allow admin to create a new branch (201)', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'The Royal Bistro - Indiranagar',
          address: '100 Feet Road, HAL 2nd Stage',
          city: 'Bangalore',
          phone: '+91 98450 11223',
          seatingCapacity: 60,
          openingTime: '11:00',
          closingTime: '23:30'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      branchId = res.body.data._id;
    });

    it('should deny non-admin users from creating branches (403)', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Branch',
          address: 'Test Address',
          city: 'Bangalore',
          phone: '+91 99999 99999',
          seatingCapacity: 50
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should fetch all branches publicly (200)', async () => {
      const res = await request(app).get('/api/branches');
      expect(res.status).toBe(200);
      expect(res.body.data.branches.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------
  // MODULE 3: TABLE INVENTORY MANAGEMENT
  // -------------------------------------------------------------
  describe('Module 3: Table Inventory Management', () => {
    it('should allow manager/admin to create a table in the branch (201)', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          branchId,
          tableNumber: 'T-01',
          capacity: 4,
          locationZone: 'Indoor Main Hall'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      tableId = res.body.data._id;
    });

    it('should reject duplicate table number in the same branch (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/tables')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          branchId,
          tableNumber: 'T-01',
          capacity: 4
        });

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('DUPLICATE_TABLE_NUMBER');
    });
  });

  // -------------------------------------------------------------
  // MODULE 2: MENU MANAGEMENT
  // -------------------------------------------------------------
  describe('Module 2: Menu Management', () => {
    it('should allow manager to create a menu dish (201)', async () => {
      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          branchId,
          name: 'Butter Chicken Grand Cru',
          category: 'Main Course',
          price: 499,
          description: 'Velvety slow-cooked chicken in makhani gravy',
          isVeg: false,
          preparationTime: 20,
          dietaryTags: ['Non-Veg', 'Signature']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      menuItemId = res.body.data._id;
    });

    it('should allow kitchen staff to toggle menu item availability (200)', async () => {
      const res = await request(app)
        .patch(`/api/menu/${menuItemId}/toggle-availability`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send({ isAvailable: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // MODULE 4 & 9: TABLE RESERVATION & CANCELLATION ENGINE
  // -------------------------------------------------------------
  describe('Modules 4 & 9: Table Reservation Engine & Cancellation Policy', () => {
    const testDate = '2026-09-15';
    const testSlot = '19:30';

    it('should query available time slots for a branch & date (200)', async () => {
      const res = await request(app)
        .get(`/api/reservations/available-slots?branchId=${branchId}&date=${testDate}&guestsCount=4`);

      expect(res.status).toBe(200);
      expect(res.body.data.slots).toBeDefined();
      expect(res.body.data.slots.length).toBeGreaterThan(0);
    });

    it('should reserve a table slot for customer (201)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchId,
          tableId,
          reservationDate: testDate,
          timeSlot: testSlot,
          guestsCount: 4,
          specialRequests: 'Window table requested'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      reservationId = res.body.data._id;
    });

    it('should PREVENT table double-booking on same slot & table (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchId,
          tableId,
          reservationDate: testDate,
          timeSlot: testSlot,
          guestsCount: 4
        });

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('TABLE_SLOT_CONFLICT');
    });

    it('should allow customer to cancel reservation (200)', async () => {
      const res = await request(app)
        .post(`/api/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Plans changed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Cancelled');
    });
  });

  // -------------------------------------------------------------
  // MODULES 5, 6, 8, 10: FOOD ORDERING, BILLING & WORKFLOW
  // -------------------------------------------------------------
  describe('Modules 5, 6, 8, 10: Order Placement, Billing & Workflow', () => {
    it('should preview bill calculation with GST and discount (200)', async () => {
      const res = await request(app)
        .post('/api/billing/calculate')
        .send({
          orderType: 'Dine-In',
          promoCode: 'WELCOME10',
          items: [{ menuItemId, quantity: 2 }]
        });

      expect(res.status).toBe(200);
      const b = res.body.data.billing;
      expect(b.subtotal).toBe(998); // 499 * 2
      expect(b.taxRate).toBe(0.05); // 5% GST
      expect(b.serviceChargeRate).toBe(0.05); // 5% Service Charge
      expect(b.totalAmount).toBeGreaterThan(0);
    });

    it('should place a new Dine-In order (201)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchId,
          orderType: 'Dine-In',
          tableId,
          items: [{ menuItemId, quantity: 2, specialNotes: 'Extra spicy' }],
          promoCode: 'WELCOME10',
          paymentMethod: 'UPI'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toBeDefined();
      expect(res.body.data.status).toBe('Placed');
      orderId = res.body.data._id;
    });

    it('should retrieve customer order history (200)', async () => {
      const res = await request(app)
        .get('/api/orders/my-history')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBeGreaterThanOrEqual(1);
    });

    it('should advance order status Placed -> Preparing -> Ready -> Served (200)', async () => {
      // 1. Placed -> Preparing
      const prepRes = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send({ status: 'Preparing', remarks: 'Started cooking' });

      expect(prepRes.status).toBe(200);
      expect(prepRes.body.data.status).toBe('Preparing');

      // 2. Preparing -> Ready
      const readyRes = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${kitchenToken}`)
        .send({ status: 'Ready', remarks: 'Plated hot' });

      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.status).toBe('Ready');

      // 3. Ready -> Served
      const servedRes = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'Served', remarks: 'Delivered to table' });

      expect(servedRes.status).toBe(200);
      expect(servedRes.body.data.status).toBe('Served');
    });

    it('should reject invalid workflow status transition (400)', async () => {
      // Cannot transition from Served back to Placed
      const res = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'Placed' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // -------------------------------------------------------------
  // MODULE 7: KITCHEN DISPLAY QUEUE
  // -------------------------------------------------------------
  describe('Module 7: Kitchen Display System APIs', () => {
    it('should fetch live kitchen queue and metrics (200)', async () => {
      const queueRes = await request(app)
        .get(`/api/kitchen/queue?branchId=${branchId}`)
        .set('Authorization', `Bearer ${kitchenToken}`);

      expect(queueRes.status).toBe(200);
      expect(queueRes.body.data.queue).toBeDefined();

      const metricsRes = await request(app)
        .get(`/api/kitchen/metrics?branchId=${branchId}`)
        .set('Authorization', `Bearer ${kitchenToken}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.totalToday).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // MODULE 11: FEEDBACK & RATINGS
  // -------------------------------------------------------------
  describe('Module 11: Feedback & Rating Module', () => {
    it('should allow customer to submit review for served order (201)', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          rating: 5,
          foodRating: 5,
          serviceRating: 5,
          comment: 'Spectacular taste and presentation!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should prevent duplicate review on the same order (409)', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          rating: 4
        });

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('DUPLICATE_FEEDBACK');
    });
  });

  // -------------------------------------------------------------
  // MODULE 13: MANAGER REPORTS & ANALYTICS
  // -------------------------------------------------------------
  describe('Module 13: Manager Reports & Aggregations', () => {
    it('should retrieve executive dashboard summary KPIs (200)', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard-summary')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.todayRevenue).toBeDefined();
      expect(res.body.data.todayOrdersCount).toBeDefined();
    });

    it('should generate sales analytics aggregation pipeline (200)', async () => {
      const res = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.branchSales).toBeDefined();
      expect(res.body.data.summary.grandTotalRevenue).toBeGreaterThan(0);
    });

    it('should return popular dishes aggregation (200)', async () => {
      const res = await request(app)
        .get('/api/reports/popular-dishes')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.popularDishes).toBeDefined();
    });

    it('should compute peak dining hours aggregation (200)', async () => {
      const res = await request(app)
        .get('/api/reports/peak-hours')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hourlyOrders).toBeDefined();
    });
  });

});
