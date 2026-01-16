// ============================================
// Grove Customer Dashboard - Frontend
// ============================================

const API_BASE = '';
const CUSTOMER_ID = 'shaden.chehab@devrev.ai';

// ============================================
// State
// ============================================
let ordersData = [];
let shipmentsData = [];

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadCustomerOrders();
  loadCustomerCredit();
});

async function loadCustomerOrders() {
  try {
    // Fetch orders and shipments (encode customer ID for URL)
    const encodedCustomerId = encodeURIComponent(CUSTOMER_ID);
    const [ordersRes, shipmentsRes] = await Promise.all([
      fetch(`${API_BASE}/api/orders/${encodedCustomerId}`),
      fetch(`${API_BASE}/api/shipments/${encodedCustomerId}`)
    ]);
    
    ordersData = await ordersRes.json();
    shipmentsData = await shipmentsRes.json();
    
    renderOrders(ordersData);
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Failed to load orders', 'error');
  }
}

async function loadCustomerCredit() {
  try {
    const encodedCustomerId = encodeURIComponent(CUSTOMER_ID);
    const response = await fetch(`${API_BASE}/api/customer/${encodedCustomerId}/credit`);
    const data = await response.json();
    
    const creditElement = document.getElementById('credit-amount');
    if (creditElement) {
      creditElement.textContent = `$${(data.credit || 0).toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error loading credit:', error);
  }
}

// ============================================
// Render Orders
// ============================================
function renderOrders(orders) {
  const container = document.getElementById('orders-container');
  
  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-orders">
        <div class="empty-orders-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your orders will appear here once you make a purchase.</p>
      </div>
    `;
    return;
  }
  
  // Sort orders by date (newest first)
  const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  container.innerHTML = sortedOrders.map(order => {
    const statusClass = order.status.replace(/_/g, '-');
    const itemNames = order.items ? order.items.slice(0, 3).map(i => i.name) : [];
    const moreItems = order.items && order.items.length > 3 ? order.items.length - 3 : 0;
    
    return `
      <div class="customer-order-card" onclick="viewOrderDetails('${order.id}')">
        <div class="order-card-header">
          <div>
            <div class="order-card-id">${order.id}</div>
            <div class="order-card-date">${formatDate(order.date)}</div>
          </div>
          <span class="order-card-status status-${statusClass}">${formatStatus(order.status)}</span>
        </div>
        <div class="order-card-items">
          ${itemNames.map(name => `<span class="order-item-tag">${name}</span>`).join('')}
          ${moreItems > 0 ? `<span class="order-item-tag">+${moreItems} more</span>` : ''}
        </div>
        <div class="order-card-footer">
          <span class="order-card-total">$${order.total.toFixed(2)}</span>
          <span class="order-card-action">View Details →</span>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// Order Details Modal
// ============================================
function viewOrderDetails(orderId) {
  const order = ordersData.find(o => o.id === orderId);
  if (!order) return;
  
  const shipment = shipmentsData.find(s => s.orderId === orderId);
  const statusClass = order.status.replace(/_/g, '-');
  
  const modalTitle = document.getElementById('modal-order-id');
  const modalBody = document.getElementById('order-modal-body');
  
  modalTitle.textContent = order.id;
  
  modalBody.innerHTML = `
    <div class="order-detail-section">
      <h3>Order Status</h3>
      <div class="order-detail-row">
        <span class="order-detail-label">Status</span>
        <span class="status-badge status-${statusClass}">${formatStatus(order.status)}</span>
      </div>
      <div class="order-detail-row">
        <span class="order-detail-label">Order Date</span>
        <span class="order-detail-value">${formatDate(order.date)}</span>
      </div>
      ${order.deliveryDate ? `
        <div class="order-detail-row">
          <span class="order-detail-label">Delivered On</span>
          <span class="order-detail-value">${formatDate(order.deliveryDate)}</span>
        </div>
      ` : ''}
      ${shipment && shipment.estimatedDelivery ? `
        <div class="order-detail-row">
          <span class="order-detail-label">Estimated Delivery</span>
          <span class="order-detail-value">${formatDate(shipment.estimatedDelivery)}</span>
        </div>
      ` : ''}
    </div>
    
    <div class="order-detail-section">
      <h3>Items</h3>
      <div class="order-items-list">
        ${order.items ? order.items.map(item => `
          <div class="order-item-row">
            <div>
              <span class="order-item-name">${item.name}</span>
              <span class="order-item-qty">× ${item.quantity}</span>
              <span class="order-item-stock ${item.status === 'in_stock' ? 'stock-in-stock' : 'stock-out-of-stock'}">
                ${item.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('') : '<p>No items</p>'}
        <div class="order-total-row">
          <span class="order-total-label">Total</span>
          <span class="order-total-value">$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    
    ${shipment ? `
      <div class="order-detail-section">
        <h3>Tracking</h3>
        ${shipment.trackingNumber ? `
          <div class="order-detail-row">
            <span class="order-detail-label">Tracking Number</span>
            <span class="order-detail-value">${shipment.trackingNumber}</span>
          </div>
        ` : `
          <div class="order-detail-row">
            <span class="order-detail-label">Tracking</span>
            <span class="order-detail-value" style="color: var(--pebble);">Not available yet</span>
          </div>
        `}
        ${shipment.statusHistory && shipment.statusHistory.length > 0 ? `
          <div class="tracking-timeline">
            ${shipment.statusHistory.slice().reverse().map((step, index) => `
              <div class="tracking-step ${index === 0 ? 'active' : 'completed'}">
                <div class="tracking-dot"></div>
                <div class="tracking-status">${formatStatus(step.status)}</div>
                <div class="tracking-time">${formatDateTime(step.timestamp)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    ` : ''}
  `;
  
  document.getElementById('order-modal').classList.add('active');
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('active');
}

// ============================================
// Utilities
// ============================================
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'returned': 'Returned',
    'cancelled': 'Cancelled',
    'eligible_for_cancellation': 'Eligible for Cancellation',
    'in_progress': 'In Progress',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out for Delivery',
    'completed': 'Completed'
  };
  return statusMap[status] || status;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = toast.querySelector('.toast-icon');
  
  if (toastIcon) {
    toastIcon.textContent = type === 'error' ? '✕' : '✓';
    toastIcon.style.backgroundColor = type === 'error' ? '#e74c3c' : 'var(--primary)';
  }
  
  toastMessage.textContent = message;
  toast.classList.add('active');
  if (type === 'error') {
    toast.classList.add('error');
  } else {
    toast.classList.remove('error');
  }
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeOrderModal();
  }
});
