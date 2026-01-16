// ============================================
// Grove Dashboard - Frontend Application
// ============================================

const API_BASE = '';
const CUSTOMER_ID = 'shaden.chehab@devrev.ai';
const POLL_INTERVAL = 2000; // Poll every 2 seconds

// ============================================
// State
// ============================================
let dashboardData = null;
let pollingTimer = null;

// ============================================
// Initialize Dashboard
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  setupFormListeners();
  startPolling();
});

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/${CUSTOMER_ID}`);
    dashboardData = await response.json();
    
    updateStats(dashboardData.summary);
    renderOrders(dashboardData.orders);
    renderShipments(dashboardData.shipments);
    renderPayments(dashboardData.payments);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Failed to load dashboard data', 'error');
  }
}

// ============================================
// Polling for Real-time Updates
// ============================================
function startPolling() {
  pollingTimer = setInterval(pollForUpdates, POLL_INTERVAL);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function pollForUpdates() {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/${CUSTOMER_ID}`);
    const newData = await response.json();
    
    // Check for shipment changes
    if (dashboardData && dashboardData.shipments) {
      newData.shipments.forEach(newShipment => {
        const oldShipment = dashboardData.shipments.find(s => s.id === newShipment.id);
        if (oldShipment && oldShipment.status !== newShipment.status) {
          // Shipment status changed - update UI with animation
          updateShipmentStatus(
            newShipment.id,
            newShipment.status,
            newShipment.estimatedDelivery,
            newShipment.currentLocation
          );
          showToast(`Shipment ${newShipment.id} is now ${formatStatus(newShipment.status)}!`, 'success');
        }
      });
    }
    
    // Check for payment changes
    if (dashboardData && dashboardData.payments) {
      newData.payments.forEach(newPayment => {
        const oldPayment = dashboardData.payments.find(p => p.id === newPayment.id);
        if (oldPayment && oldPayment.status !== newPayment.status) {
          // Payment status changed - update UI with animation
          updatePaymentInUI(newPayment);
          showToast(`Payment for ${newPayment.orderId} processed!`, 'success');
        }
      });
    }
    
    // Check for order changes
    if (dashboardData && dashboardData.orders) {
      newData.orders.forEach(newOrder => {
        const oldOrder = dashboardData.orders.find(o => o.id === newOrder.id);
        if (oldOrder && oldOrder.status !== newOrder.status) {
          // Order status changed - update UI with animation
          updateOrderStatus(newOrder.id, newOrder.status);
        }
      });
    }
    
    // Update counters if they changed
    if (dashboardData && dashboardData.summary) {
      if (dashboardData.summary.pendingShipments !== newData.summary.pendingShipments) {
        updateStatCounter('pending-shipments', newData.summary.pendingShipments);
      }
      if (dashboardData.summary.pendingPayments !== newData.summary.pendingPayments) {
        updateStatCounter('pending-payments', newData.summary.pendingPayments);
        // Update pending total
        const pendingTotal = document.getElementById('pending-total');
        if (pendingTotal) {
          pendingTotal.textContent = `$${newData.summary.totalPendingAmount.toFixed(2)}`;
        }
      }
    }
    
    // Update local data
    dashboardData = newData;
    
  } catch (error) {
    console.error('Polling error:', error);
  }
}

// Update a payment in the UI when it changes
function updatePaymentInUI(payment) {
  const paymentItem = document.querySelector(`[data-payment-id="${payment.id}"].payment-item`);
  if (paymentItem) {
    // Update the icon
    const icon = paymentItem.querySelector('.payment-icon');
    if (icon) {
      icon.classList.remove('pending');
      icon.classList.add('completed');
      icon.textContent = '✓';
    }
    
    // Update the payment method text
    const methodEl = paymentItem.querySelector('.payment-method');
    if (methodEl) {
      methodEl.textContent = payment.method;
    }
    
    // Remove the due date
    const dueEl = paymentItem.querySelector('.payment-due');
    if (dueEl) {
      dueEl.remove();
    }
    
    // Remove the pay button
    const button = paymentItem.querySelector('.pay-now-btn');
    if (button) {
      button.textContent = '✓ Paid';
      button.classList.add('success');
      button.disabled = true;
      setTimeout(() => {
        button.style.opacity = '0';
        setTimeout(() => button.remove(), 300);
      }, 1000);
    }
    
    // Add success animation
    paymentItem.classList.add('updated');
    setTimeout(() => paymentItem.classList.remove('updated'), 1000);
  }
}

// ============================================
// Update Stats
// ============================================
function updateStats(summary) {
  animateValue('total-orders', summary.totalOrders);
  animateValue('pending-shipments', summary.pendingShipments);
  animateValue('pending-payments', summary.pendingPayments);
}

function animateValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const currentValue = parseInt(element.textContent) || 0;
  
  if (currentValue > value) {
    let current = currentValue;
    const decrement = Math.max(1, Math.floor((currentValue - value) / 10));
    const timer = setInterval(() => {
      current -= decrement;
      if (current <= value) {
        element.textContent = value;
        clearInterval(timer);
        element.classList.add('counter-updated');
        setTimeout(() => element.classList.remove('counter-updated'), 500);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 30);
  } else {
    let current = 0;
    const increment = value / 20;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        element.textContent = value;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 30);
  }
}

function updateStatCounter(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
    element.classList.add('counter-updated');
    setTimeout(() => element.classList.remove('counter-updated'), 500);
  }
}

// ============================================
// Render Orders
// ============================================
function renderOrders(orders) {
  const container = document.getElementById('orders-list');
  
  if (!orders.length) {
    container.innerHTML = '<div class="loading">No orders found</div>';
    return;
  }
  
  container.innerHTML = orders.map(order => {
    const itemCount = order.items ? order.items.length : 0;
    const statusClass = order.status.replace(/_/g, '-');
    return `
    <div class="order-item" data-order-id="${order.id}" onclick="viewOrderDetails('${order.id}')">
      <div class="order-icon">📦</div>
      <div class="order-details">
        <div class="order-id">${order.id}</div>
        <div class="order-date">${formatDate(order.date)} • ${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
        ${order.deliveryDate ? `<div class="order-delivery">Delivered: ${formatDate(order.deliveryDate)}</div>` : ''}
      </div>
      <div class="order-total">$${order.total.toFixed(2)}</div>
      <span class="status-badge status-${statusClass}">${formatStatus(order.status)}</span>
    </div>
  `}).join('');
}

function updateOrderStatus(orderId, newStatus) {
  const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
  if (orderElement) {
    const statusBadge = orderElement.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-badge';
      statusBadge.classList.add(`status-${newStatus}`);
      statusBadge.textContent = formatStatus(newStatus);
      
      orderElement.classList.add('updated');
      setTimeout(() => orderElement.classList.remove('updated'), 1000);
    }
  }
  
  if (dashboardData && dashboardData.orders) {
    const order = dashboardData.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
    }
  }
}

// ============================================
// Render Shipments
// ============================================
function renderShipments(shipments) {
  const container = document.getElementById('shipments-list');
  
  if (!shipments.length) {
    container.innerHTML = '<div class="loading">No shipments found</div>';
    return;
  }
  
  container.innerHTML = shipments.map(shipment => `
    <div class="shipment-item" data-shipment-id="${shipment.id}" data-order-id="${shipment.orderId}">
      <div class="shipment-header">
        <div>
          <div class="shipment-order">Order ${shipment.orderId}</div>
          <div class="shipment-tracking">Tracking: ${shipment.trackingNumber}</div>
        </div>
        <span class="status-badge status-${shipment.status.replace('_', '-')}">${formatStatus(shipment.status)}</span>
      </div>
      <div class="shipment-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${getProgressPercentage(shipment.status)}%"></div>
        </div>
      </div>
      <div class="shipment-location">
        <span class="location-icon">📍</span>
        <span class="location-text">${shipment.currentLocation || "Unknown"}</span>
      </div>
      <div class="shipment-eta">
        <span class="eta-label">Estimated Delivery</span>
        <span class="eta-date ${!shipment.estimatedDelivery ? 'pending-status' : ''}">${shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery) : '—'}</span>
      </div>
    </div>
  `).join('');
}

function updateShipmentStatus(shipmentId, newStatus, estimatedDelivery, location) {
  const shipmentElement = document.querySelector(`[data-shipment-id="${shipmentId}"]`);
  if (shipmentElement) {
    // Update status badge
    const statusBadge = shipmentElement.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-badge';
      statusBadge.classList.add(`status-${newStatus.replace('_', '-')}`);
      statusBadge.textContent = formatStatus(newStatus);
    }
    
    // Update progress bar with animation
    const progressFill = shipmentElement.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.transition = 'width 0.5s ease';
      progressFill.style.width = `${getProgressPercentage(newStatus)}%`;
    }
    
    // Update ETA
    const etaDate = shipmentElement.querySelector('.eta-date');
    if (etaDate && estimatedDelivery) {
      etaDate.textContent = formatDate(estimatedDelivery);
      etaDate.classList.remove('pending-status');
    }
    
    // Update location
    if (location) {
      const locationText = shipmentElement.querySelector('.location-text');
      if (locationText) {
        locationText.textContent = location;
      }
    }
    
    // Add animation
    shipmentElement.classList.add('updated');
    setTimeout(() => shipmentElement.classList.remove('updated'), 1000);
  }
  
  if (dashboardData && dashboardData.shipments) {
    const shipment = dashboardData.shipments.find(s => s.id === shipmentId);
    if (shipment) {
      shipment.status = newStatus;
      if (estimatedDelivery) shipment.estimatedDelivery = estimatedDelivery;
      if (location) shipment.currentLocation = location;
    }
  }
}

function updatePendingShipmentsCount() {
  if (dashboardData && dashboardData.shipments) {
    const pendingCount = dashboardData.shipments.filter(s => s.status === 'pending').length;
    updateStatCounter('pending-shipments', pendingCount);
    
    if (dashboardData.summary) {
      dashboardData.summary.pendingShipments = pendingCount;
    }
  }
}

function getProgressPercentage(status) {
  const progressMap = {
    'pending': 10,
    'in_progress': 30,
    'in_transit': 60,
    'out_for_delivery': 85,
    'delivered': 100
  };
  return progressMap[status] || 0;
}

// ============================================
// Render Payments
// ============================================
function renderPayments(payments) {
  const container = document.getElementById('payments-list');
  const pendingTotal = document.getElementById('pending-total');
  
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  pendingTotal.textContent = `$${totalPending.toFixed(2)}`;
  
  if (!payments.length) {
    container.innerHTML = '<div class="loading">No payments found</div>';
    return;
  }
  
  const sortedPayments = [
    ...payments.filter(p => p.status === 'pending'),
    ...payments.filter(p => p.status === 'completed').slice(0, 2)
  ];
  
  container.innerHTML = sortedPayments.map(payment => `
    <div class="payment-item" data-payment-id="${payment.id}">
      <div class="payment-icon ${payment.status}">
        ${payment.status === 'pending' ? '⏳' : '✓'}
      </div>
      <div class="payment-details">
        <div class="payment-description">${payment.description}</div>
        <div class="payment-method">${payment.method}</div>
      </div>
      <div class="payment-amount">
        <span class="payment-value">$${payment.amount.toFixed(2)}</span>
        ${payment.status === 'pending' ? `
          <span class="payment-due">Due ${formatDate(payment.dueDate)}</span>
        ` : ''}
      </div>
      ${payment.status === 'pending' ? `
        <button class="pay-now-btn" data-payment-id="${payment.id}" onclick="processPayment('${payment.id}')">Pay Now</button>
      ` : ''}
    </div>
  `).join('');
}

// ============================================
// Address Modal
// ============================================
function openAddressModal() {
  const modal = document.getElementById('address-modal');
  modal.classList.add('active');
  updateAddressPreview();
}

function closeAddressModal() {
  const modal = document.getElementById('address-modal');
  modal.classList.remove('active');
}

function setupFormListeners() {
  const inputs = document.querySelectorAll('#address-form input');
  inputs.forEach(input => {
    input.addEventListener('input', updateAddressPreview);
  });
}

function updateAddressPreview() {
  const street = document.getElementById('street').value || '';
  const city = document.getElementById('city').value || '';
  const state = document.getElementById('state').value || '';
  const zipCode = document.getElementById('zipCode').value || '';
  const country = document.getElementById('country').value || 'USA';
  
  const preview = document.getElementById('address-api-preview');
  preview.textContent = `PUT /api/customer/${CUSTOMER_ID}/address
Content-Type: application/json

${JSON.stringify({ street, city, state, zipCode, country }, null, 2)}`;
}

async function submitAddress(event) {
  event.preventDefault();
  
  const formData = {
    street: document.getElementById('street').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zipCode: document.getElementById('zipCode').value,
    country: document.getElementById('country').value
  };
  
  try {
    const response = await fetch(`${API_BASE}/api/customer/${CUSTOMER_ID}/address`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      closeAddressModal();
      showToast(`Address updated! ${result.shipmentsUpdatedCount} shipment(s) now in progress.`, 'success');
    } else {
      showToast(result.error || 'Failed to update address', 'error');
    }
  } catch (error) {
    console.error('Error updating address:', error);
    showToast('Failed to update address', 'error');
  }
}

// ============================================
// Payment Processing
// ============================================
async function processPayment(paymentId) {
  const button = document.querySelector(`button[data-payment-id="${paymentId}"]`);
  const originalText = button ? button.textContent : 'Pay Now';
  
  if (button) {
    button.disabled = true;
    button.textContent = 'Processing...';
    button.classList.add('processing');
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/payment/${paymentId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'Visa ending in 4242' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast('Payment processed successfully!', 'success');
      // Polling will pick up the changes automatically
    } else {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
        button.classList.remove('processing');
      }
      showToast(result.error || 'Failed to process payment', 'error');
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
      button.classList.remove('processing');
    }
    showToast('Failed to process payment. Please try again.', 'error');
  }
}

function updatePendingPaymentsCount() {
  if (dashboardData && dashboardData.payments) {
    const pendingPayments = dashboardData.payments.filter(p => p.status === 'pending');
    const pendingCount = pendingPayments.length;
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    updateStatCounter('pending-payments', pendingCount);
    
    const pendingTotal = document.getElementById('pending-total');
    if (pendingTotal) {
      pendingTotal.textContent = `$${totalPending.toFixed(2)}`;
    }
    
    if (dashboardData.summary) {
      dashboardData.summary.pendingPayments = pendingCount;
      dashboardData.summary.totalPendingAmount = totalPending;
    }
  }
}

// ============================================
// Refresh Functions
// ============================================
async function refreshShipments() {
  try {
    const response = await fetch(`${API_BASE}/api/shipments/${CUSTOMER_ID}`);
    const shipments = await response.json();
    renderShipments(shipments);
    
    if (dashboardData) {
      dashboardData.shipments = shipments;
    }
    
    updatePendingShipmentsCount();
    showToast('Shipments refreshed!', 'success');
  } catch (error) {
    console.error('Error refreshing shipments:', error);
    showToast('Failed to refresh shipments', 'error');
  }
}

function viewOrderDetails(orderId) {
  console.log('View order:', orderId);
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

function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'received': 'Received',
    'delivered': 'Received',
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
    closeAddressModal();
  }
});

// ============================================
// API Testing Functions
// ============================================
async function testApi(endpoint) {
  const urlDisplay = document.getElementById('api-response-url');
  const responseDisplay = document.getElementById('api-response');
  
  if (!urlDisplay || !responseDisplay) return;
  
  urlDisplay.textContent = `GET ${endpoint}`;
  responseDisplay.textContent = 'Loading...';
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const data = await response.json();
    responseDisplay.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    responseDisplay.textContent = `Error: ${error.message}`;
  }
}

async function testPostApi(endpoint, body) {
  const urlDisplay = document.getElementById('api-response-url');
  const responseDisplay = document.getElementById('api-response');
  
  if (!urlDisplay || !responseDisplay) return;
  
  urlDisplay.textContent = `POST ${endpoint}`;
  responseDisplay.textContent = `Request Body:\n${JSON.stringify(body, null, 2)}\n\nLoading...`;
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    responseDisplay.textContent = `Request Body:\n${JSON.stringify(body, null, 2)}\n\nResponse:\n${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    responseDisplay.textContent = `Error: ${error.message}`;
  }
}

function clearApiResponse() {
  const urlDisplay = document.getElementById('api-response-url');
  const responseDisplay = document.getElementById('api-response');
  
  if (urlDisplay) urlDisplay.textContent = 'Click an API endpoint to test';
  if (responseDisplay) responseDisplay.textContent = '// Response will appear here';
}
