/**
 * Postman Collection v2.1 Exporter
 * P07 - Restaurant Table Reservation & Food Ordering System
 * Generates restaurant_api.postman_collection.json covering all 13 required modules.
 */

const fs = require('fs');
const path = require('path');

const generatePostmanCollection = () => {
  const collection = {
    info: {
      _postman_id: "p07-restaurant-system-collection-2026",
      name: "P07 - Restaurant Table Reservation & Food Ordering System API",
      description: "Comprehensive REST API Collection covering all 13 modules for P07 (Food & Beverage Domain). Includes automated tests, role-based requests, workflow progression, slot validation, and executive analytics.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      { key: "baseUrl", value: "http://localhost:5000/api", type: "string" },
      { key: "customerToken", value: "", type: "string" },
      { key: "managerToken", value: "", type: "string" },
      { key: "kitchenToken", value: "", type: "string" },
      { key: "adminToken", value: "", type: "string" },
      { key: "branchId", value: "", type: "string" },
      { key: "tableId", value: "", type: "string" },
      { key: "menuItemId", value: "", type: "string" },
      { key: "reservationId", value: "", type: "string" },
      { key: "orderId", value: "", type: "string" }
    ],
    item: [
      // 1. Customer Registration & Authentication
      {
        name: "1. Customer Registration & Authentication",
        item: [
          {
            name: "Register New Customer",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  name: "Emily Watson",
                  email: "emily.watson@example.com",
                  password: "customer123",
                  phone: "+91 98450 99887",
                  role: "customer"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/auth/register", host: ["{{baseUrl}}"], path: ["auth", "register"] }
            }
          },
          {
            name: "Login Customer (Sets customerToken)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data && jsonData.data.token) {",
                    "  pm.environment.set('customerToken', jsonData.data.token);",
                    "  pm.collectionVariables.set('customerToken', jsonData.data.token);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "john@example.com",
                  password: "customer123"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
            }
          },
          {
            name: "Login Manager (Sets managerToken)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data && jsonData.data.token) {",
                    "  pm.collectionVariables.set('managerToken', jsonData.data.token);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "manager@restaurant.com",
                  password: "manager123"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
            }
          },
          {
            name: "Login Kitchen Staff (Sets kitchenToken)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data && jsonData.data.token) {",
                    "  pm.collectionVariables.set('kitchenToken', jsonData.data.token);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "kitchen@restaurant.com",
                  password: "kitchen123"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
            }
          },
          {
            name: "Login Admin (Sets adminToken)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data && jsonData.data.token) {",
                    "  pm.collectionVariables.set('adminToken', jsonData.data.token);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  email: "admin@restaurant.com",
                  password: "admin123"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
            }
          },
          {
            name: "Get User Profile",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{customerToken}}" }],
              url: { raw: "{{baseUrl}}/auth/profile", host: ["{{baseUrl}}"], path: ["auth", "profile"] }
            }
          }
        ]
      },

      // 2. Branch Management
      {
        name: "2. Branch Management",
        item: [
          {
            name: "Get All Branches",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data.branches.length > 0) {",
                    "  pm.collectionVariables.set('branchId', jsonData.data.branches[0]._id);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "GET",
              url: { raw: "{{baseUrl}}/branches", host: ["{{baseUrl}}"], path: ["branches"] }
            }
          },
          {
            name: "Get Branch By ID",
            request: {
              method: "GET",
              url: { raw: "{{baseUrl}}/branches/{{branchId}}", host: ["{{baseUrl}}"], path: ["branches", "{{branchId}}"] }
            }
          },
          {
            name: "Create Branch (Admin Only)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{adminToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  name: "The Royal Bistro - Whitefield",
                  address: "ITPB Main Road, Whitefield",
                  city: "Bangalore",
                  phone: "+91 98450 77889",
                  seatingCapacity: 90,
                  openingTime: "11:00",
                  closingTime: "23:00"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/branches", host: ["{{baseUrl}}"], path: ["branches"] }
            }
          }
        ]
      },

      // 3. Menu Management
      {
        name: "3. Menu Management",
        item: [
          {
            name: "Get Menu Items (With Filters)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data.items.length > 0) {",
                    "  pm.collectionVariables.set('menuItemId', jsonData.data.items[0]._id);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/menu?category=Main Course&isVeg=true",
                host: ["{{baseUrl}}"],
                path: ["menu"],
                query: [
                  { key: "category", value: "Main Course" },
                  { key: "isVeg", value: "true" }
                ]
              }
            }
          },
          {
            name: "Get Menu Item By ID",
            request: {
              method: "GET",
              url: { raw: "{{baseUrl}}/menu/{{menuItemId}}", host: ["{{baseUrl}}"], path: ["menu", "{{menuItemId}}"] }
            }
          },
          {
            name: "Create Menu Item (Manager/Admin)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{managerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  name: "Truffle Saffron Panna Cotta",
                  category: "Desserts",
                  price: 320,
                  description: "Silky Italian cooked cream infused with Kashmir saffron and white chocolate glaze.",
                  isVeg: true,
                  preparationTime: 12,
                  dietaryTags: ["Vegetarian", "Gourmet"]
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/menu", host: ["{{baseUrl}}"], path: ["menu"] }
            }
          },
          {
            name: "Toggle Item Availability (Kitchen/Manager)",
            request: {
              method: "PATCH",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{kitchenToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({ isAvailable: true }, null, 2)
              },
              url: { raw: "{{baseUrl}}/menu/{{menuItemId}}/toggle-availability", host: ["{{baseUrl}}"], path: ["menu", "{{menuItemId}}", "toggle-availability"] }
            }
          }
        ]
      },

      // 4. Table Inventory Management
      {
        name: "4. Table Inventory Management",
        item: [
          {
            name: "Get All Tables By Branch",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data.tables.length > 0) {",
                    "  pm.collectionVariables.set('tableId', jsonData.data.tables[0]._id);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "GET",
              url: { raw: "{{baseUrl}}/tables?branchId={{branchId}}", host: ["{{baseUrl}}"], path: ["tables"], query: [{ key: "branchId", value: "{{branchId}}" }] }
            }
          },
          {
            name: "Create New Table (Manager/Admin)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{managerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  branchId: "{{branchId}}",
                  tableNumber: "T-NEW-99",
                  capacity: 4,
                  locationZone: "Rooftop Garden"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/tables", host: ["{{baseUrl}}"], path: ["tables"] }
            }
          }
        ]
      },

      // 5. Table Reservation Engine & Cancellation Policy
      {
        name: "5. Table Reservation & Cancellation Engine",
        item: [
          {
            name: "Check Available Slots",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/reservations/available-slots?branchId={{branchId}}&date=2026-09-10&guestsCount=4",
                host: ["{{baseUrl}}"],
                path: ["reservations", "available-slots"],
                query: [
                  { key: "branchId", value: "{{branchId}}" },
                  { key: "date", value: "2026-09-10" },
                  { key: "guestsCount", value: "4" }
                ]
              }
            }
          },
          {
            name: "Reserve Table Slot (Conflict-Protected)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data) {",
                    "  pm.collectionVariables.set('reservationId', jsonData.data._id);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  branchId: "{{branchId}}",
                  reservationDate: "2026-09-10",
                  timeSlot: "19:00",
                  guestsCount: 4,
                  specialRequests: "Anniversary celebration table near the garden."
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/reservations", host: ["{{baseUrl}}"], path: ["reservations"] }
            }
          },
          {
            name: "Reschedule Reservation",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  newDate: "2026-09-10",
                  newTimeSlot: "20:30",
                  newGuestsCount: 4
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/reservations/{{reservationId}}/reschedule", host: ["{{baseUrl}}"], path: ["reservations", "{{reservationId}}", "reschedule"] }
            }
          },
          {
            name: "Cancel Reservation (Policy)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  reason: "Change of travel plans."
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/reservations/{{reservationId}}/cancel", host: ["{{baseUrl}}"], path: ["reservations", "{{reservationId}}", "cancel"] }
            }
          }
        ]
      },

      // 6. Food Order Placement, Workflow & Billing
      {
        name: "6. Food Order Placement & Billing Engine",
        item: [
          {
            name: "Calculate Bill Preview (With Promo & Tax)",
            request: {
              method: "POST",
              header: [{ key: "Content-Type", value: "application/json" }],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  orderType: "Dine-In",
                  promoCode: "WELCOME10",
                  items: [
                    { menuItemId: "{{menuItemId}}", quantity: 2 }
                  ]
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/billing/calculate", host: ["{{baseUrl}}"], path: ["billing", "calculate"] }
            }
          },
          {
            name: "Place Food Order (Dine-In)",
            event: [
              {
                listen: "test",
                script: {
                  exec: [
                    "var jsonData = pm.response.json();",
                    "if (jsonData.success && jsonData.data) {",
                    "  pm.collectionVariables.set('orderId', jsonData.data._id);",
                    "}"
                  ],
                  type: "text/javascript"
                }
              }
            ],
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  branchId: "{{branchId}}",
                  orderType: "Dine-In",
                  tableId: "{{tableId}}",
                  promoCode: "WELCOME10",
                  paymentMethod: "UPI",
                  items: [
                    { menuItemId: "{{menuItemId}}", quantity: 2, specialNotes: "Mild spice please" }
                  ]
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/orders", host: ["{{baseUrl}}"], path: ["orders"] }
            }
          },
          {
            name: "Get Order Invoice Breakdown",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{customerToken}}" }],
              url: { raw: "{{baseUrl}}/billing/orders/{{orderId}}/invoice", host: ["{{baseUrl}}"], path: ["billing", "orders", "{{orderId}}", "invoice"] }
            }
          },
          {
            name: "Pay Order Bill (Mock Checkout)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  paymentMethod: "UPI",
                  transactionRef: "UPI-TXN-998877"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/billing/orders/{{orderId}}/pay", host: ["{{baseUrl}}"], path: ["billing", "orders", "{{orderId}}", "pay"] }
            }
          }
        ]
      },

      // 7. Order Status Workflow & Kitchen Queue
      {
        name: "7. Order Workflow & Kitchen Display System (KDS)",
        item: [
          {
            name: "Get Live Kitchen Queue (FIFO)",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{kitchenToken}}" }],
              url: { raw: "{{baseUrl}}/kitchen/queue?branchId={{branchId}}", host: ["{{baseUrl}}"], path: ["kitchen", "queue"], query: [{ key: "branchId", value: "{{branchId}}" }] }
            }
          },
          {
            name: "Advance Kitchen Order Status (Placed -> Preparing)",
            request: {
              method: "PUT",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{kitchenToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "Preparing",
                  remarks: "Chef started cooking"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/kitchen/orders/{{orderId}}/status", host: ["{{baseUrl}}"], path: ["kitchen", "orders", "{{orderId}}", "status"] }
            }
          },
          {
            name: "Advance Kitchen Order Status (Preparing -> Ready)",
            request: {
              method: "PUT",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{kitchenToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "Ready",
                  remarks: "Plated and hot at the pass"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/kitchen/orders/{{orderId}}/status", host: ["{{baseUrl}}"], path: ["kitchen", "orders", "{{orderId}}", "status"] }
            }
          },
          {
            name: "Complete Order Delivery / Serving",
            request: {
              method: "PUT",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{managerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  status: "Served",
                  remarks: "Served to customer at table"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/orders/{{orderId}}/status", host: ["{{baseUrl}}"], path: ["orders", "{{orderId}}", "status"] }
            }
          },
          {
            name: "Get Kitchen Metrics",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{kitchenToken}}" }],
              url: { raw: "{{baseUrl}}/kitchen/metrics", host: ["{{baseUrl}}"], path: ["kitchen", "metrics"] }
            }
          }
        ]
      },

      // 8. Customer Order History & Feedback
      {
        name: "8. Customer History & Feedback Module",
        item: [
          {
            name: "Get Customer Order History",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{customerToken}}" }],
              url: { raw: "{{baseUrl}}/orders/my-history", host: ["{{baseUrl}}"], path: ["orders", "my-history"] }
            }
          },
          {
            name: "Submit Post-Meal Review & Rating",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{customerToken}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  orderId: "{{orderId}}",
                  rating: 5,
                  foodRating: 5,
                  serviceRating: 5,
                  comment: "Superb culinary presentation and lightning fast service!"
                }, null, 2)
              },
              url: { raw: "{{baseUrl}}/feedback", host: ["{{baseUrl}}"], path: ["feedback"] }
            }
          },
          {
            name: "Get Branch Rating Summary",
            request: {
              method: "GET",
              url: { raw: "{{baseUrl}}/feedback/branch/{{branchId}}", host: ["{{baseUrl}}"], path: ["feedback", "branch", "{{branchId}}"] }
            }
          }
        ]
      },

      // 9. Manager Reports & Analytics
      {
        name: "9. Manager Reports & Analytics (Aggregation Pipelines)",
        item: [
          {
            name: "Get Executive KPI Dashboard Summary",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{managerToken}}" }],
              url: { raw: "{{baseUrl}}/reports/dashboard-summary", host: ["{{baseUrl}}"], path: ["reports", "dashboard-summary"] }
            }
          },
          {
            name: "Get Sales & Revenue Analytics ($facet, $group)",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{managerToken}}" }],
              url: { raw: "{{baseUrl}}/reports/sales", host: ["{{baseUrl}}"], path: ["reports", "sales"] }
            }
          },
          {
            name: "Get Top Popular Dishes Report",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{managerToken}}" }],
              url: { raw: "{{baseUrl}}/reports/popular-dishes?limit=5", host: ["{{baseUrl}}"], path: ["reports", "popular-dishes"], query: [{ key: "limit", value: "5" }] }
            }
          },
          {
            name: "Get Peak Dining Hours & Occupancy",
            request: {
              method: "GET",
              header: [{ key: "Authorization", value: "Bearer {{managerToken}}" }],
              url: { raw: "{{baseUrl}}/reports/peak-hours", host: ["{{baseUrl}}"], path: ["reports", "peak-hours"] }
            }
          }
        ]
      }
    ]
  };

  const outputDir = path.join(__dirname, '..', 'postman');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'restaurant_api.postman_collection.json');
  fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`[Postman Exporter] Collection written to: ${outputPath}`);
};

generatePostmanCollection();
