/**
 * The Royal Bistro — Single Page Application Logic
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

// Application State
const state = {
  token: localStorage.getItem('royal_bistro_token') || '',
  user: JSON.parse(localStorage.getItem('royal_bistro_user') || 'null'),
  currentBranchId: '',
  branches: [],
  menuItems: [],
  tables: [],
  cart: [],
  cartPromoCode: '',
  cartOrderType: 'Dine-In',
  activeTab: 'menuTab',
  chartInstances: {}
};

// Preset personas for 1-click evaluation/demo
const PERSONAS = {
  customer: { email: 'john@example.com', pass: 'customer123', name: 'John Doe (Customer)', role: 'customer' },
  kitchen: { email: 'kitchen@restaurant.com', pass: 'kitchen123', name: 'Chef Alessandro (Kitchen)', role: 'kitchen' },
  manager: { email: 'manager@restaurant.com', pass: 'manager123', name: 'Indiranagar Manager', role: 'manager' },
  admin: { email: 'admin@restaurant.com', pass: 'admin123', name: 'System Administrator', role: 'admin' }
};

// ==========================================================================
// API HELPER
// ==========================================================================

async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`/api${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check text-success' : (type === 'error' ? 'fa-circle-exclamation text-danger' : 'fa-circle-info text-info');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// INITIALIZATION & AUTHENTICATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  
  // If no user is logged in, auto-login as customer for instant exploration
  if (!state.token || !state.user) {
    await loginWithPersona('customer');
  } else {
    updateUserDisplay();
  }

  await loadBranches();
  await loadMenuItems();
  await loadTables();
  setupReservationDefaults();
  startLiveKdsPolling();
});

function setupEventListeners() {
  // Persona switcher buttons
  document.querySelectorAll('.persona-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      loginWithPersona(role);
    });
  });

  // Main navigation tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Branch selector
  document.getElementById('globalBranchSelect').addEventListener('change', (e) => {
    state.currentBranchId = e.target.value;
    onBranchChange();
  });

  // Cart open/close triggers
  document.getElementById('cartBtn').addEventListener('click', toggleCartDrawer);
  document.getElementById('closeCartBtn').addEventListener('click', toggleCartDrawer);
  document.getElementById('cartOverlay').addEventListener('click', toggleCartDrawer);

  // Menu search & filters
  document.getElementById('menuSearchInput').addEventListener('input', renderMenuGrid);
  document.getElementById('vegOnlyToggle').addEventListener('change', renderMenuGrid);
  
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenuGrid();
    });
  });

  // Cart actions
  document.querySelectorAll('input[name="cartOrderType"]').forEach(r => {
    r.addEventListener('change', (e) => {
      state.cartOrderType = e.target.value;
      document.getElementById('cartTableSelectGroup').style.display = state.cartOrderType === 'Dine-In' ? 'block' : 'none';
      recalculateCart();
    });
  });

  document.getElementById('applyPromoBtn').addEventListener('click', applyPromoCode);
  document.getElementById('checkoutBtn').addEventListener('click', placeOrder);

  // Reservation Form & Slot selection
  document.getElementById('resBranch').addEventListener('change', refreshReservationSlots);
  document.getElementById('resDate').addEventListener('change', refreshReservationSlots);
  document.getElementById('resGuests').addEventListener('change', refreshReservationSlots);
  document.getElementById('reservationForm').addEventListener('submit', submitReservation);

  // Kitchen Display
  document.getElementById('refreshKdsBtn').addEventListener('click', loadKitchenQueue);

  // History Sub-Tabs
  document.querySelectorAll('.history-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.history-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.history-sub-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.subtab).classList.add('active');
      if (btn.dataset.subtab === 'ordersHistorySubTab') loadCustomerOrders();
      if (btn.dataset.subtab === 'reservationsHistorySubTab') loadCustomerReservations();
      if (btn.dataset.subtab === 'feedbackHistorySubTab') loadCustomerFeedback();
    });
  });

  // Manager Management Sub-Tabs
  document.querySelectorAll('.mgmt-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mgmt-subtab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.mgmt-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.mgmt).classList.add('active');
    });
  });

  // Star Rating Input
  document.querySelectorAll('.star-item').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.rating);
      document.getElementById('feedbackRatingVal').value = val;
      document.querySelectorAll('.star-item').forEach((s, idx) => {
        s.classList.toggle('active', idx < val);
      });
    });
  });

  // Feedback Form
  document.getElementById('feedbackForm').addEventListener('submit', submitFeedbackForm);

  // Modals close button handler
  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    });
  });

  // Auth modal trigger
  document.getElementById('authModalBtn').addEventListener('click', () => {
    openModal('authModal');
  });

  // Quick user login buttons inside Auth Modal
  document.querySelectorAll('.quick-user-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.email;
      const password = btn.dataset.pass;
      await performLogin(email, password);
      closeModal('authModal');
    });
  });

  // Custom Sign-in Form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await performLogin(email, password);
    closeModal('authModal');
  });

  // Add Dish & Table Modals
  document.getElementById('addMenuItemModalBtn').addEventListener('click', () => openModal('addMenuItemModal'));
  document.getElementById('addMenuItemForm').addEventListener('submit', submitNewMenuItem);

  document.getElementById('addTableModalBtn').addEventListener('click', () => openModal('addTableModal'));
  document.getElementById('addTableForm').addEventListener('submit', submitNewTable);
}

// 1-Click Login by Persona
async function loginWithPersona(roleKey) {
  const p = PERSONAS[roleKey];
  if (!p) return;
  await performLogin(p.email, p.pass);
  
  // Highlight persona button
  document.querySelectorAll('.persona-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.role === roleKey);
  });
}

async function performLogin(email, password) {
  try {
    const res = await apiRequest('/auth/login', 'POST', { email, password });
    state.token = res.data.token;
    state.user = res.data.user;

    localStorage.setItem('royal_bistro_token', state.token);
    localStorage.setItem('royal_bistro_user', JSON.stringify(state.user));

    updateUserDisplay();
    showToast(`Logged in as ${state.user.name} (${state.user.role.toUpperCase()})`, 'success');

    // Route / switch view depending on role
    if (state.user.role === 'kitchen') {
      switchTab('kitchenTab');
    } else if (state.user.role === 'manager' || state.user.role === 'admin') {
      switchTab('managerTab');
    } else {
      switchTab('menuTab');
    }
  } catch (err) {
    console.error('Login error:', err);
  }
}

function updateUserDisplay() {
  if (state.user) {
    document.getElementById('userNameLabel').textContent = state.user.name;
    document.getElementById('authModalBtn').innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> ${state.user.role.toUpperCase()}`;
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });

  // Trigger tab-specific refresh
  if (tabId === 'kitchenTab') loadKitchenQueue();
  if (tabId === 'historyTab') loadCustomerOrders();
  if (tabId === 'managerTab') loadManagerReports();
  if (tabId === 'reserveTab') refreshReservationSlots();
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// ==========================================================================
// DATA LOADING
// ==========================================================================

async function loadBranches() {
  try {
    const res = await apiRequest('/branches');
    state.branches = res.data.branches;
    
    const branchSelect = document.getElementById('globalBranchSelect');
    const resBranchSelect = document.getElementById('resBranch');
    const newTableBranch = document.getElementById('newTableBranch');

    branchSelect.innerHTML = '';
    resBranchSelect.innerHTML = '';
    newTableBranch.innerHTML = '';

    state.branches.forEach((b, index) => {
      const opt = `<option value="${b._id}">${b.name} (${b.city})</option>`;
      branchSelect.innerHTML += opt;
      resBranchSelect.innerHTML += opt;
      newTableBranch.innerHTML += opt;
      if (index === 0 && !state.currentBranchId) {
        state.currentBranchId = b._id;
      }
    });

    branchSelect.value = state.currentBranchId;
    renderBranchesTable();
  } catch (err) {
    console.error('Error loading branches:', err);
  }
}

async function onBranchChange() {
  await loadTables();
  await loadMenuItems();
  if (state.activeTab === 'kitchenTab') loadKitchenQueue();
  if (state.activeTab === 'managerTab') loadManagerReports();
  if (state.activeTab === 'reserveTab') refreshReservationSlots();
}

async function loadMenuItems() {
  try {
    const res = await apiRequest(`/menu?branchId=${state.currentBranchId}`);
    state.menuItems = res.data.items;
    renderMenuGrid();
    renderManagementMenuTable();
  } catch (err) {
    console.error('Error loading menu:', err);
  }
}

async function loadTables() {
  try {
    const res = await apiRequest(`/tables?branchId=${state.currentBranchId}`);
    state.tables = res.data.tables;
    
    // Update Cart table dropdown
    const cartTableSelect = document.getElementById('cartTableSelect');
    cartTableSelect.innerHTML = '<option value="">Select Table Number</option>';
    state.tables.forEach(t => {
      cartTableSelect.innerHTML += `<option value="${t._id}">Table ${t.tableNumber} (${t.capacity} seats - ${t.locationZone})</option>`;
    });

    renderManagementTablesTable();
  } catch (err) {
    console.error('Error loading tables:', err);
  }
}

// ==========================================================================
// MENU CATALOG & CART
// ==========================================================================

function renderMenuGrid() {
  const container = document.getElementById('menuGrid');
  const search = document.getElementById('menuSearchInput').value.toLowerCase();
  const vegOnly = document.getElementById('vegOnlyToggle').checked;
  const activeCategory = document.querySelector('.cat-btn.active')?.dataset.category || 'All';

  const filtered = state.menuItems.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchVeg = !vegOnly || item.isVeg;
    const matchSearch = item.name.toLowerCase().includes(search) || item.description.toLowerCase().includes(search);
    return matchCat && matchVeg && matchSearch;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-cart-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-utensils"></i>
        <p>No culinary dishes found matching your filter criteria.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="menu-card ${!item.isAvailable ? 'unavailable' : ''}">
      <div class="card-top">
        <span class="dish-dietary-badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}">
          <i class="fa-solid ${item.isVeg ? 'fa-leaf' : 'fa-drumstick-bite'}"></i>
          ${item.isVeg ? 'VEG' : 'NON-VEG'}
        </span>
        <span class="dish-category-tag">${item.category}</span>
      </div>
      <h3 class="dish-title">${item.name}</h3>
      <p class="dish-desc">${item.description || 'A gourmet culinary delight prepared with seasonal ingredients.'}</p>
      <div class="dish-tags">
        <span class="tag-pill"><i class="fa-solid fa-clock"></i> ${item.preparationTime}m</span>
        ${(item.dietaryTags || []).map(t => `<span class="tag-pill">${t}</span>`).join('')}
      </div>
      <div class="card-footer-action">
        <div>
          <span class="dish-price">₹${item.price.toFixed(2)}</span>
          <div class="dish-rating">
            <i class="fa-solid fa-star"></i> ${item.ratingAverage || 4.8} 
            <span style="color:var(--text-dim);font-size:0.75rem;">(${item.ratingCount || 10}+)</span>
          </div>
        </div>
        ${item.isAvailable 
          ? `<button class="btn-primary btn-sm" onclick="addToCart('${item._id}')"><i class="fa-solid fa-plus"></i> Add</button>`
          : `<span class="badge-status badge-danger">Sold Out</span>`}
      </div>
    </div>
  `).join('');
}

function toggleCartDrawer() {
  document.getElementById('cartDrawer').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

function addToCart(menuItemId) {
  const item = state.menuItems.find(m => m._id === menuItemId);
  if (!item) return;

  const existing = state.cart.find(i => i.menuItemId === menuItemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: 1,
      specialNotes: ''
    });
  }

  updateCartBadge();
  renderCartItems();
  recalculateCart();
  showToast(`Added ${item.name} to basket`, 'success');
}

function updateCartQty(menuItemId, delta) {
  const item = state.cart.find(i => i.menuItemId === menuItemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.menuItemId !== menuItemId);
  }

  updateCartBadge();
  renderCartItems();
  recalculateCart();
}

function updateCartBadge() {
  const totalCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartCountBadge').textContent = totalCount;
}

function renderCartItems() {
  const container = document.getElementById('cartItemsList');
  if (!state.cart.length) {
    container.innerHTML = `
      <div class="empty-cart-state">
        <i class="fa-solid fa-bowl-food"></i>
        <p>Your basket is currently empty.</p>
        <span>Add signature dishes from the menu to start.</span>
      </div>`;
    return;
  }

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)} (₹${item.price} each)</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateCartQty('${item.menuItemId}', -1)">-</button>
        <span style="font-weight:700;font-size:0.9rem;">${item.quantity}</span>
        <button class="qty-btn" onclick="updateCartQty('${item.menuItemId}', 1)">+</button>
      </div>
    </div>
  `).join('');
}

async function recalculateCart() {
  if (!state.cart.length) {
    document.getElementById('billSubtotal').textContent = '₹0.00';
    document.getElementById('billTax').textContent = '₹0.00';
    document.getElementById('billServiceCharge').textContent = '₹0.00';
    document.getElementById('billGrandTotal').textContent = '₹0.00';
    document.getElementById('billDiscountRow').style.display = 'none';
    return;
  }

  try {
    const res = await apiRequest('/billing/calculate', 'POST', {
      items: state.cart,
      promoCode: state.cartPromoCode,
      orderType: state.cartOrderType
    });

    const b = res.data.billing;
    document.getElementById('billSubtotal').textContent = `₹${b.subtotal.toFixed(2)}`;
    document.getElementById('billTax').textContent = `₹${b.taxAmount.toFixed(2)}`;
    document.getElementById('billServiceCharge').textContent = `₹${b.serviceCharge.toFixed(2)}`;
    document.getElementById('billGrandTotal').textContent = `₹${b.totalAmount.toFixed(2)}`;

    if (b.discountAmount > 0) {
      document.getElementById('billDiscountRow').style.display = 'flex';
      document.getElementById('billDiscount').textContent = `-₹${b.discountAmount.toFixed(2)} (${b.appliedPromo})`;
    } else {
      document.getElementById('billDiscountRow').style.display = 'none';
    }
  } catch (err) {
    console.error('Error calculating bill:', err);
  }
}

function applyPromoCode() {
  const code = document.getElementById('promoCodeInput').value.trim().toUpperCase();
  const feedback = document.getElementById('promoFeedback');

  if (!code) {
    state.cartPromoCode = '';
    feedback.textContent = '';
    recalculateCart();
    return;
  }

  state.cartPromoCode = code;
  recalculateCart().then(() => {
    feedback.innerHTML = `<span class="text-success"><i class="fa-solid fa-check"></i> Applied ${code} promo!</span>`;
  });
}

async function placeOrder() {
  if (!state.cart.length) {
    showToast('Your cart is empty. Please add menu items before checkout.', 'error');
    return;
  }

  const orderType = state.cartOrderType;
  const tableId = document.getElementById('cartTableSelect').value;

  if (orderType === 'Dine-In' && !tableId) {
    showToast('Please select a Table Number for your Dine-In order.', 'warning');
    return;
  }

  try {
    const payload = {
      branchId: state.currentBranchId,
      orderType,
      tableId: tableId || null,
      items: state.cart,
      promoCode: state.cartPromoCode || null,
      paymentMethod: 'UPI'
    };

    const res = await apiRequest('/orders', 'POST', payload);
    showToast(`Order #${res.data.orderNumber} placed successfully!`, 'success');

    // Clear cart
    state.cart = [];
    state.cartPromoCode = '';
    document.getElementById('promoCodeInput').value = '';
    updateCartBadge();
    renderCartItems();
    recalculateCart();
    toggleCartDrawer();

    // Switch to history tab to view order
    switchTab('historyTab');
  } catch (err) {
    console.error('Order placement failed:', err);
  }
}

// ==========================================================================
// TABLE RESERVATION ENGINE
// ==========================================================================

function setupReservationDefaults() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('resDate').value = today;
  document.getElementById('resDate').min = today;
  refreshReservationSlots();
}

async function refreshReservationSlots() {
  const branchId = document.getElementById('resBranch').value || state.currentBranchId;
  const date = document.getElementById('resDate').value;
  const guests = document.getElementById('resGuests').value;

  if (!branchId || !date) return;

  // Update Summary Preview
  const branchObj = state.branches.find(b => b._id === branchId);
  document.getElementById('previewBranch').textContent = branchObj ? branchObj.name : 'Selected Branch';
  document.getElementById('previewGuests').textContent = `${guests} Guests`;

  try {
    const res = await apiRequest(`/reservations/available-slots?branchId=${branchId}&date=${date}&guestsCount=${guests}`);
    const slots = res.data.slots;
    const grid = document.getElementById('timeSlotsGrid');

    grid.innerHTML = slots.map(s => `
      <button type="button" class="slot-btn ${!s.isAvailable ? 'disabled' : ''}" 
              data-slot="${s.timeSlot}" ${!s.isAvailable ? 'disabled title="Slot Fully Booked"' : ''}>
        ${s.timeSlot}
      </button>
    `).join('');

    // Attach click handler to slots
    grid.querySelectorAll('.slot-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const slot = btn.dataset.slot;
        document.getElementById('selectedTimeSlot').value = slot;
        document.getElementById('previewDateSlot').textContent = `${date} at ${slot}`;
        loadAvailableTablesForSlot(branchId, date, slot, guests);
      });
    });

    // Auto-select first available slot if any
    const firstAvailable = grid.querySelector('.slot-btn:not(.disabled)');
    if (firstAvailable) firstAvailable.click();

  } catch (err) {
    console.error('Error fetching slots:', err);
  }
}

async function loadAvailableTablesForSlot(branchId, date, timeSlot, guests) {
  try {
    const res = await apiRequest(`/tables/available?branchId=${branchId}&date=${date}&timeSlot=${timeSlot}&guestsCount=${guests}`);
    const tableSelect = document.getElementById('resTableSelect');
    tableSelect.innerHTML = '<option value="">Auto-allocate best fit table</option>';
    
    res.data.availableTables.forEach(t => {
      tableSelect.innerHTML += `<option value="${t._id}">Table ${t.tableNumber} (${t.capacity} seats • ${t.locationZone})</option>`;
    });
  } catch (err) {
    console.error('Error loading available tables:', err);
  }
}

async function submitReservation(e) {
  e.preventDefault();

  const branchId = document.getElementById('resBranch').value;
  const reservationDate = document.getElementById('resDate').value;
  const timeSlot = document.getElementById('selectedTimeSlot').value;
  const guestsCount = parseInt(document.getElementById('resGuests').value);
  const tableId = document.getElementById('resTableSelect').value;
  const specialRequests = document.getElementById('resSpecialNotes').value;

  if (!timeSlot) {
    showToast('Please select an available dining time slot', 'warning');
    return;
  }

  try {
    const payload = {
      branchId,
      reservationDate,
      timeSlot,
      guestsCount,
      tableId: tableId || undefined,
      specialRequests
    };

    const res = await apiRequest('/reservations', 'POST', payload);
    showToast('Table reserved successfully! Your slot has been confirmed.', 'success');
    
    // Switch to history tab to view confirmed reservation
    switchTab('historyTab');
    document.querySelector('[data-subtab="reservationsHistorySubTab"]').click();
  } catch (err) {
    console.error('Reservation booking failed:', err);
  }
}

// ==========================================================================
// KITCHEN DISPLAY SYSTEM (KDS)
// ==========================================================================

async function loadKitchenQueue() {
  try {
    const res = await apiRequest(`/kitchen/queue?branchId=${state.currentBranchId}`);
    const { queue, placedCount, preparingCount, readyCount } = res.data;

    // Update Header indicators & Metrics
    document.getElementById('kitchenOrdersPulse').textContent = placedCount + preparingCount;
    document.getElementById('kdsPlacedCount').textContent = placedCount;
    document.getElementById('kdsPreparingCount').textContent = preparingCount;
    document.getElementById('kdsReadyCount').textContent = readyCount;

    document.getElementById('colPlacedCount').textContent = placedCount;
    document.getElementById('colPreparingCount').textContent = preparingCount;
    document.getElementById('colReadyCount').textContent = readyCount;

    // Filter queue by columns
    const placedList = queue.filter(o => o.status === 'Placed');
    const preparingList = queue.filter(o => o.status === 'Preparing');
    const readyList = queue.filter(o => o.status === 'Ready');

    renderKdsCards('placedCardsList', placedList, 'Preparing', 'Start Cooking 👨‍🍳');
    renderKdsCards('preparingCardsList', preparingList, 'Ready', 'Mark as Ready 🍽️');
    renderKdsCards('readyCardsList', readyList, 'Served', 'Serve to Table 🚀');

    // Load additional metrics
    const metricsRes = await apiRequest(`/kitchen/metrics?branchId=${state.currentBranchId}`);
    document.getElementById('kdsCompletedToday').textContent = metricsRes.data.completedToday;

  } catch (err) {
    console.error('Error fetching kitchen queue:', err);
  }
}

function renderKdsCards(elementId, orders, nextStatus, nextActionLabel) {
  const container = document.getElementById(elementId);
  if (!orders.length) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:0.85rem;">No active orders in this column.</div>';
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="kds-ticket ${order.isUrgent ? 'urgent' : ''}">
      <div class="ticket-header">
        <span class="ticket-order-num">#${order.orderNumber}</span>
        <span class="ticket-timer"><i class="fa-solid fa-clock"></i> ${order.elapsedMinutes}m ago (${order.remainingMinutes}m left)</span>
      </div>
      <div class="ticket-meta">
        <span><i class="fa-solid fa-chair"></i> ${order.tableNumber}</span>
        <span><i class="fa-solid fa-utensils"></i> ${order.orderType}</span>
        <span><i class="fa-solid fa-user"></i> ${order.customerName}</span>
      </div>
      <div class="ticket-items">
        ${order.items.map(item => `
          <div class="ticket-item-row">
            <div>
              <span class="ticket-item-qty">${item.quantity}x</span>
              <span>${item.name}</span>
              ${item.specialNotes ? `<div class="ticket-notes">"${item.specialNotes}"</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn-primary btn-block btn-sm" onclick="advanceOrderStatus('${order._id}', '${nextStatus}')">
        ${nextActionLabel}
      </button>
    </div>
  `).join('');
}

async function advanceOrderStatus(orderId, nextStatus) {
  try {
    await apiRequest(`/kitchen/orders/${orderId}/status`, 'PUT', {
      status: nextStatus,
      remarks: `Kitchen staff advanced status to ${nextStatus}`
    });
    showToast(`Order status advanced to ${nextStatus}`, 'success');
    loadKitchenQueue();
  } catch (err) {
    console.error('Failed to advance order status:', err);
  }
}

function startLiveKdsPolling() {
  setInterval(() => {
    if (state.activeTab === 'kitchenTab') {
      loadKitchenQueue();
    }
  }, 10000); // 10 seconds auto-refresh simulation
}

// ==========================================================================
// CUSTOMER HISTORY, INVOICES & FEEDBACK
// ==========================================================================

async function loadCustomerOrders() {
  const container = document.getElementById('customerOrdersList');
  try {
    const res = await apiRequest('/orders/my-history');
    const orders = res.data.orders;

    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-cart-state">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <p>You haven't placed any food orders yet.</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <h3 style="font-size:1.1rem;color:#fff;">Order #${order.orderNumber}</h3>
            <span style="font-size:0.8rem;color:var(--text-muted);">${new Date(order.createdAt).toLocaleString()} • ${order.orderType}</span>
          </div>
          <span class="badge-status ${getOrderBadgeClass(order.status)}">${order.status}</span>
        </div>
        <div style="font-size:0.88rem;color:var(--text-main);margin-bottom:14px;">
          ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
          <span style="font-size:1.1rem;font-weight:800;color:var(--primary);">Total: ₹${order.totalAmount.toFixed(2)}</span>
          <div style="display:flex;gap:10px;">
            <button class="btn-secondary btn-sm" onclick="viewOrderInvoice('${order._id}')">
              <i class="fa-solid fa-file-invoice"></i> Invoice
            </button>
            ${['Served', 'Delivered'].includes(order.status) ? `
              <button class="btn-primary btn-sm" onclick="openFeedbackModal('${order._id}')">
                <i class="fa-solid fa-star"></i> Review
              </button>
            ` : ''}
            ${order.status === 'Placed' ? `
              <button class="btn-secondary btn-sm text-danger" onclick="cancelCustomerOrder('${order._id}')">
                Cancel
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading order history:', err);
  }
}

function getOrderBadgeClass(status) {
  if (status === 'Placed') return 'badge-warning';
  if (status === 'Preparing') return 'badge-info';
  if (status === 'Ready') return 'badge-success';
  if (status === 'Served' || status === 'Delivered') return 'badge-purple';
  return 'badge-danger';
}

async function viewOrderInvoice(orderId) {
  try {
    const res = await apiRequest(`/billing/orders/${orderId}/invoice`);
    const inv = res.data.invoice;
    const body = document.getElementById('invoiceModalBody');

    body.innerHTML = `
      <div style="text-align:center;border-bottom:1px dashed rgba(255,255,255,0.1);padding-bottom:14px;margin-bottom:16px;">
        <h2 style="font-family:'Playfair Display',serif;color:var(--primary);">${inv.restaurant.name}</h2>
        <p style="font-size:0.82rem;color:var(--text-muted);">${inv.restaurant.address}, ${inv.restaurant.city}</p>
        <span style="font-size:0.75rem;color:var(--text-dim);">${inv.invoiceNumber} • ${new Date(inv.orderDate).toLocaleString()}</span>
      </div>
      <div style="margin-bottom:14px;font-size:0.85rem;">
        <div><strong>Customer:</strong> ${inv.customer.name} (${inv.customer.phone || 'N/A'})</div>
        <div><strong>Dining:</strong> ${inv.diningDetails.orderType} (Table: ${inv.diningDetails.tableNumber})</div>
      </div>
      <table class="styled-table" style="margin-bottom:16px;">
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${inv.lineItems.map(i => `
            <tr>
              <td>${i.name}</td>
              <td>${i.quantity}</td>
              <td>₹${i.unitPrice}</td>
              <td>₹${i.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="bill-summary" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;">
        <div class="bill-row"><span>Subtotal:</span> <span>₹${inv.pricingBreakdown.subtotal.toFixed(2)}</span></div>
        ${inv.pricingBreakdown.discountAmount > 0 ? `
          <div class="bill-row discount-row"><span>Discount (${inv.pricingBreakdown.promoCode}):</span> <span>-₹${inv.pricingBreakdown.discountAmount.toFixed(2)}</span></div>
        ` : ''}
        <div class="bill-row"><span>Tax (${inv.pricingBreakdown.taxRate}):</span> <span>₹${inv.pricingBreakdown.taxAmount.toFixed(2)}</span></div>
        <div class="bill-row"><span>Service Charge (${inv.pricingBreakdown.serviceChargeRate}):</span> <span>₹${inv.pricingBreakdown.serviceCharge.toFixed(2)}</span></div>
        <div class="bill-row total-row"><span>Grand Total:</span> <strong>₹${inv.pricingBreakdown.grandTotal.toFixed(2)}</strong></div>
      </div>
      <div style="font-size:0.82rem;color:#34d399;margin-top:10px;">
        <i class="fa-solid fa-shield-check"></i> Payment Status: <strong>${inv.payment.status} (${inv.payment.method})</strong>
      </div>
    `;

    openModal('invoiceModal');
  } catch (err) {
    console.error('Invoice error:', err);
  }
}

async function cancelCustomerOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    await apiRequest(`/orders/${orderId}/cancel`, 'POST', { reason: 'Customer cancelled from dashboard' });
    showToast('Order cancelled successfully', 'success');
    loadCustomerOrders();
  } catch (err) {
    console.error('Cancel order failed:', err);
  }
}

async function loadCustomerReservations() {
  const container = document.getElementById('customerReservationsList');
  try {
    const res = await apiRequest('/reservations');
    const reservations = res.data.reservations;

    if (!reservations.length) {
      container.innerHTML = `
        <div class="empty-cart-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>No table reservations found.</p>
        </div>`;
      return;
    }

    container.innerHTML = reservations.map(r => `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <h3 style="font-size:1.1rem;color:#fff;"><i class="fa-solid fa-store"></i> ${r.branchId?.name || 'Branch'}</h3>
            <span style="font-size:0.84rem;color:var(--primary);font-weight:700;">
              <i class="fa-solid fa-calendar-day"></i> ${r.reservationDate} at ${r.timeSlot}
            </span>
          </div>
          <span class="badge-status ${r.status === 'Confirmed' ? 'badge-success' : 'badge-danger'}">${r.status}</span>
        </div>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">
          <span><i class="fa-solid fa-chair"></i> Table ${r.tableId?.tableNumber || 'Auto'} (${r.guestsCount} Guests - ${r.tableId?.locationZone || 'Main Hall'})</span>
          ${r.specialRequests ? `<div style="color:#93c5fd;margin-top:4px;">"${r.specialRequests}"</div>` : ''}
        </div>
        ${r.status === 'Confirmed' ? `
          <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;display:flex;justify-content:flex-end;">
            <button class="btn-secondary btn-sm text-danger" onclick="cancelReservation('${r._id}')">
              <i class="fa-solid fa-ban"></i> Cancel Table Booking
            </button>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading reservations:', err);
  }
}

async function cancelReservation(resId) {
  if (!confirm('Are you sure you want to cancel this table reservation?')) return;
  try {
    await apiRequest(`/reservations/${resId}/cancel`, 'POST', { reason: 'Customer cancelled from dashboard' });
    showToast('Reservation cancelled successfully', 'success');
    loadCustomerReservations();
  } catch (err) {
    console.error('Cancel reservation failed:', err);
  }
}

function openFeedbackModal(orderId) {
  document.getElementById('feedbackOrderId').value = orderId;
  openModal('feedbackModal');
}

async function submitFeedbackForm(e) {
  e.preventDefault();
  const orderId = document.getElementById('feedbackOrderId').value;
  const rating = parseInt(document.getElementById('feedbackRatingVal').value);
  const foodRating = parseInt(document.getElementById('feedbackFoodVal').value);
  const serviceRating = parseInt(document.getElementById('feedbackServiceVal').value);
  const comment = document.getElementById('feedbackComment').value;

  try {
    await apiRequest('/feedback', 'POST', {
      orderId,
      rating,
      foodRating,
      serviceRating,
      comment
    });
    showToast('Thank you! Your dining feedback has been recorded.', 'success');
    closeModal('feedbackModal');
    loadCustomerOrders();
  } catch (err) {
    console.error('Feedback error:', err);
  }
}

async function loadCustomerFeedback() {
  const container = document.getElementById('customerFeedbackList');
  try {
    const res = await apiRequest('/feedback/my-feedback');
    const feedbackList = res.data.feedback;

    if (!feedbackList.length) {
      container.innerHTML = '<div class="empty-cart-state"><p>You haven\'t submitted any reviews yet.</p></div>';
      return;
    }

    container.innerHTML = feedbackList.map(f => `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <strong style="color:#fff;">${f.branchId?.name} (Order #${f.orderId?.orderNumber})</strong>
          <span style="color:#fbbf24;font-size:0.95rem;">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
        </div>
        <p style="font-size:0.88rem;color:var(--text-muted);">${f.comment || 'No review comments provided.'}</p>
        <span style="font-size:0.75rem;color:var(--text-dim);">${new Date(f.createdAt).toLocaleDateString()}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading feedback:', err);
  }
}

// ==========================================================================
// MANAGER REPORTS & ANALYTICS
// ==========================================================================

async function loadManagerReports() {
  try {
    // 1. Dashboard KPI Summary
    const kpiRes = await apiRequest(`/reports/dashboard-summary?branchId=${state.currentBranchId}`);
    const kpis = kpiRes.data;
    document.getElementById('kpiTodayRevenue').textContent = `₹${kpis.todayRevenue.toFixed(2)}`;
    document.getElementById('kpiTodayOrders').textContent = kpis.todayOrdersCount;
    document.getElementById('kpiActiveReservations').textContent = kpis.activeReservations;
    document.getElementById('kpiSatisfaction').textContent = `${kpis.customerSatisfaction.averageRating} / 5 (${kpis.customerSatisfaction.totalReviews} Reviews)`;

    // 2. Sales & Revenue Analytics
    const salesRes = await apiRequest(`/reports/sales?branchId=${state.currentBranchId}`);
    renderRevenueChart(salesRes.data.dailySales);
    renderOrderTypeChart(salesRes.data.orderTypeSplit);

    // 3. Popular Dishes Report
    const dishesRes = await apiRequest(`/reports/popular-dishes?branchId=${state.currentBranchId}&limit=5`);
    renderPopularDishesChart(dishesRes.data.popularDishes);

    // 4. Peak Hours Distribution
    const peakRes = await apiRequest(`/reports/peak-hours?branchId=${state.currentBranchId}`);
    renderPeakHoursChart(peakRes.data.hourlyOrders);

  } catch (err) {
    console.error('Manager reports error:', err);
  }
}

function renderRevenueChart(dailySales) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (state.chartInstances.revenue) state.chartInstances.revenue.destroy();

  const labels = dailySales.length ? dailySales.map(d => d.date) : ['Today'];
  const data = dailySales.length ? dailySales.map(d => d.revenue) : [0];

  state.chartInstances.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₹)',
        data,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
      }
    }
  });
}

function renderPopularDishesChart(popularDishes) {
  const ctx = document.getElementById('popularDishesChart').getContext('2d');
  if (state.chartInstances.popular) state.chartInstances.popular.destroy();

  const labels = popularDishes.length ? popularDishes.map(d => d.name) : ['No Dishes Sold Yet'];
  const data = popularDishes.length ? popularDishes.map(d => d.totalQuantitySold) : [0];

  state.chartInstances.popular = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
    }
  });
}

function renderPeakHoursChart(hourlyOrders) {
  const ctx = document.getElementById('peakHoursChart').getContext('2d');
  if (state.chartInstances.peak) state.chartInstances.peak.destroy();

  const labels = hourlyOrders.length ? hourlyOrders.map(h => h.formattedHour) : ['12:00', '13:00', '19:00', '20:00', '21:00'];
  const data = hourlyOrders.length ? hourlyOrders.map(h => h.orderCount) : [0, 0, 0, 0, 0];

  state.chartInstances.peak = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Orders Count',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
      }
    }
  });
}

function renderOrderTypeChart(orderTypeSplit) {
  const ctx = document.getElementById('orderTypeChart').getContext('2d');
  if (state.chartInstances.orderType) state.chartInstances.orderType.destroy();

  const labels = orderTypeSplit.length ? orderTypeSplit.map(o => o._id) : ['Dine-In', 'Takeaway'];
  const data = orderTypeSplit.length ? orderTypeSplit.map(o => o.count) : [1, 1];

  state.chartInstances.orderType = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#10b981', '#3b82f6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
    }
  });
}

// ==========================================================================
// MANAGER CRUD TABLES
// ==========================================================================

function renderManagementMenuTable() {
  const tbody = document.getElementById('mgmtMenuTableBody');
  tbody.innerHTML = state.menuItems.map(item => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td><span class="badge-status ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span></td>
      <td>${item.preparationTime} mins</td>
      <td>
        <button class="btn-secondary btn-sm" onclick="toggleDishAvailability('${item._id}', ${!item.isAvailable})">
          ${item.isAvailable ? '<span class="text-success"><i class="fa-solid fa-check"></i> Available</span>' : '<span class="text-danger"><i class="fa-solid fa-ban"></i> Disabled</span>'}
        </button>
      </td>
      <td>
        <button class="btn-secondary btn-sm text-danger" onclick="deleteMenuItem('${item._id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function toggleDishAvailability(id, isAvailable) {
  try {
    await apiRequest(`/menu/${id}/toggle-availability`, 'PATCH', { isAvailable });
    showToast('Menu item availability updated', 'success');
    loadMenuItems();
  } catch (err) {
    console.error('Toggle dish error:', err);
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Are you sure you want to delete this menu item?')) return;
  try {
    await apiRequest(`/menu/${id}`, 'DELETE');
    showToast('Menu item deleted', 'success');
    loadMenuItems();
  } catch (err) {
    console.error('Delete dish error:', err);
  }
}

async function submitNewMenuItem(e) {
  e.preventDefault();
  const name = document.getElementById('newDishName').value;
  const category = document.getElementById('newDishCategory').value;
  const price = parseFloat(document.getElementById('newDishPrice').value);
  const isVeg = document.getElementById('newDishIsVeg').value === 'true';
  const preparationTime = parseInt(document.getElementById('newDishPrepTime').value);
  const description = document.getElementById('newDishDescription').value;

  try {
    await apiRequest('/menu', 'POST', {
      branchId: state.currentBranchId,
      name,
      category,
      price,
      isVeg,
      preparationTime,
      description
    });
    showToast(`Created menu dish '${name}'`, 'success');
    closeModal('addMenuItemModal');
    document.getElementById('addMenuItemForm').reset();
    loadMenuItems();
  } catch (err) {
    console.error('Create dish error:', err);
  }
}

function renderManagementTablesTable() {
  const tbody = document.getElementById('mgmtTablesTableBody');
  tbody.innerHTML = state.tables.map(t => `
    <tr>
      <td>${t.branchId?.name || 'Indiranagar'}</td>
      <td><strong>${t.tableNumber}</strong></td>
      <td>${t.capacity} Seats</td>
      <td>${t.locationZone}</td>
      <td><span class="badge-status badge-success">Active</span></td>
      <td>
        <button class="btn-secondary btn-sm text-danger" onclick="deleteTable('${t._id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

async function submitNewTable(e) {
  e.preventDefault();
  const branchId = document.getElementById('newTableBranch').value;
  const tableNumber = document.getElementById('newTableNumber').value;
  const capacity = parseInt(document.getElementById('newTableCapacity').value);
  const locationZone = document.getElementById('newTableZone').value;

  try {
    await apiRequest('/tables', 'POST', {
      branchId,
      tableNumber,
      capacity,
      locationZone
    });
    showToast(`Table ${tableNumber} added successfully`, 'success');
    closeModal('addTableModal');
    document.getElementById('addTableForm').reset();
    loadTables();
  } catch (err) {
    console.error('Create table error:', err);
  }
}

async function deleteTable(tableId) {
  if (!confirm('Are you sure you want to remove this table?')) return;
  try {
    await apiRequest(`/tables/${tableId}`, 'DELETE');
    showToast('Table removed', 'success');
    loadTables();
  } catch (err) {
    console.error('Delete table error:', err);
  }
}

function renderBranchesTable() {
  const tbody = document.getElementById('mgmtBranchesTableBody');
  tbody.innerHTML = state.branches.map(b => `
    <tr>
      <td><strong>${b.name}</strong></td>
      <td>${b.city}</td>
      <td>${b.address}</td>
      <td>${b.phone}</td>
      <td>${b.seatingCapacity} Seats</td>
      <td>${b.openingTime} - ${b.closingTime}</td>
    </tr>
  `).join('');
}
