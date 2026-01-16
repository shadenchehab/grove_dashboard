const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// MOCK DATA - In-memory database
// ============================================

// Status enums for delivery events
const DeliveryStatus = {
  ORDER_PLACED: 'order_placed',
  RECEIVED: 'received',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  RETURNED: 'returned'
};

// Order status enum (limited to: delivered, pending, received, returned, shipped, eligible_for_cancellation, cancelled)
const OrderStatus = {
  PENDING: 'pending',
  RECEIVED: 'received',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  ELIGIBLE_FOR_CANCELLATION: 'eligible_for_cancellation',
  CANCELLED: 'cancelled'
};

// Item status enum
const ItemStatus = {
  IN_STOCK: 'in_stock',
  OUT_OF_STOCK: 'out_of_stock'
};

// ============================================
// ITEMS CATALOG
// ============================================
const itemsCatalog = [
  { item_id: "ITEM-001", name: "Shampoo", price: 12.99 },
  { item_id: "ITEM-002", name: "Cream", price: 18.50 },
  { item_id: "ITEM-003", name: "Lotion", price: 15.00 },
  { item_id: "ITEM-004", name: "Soap", price: 5.99 },
  { item_id: "ITEM-005", name: "Milk", price: 4.50 },
  { item_id: "ITEM-006", name: "Tea", price: 8.99 },
  { item_id: "ITEM-007", name: "Oil", price: 22.00 },
  { item_id: "ITEM-008", name: "Bread", price: 3.50 },
  { item_id: "ITEM-009", name: "Bags", price: 14.99 },
  { item_id: "ITEM-010", name: "Cups", price: 9.99 }
];

// ============================================
// 1. ORDERS TABLE
// ============================================
let orders = [
  // Order 1: Shipped, NO tracking number
  {
    order_id: "ORD-2026-001",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.SHIPPED,
    created_at: "2026-01-10T10:00:00Z",
    fulfillment_id: "FUL-001",
    items: [
      { item_id: "ITEM-001", name: "Shampoo", price: 12.99, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-004", name: "Soap", price: 5.99, quantity: 2, status: ItemStatus.IN_STOCK }
    ],
    total: 24.97
  },
  // Order 2: Shipped, NO tracking number
  {
    order_id: "ORD-2026-002",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.SHIPPED,
    created_at: "2026-01-11T14:30:00Z",
    fulfillment_id: "FUL-002",
    items: [
      { item_id: "ITEM-003", name: "Lotion", price: 15.00, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-006", name: "Tea", price: 8.99, quantity: 1, status: ItemStatus.OUT_OF_STOCK },
      { item_id: "ITEM-008", name: "Bread", price: 3.50, quantity: 2, status: ItemStatus.IN_STOCK }
    ],
    total: 30.99
  },
  // Order 3: Shipped, last tracking update on Jan 15, 2026
  {
    order_id: "ORD-2026-003",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.SHIPPED,
    created_at: "2026-01-12T09:00:00Z",
    fulfillment_id: "FUL-003",
    items: [
      { item_id: "ITEM-007", name: "Oil", price: 22.00, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-002", name: "Cream", price: 18.50, quantity: 2, status: ItemStatus.IN_STOCK }
    ],
    total: 59.00
  },
  // Order 4: Returned
  {
    order_id: "ORD-2026-004",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.RETURNED,
    created_at: "2026-01-05T11:00:00Z",
    fulfillment_id: "FUL-004",
    items: [
      { item_id: "ITEM-009", name: "Bags", price: 14.99, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-010", name: "Cups", price: 9.99, quantity: 3, status: ItemStatus.OUT_OF_STOCK }
    ],
    total: 44.96
  },
  // Order 5: Delivered on Jan 15, 2026
  {
    order_id: "ORD-2026-005",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.RECEIVED,
    created_at: "2026-01-08T08:00:00Z",
    fulfillment_id: "FUL-005",
    items: [
      { item_id: "ITEM-005", name: "Milk", price: 4.50, quantity: 2, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-001", name: "Shampoo", price: 12.99, quantity: 1, status: ItemStatus.IN_STOCK }
    ],
    total: 21.99
  },
  // Order 6: Delivered on Jan 16, 2026
  {
    order_id: "ORD-2026-006",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.RECEIVED,
    created_at: "2026-01-09T16:00:00Z",
    fulfillment_id: "FUL-006",
    items: [
      { item_id: "ITEM-002", name: "Cream", price: 18.50, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-003", name: "Lotion", price: 15.00, quantity: 1, status: ItemStatus.OUT_OF_STOCK },
      { item_id: "ITEM-004", name: "Soap", price: 5.99, quantity: 1, status: ItemStatus.IN_STOCK }
    ],
    total: 39.49
  },
  // Order 7: ELIGIBLE FOR CANCELLATION - no estimated delivery time
  {
    order_id: "ORD-2026-007",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.ELIGIBLE_FOR_CANCELLATION,
    created_at: "2026-01-14T10:00:00Z",
    fulfillment_id: "FUL-007",
    items: [
      { item_id: "ITEM-006", name: "Tea", price: 8.99, quantity: 2, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-007", name: "Oil", price: 22.00, quantity: 1, status: ItemStatus.OUT_OF_STOCK }
    ],
    total: 39.98
  },
  // Order 8: DELIVERED on Nov 1, 2025 - one item is $20
  {
    order_id: "ORD-2025-008",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.RECEIVED,
    created_at: "2025-10-25T09:00:00Z",
    delivery_date: "2025-11-01T14:00:00Z",
    fulfillment_id: "FUL-008",
    items: [
      { item_id: "ITEM-011", name: "Premium Lotion", price: 20.00, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-004", name: "Soap", price: 5.99, quantity: 2, status: ItemStatus.IN_STOCK }
    ],
    total: 31.98
  },
  // Order 9: SHIPPED - 3 items all in stock, total $110 (items: $10, $40, $60), delivery Nov 30, 2025
  {
    order_id: "ORD-2026-009",
    customer_id: "shaden.chehab@devrev.ai",
    order_status: OrderStatus.SHIPPED,
    created_at: "2025-11-20T11:00:00Z",
    delivery_date: "2025-11-30T14:00:00Z",
    fulfillment_id: "FUL-009",
    items: [
      { item_id: "ITEM-012", name: "Travel Bags", price: 10.00, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-013", name: "Luxury Cream Set", price: 40.00, quantity: 1, status: ItemStatus.IN_STOCK },
      { item_id: "ITEM-014", name: "Premium Oil Collection", price: 60.00, quantity: 1, status: ItemStatus.IN_STOCK }
    ],
    total: 110.00
  }
];

// ============================================
// 2. SHIPMENTS TABLE (with embedded Address)
// ============================================
const defaultAddress = {
  shipment_address_id: "ADDR-001",
  recipient_name: "Sarah Mitchell",
  phone: "(555) 123-4567",
  address_line_1: "742 Evergreen Terrace",
  city: "Springfield",
  state: "IL",
  postal_code: "62701",
  country: "USA"
};

let shipments = [
  // Shipment 1: For ORD-2026-001 (shipped, NO tracking number)
  {
    shipment_id: "SHIP-001",
    order_id: "ORD-2026-001",
    tracking_number: null,  // NO tracking number
    estimated_delivery_date: "2026-01-20",
    address: { ...defaultAddress, shipment_address_id: "ADDR-001" }
  },
  // Shipment 2: For ORD-2026-002 (shipped, NO tracking number)
  {
    shipment_id: "SHIP-002",
    order_id: "ORD-2026-002",
    tracking_number: null,  // NO tracking number
    estimated_delivery_date: "2026-01-21",
    address: { ...defaultAddress, shipment_address_id: "ADDR-002" }
  },
  // Shipment 3: For ORD-2026-003 (shipped, last tracking update Jan 15, 2026)
  {
    shipment_id: "SHIP-003",
    order_id: "ORD-2026-003",
    tracking_number: "ECO-7829374651",
    estimated_delivery_date: "2026-01-18",
    address: { ...defaultAddress, shipment_address_id: "ADDR-003" }
  },
  // Shipment 4: For ORD-2026-004 (returned)
  {
    shipment_id: "SHIP-004",
    order_id: "ORD-2026-004",
    tracking_number: "ECO-8934567123",
    estimated_delivery_date: null,
    address: { ...defaultAddress, shipment_address_id: "ADDR-004" }
  },
  // Shipment 5: For ORD-2026-005 (delivered Jan 15, 2026)
  {
    shipment_id: "SHIP-005",
    order_id: "ORD-2026-005",
    tracking_number: "ECO-5647382910",
    estimated_delivery_date: "2026-01-15",
    address: { ...defaultAddress, shipment_address_id: "ADDR-005" }
  },
  // Shipment 6: For ORD-2026-006 (delivered Jan 16, 2026)
  {
    shipment_id: "SHIP-006",
    order_id: "ORD-2026-006",
    tracking_number: "ECO-1234567890",
    estimated_delivery_date: "2026-01-16",
    address: { ...defaultAddress, shipment_address_id: "ADDR-006" }
  },
  // Shipment 7: For ORD-2026-007 (eligible for cancellation, NO estimated delivery)
  {
    shipment_id: "SHIP-007",
    order_id: "ORD-2026-007",
    tracking_number: null,
    estimated_delivery_date: null,  // No estimated delivery time
    address: { ...defaultAddress, shipment_address_id: "ADDR-007" }
  },
  // Shipment 8: For ORD-2025-008 (delivered Nov 1, 2025)
  {
    shipment_id: "SHIP-008",
    order_id: "ORD-2025-008",
    tracking_number: "ECO-2025110100",
    estimated_delivery_date: "2025-11-01",
    address: { ...defaultAddress, shipment_address_id: "ADDR-008" }
  },
  // Shipment 9: For ORD-2026-009 (received, delivered Nov 30, 2025)
  {
    shipment_id: "SHIP-009",
    order_id: "ORD-2026-009",
    tracking_number: "ECO-9876543210",
    estimated_delivery_date: "2025-11-30",
    address: { ...defaultAddress, shipment_address_id: "ADDR-009" }
  }
];

// ============================================
// 3. DELIVERY EVENTS TABLE
// ============================================
let deliveryEvents = [
  // ========================================
  // Events for SHIP-001 (shipped, no tracking)
  // ========================================
  {
    event_id: "EVT-001",
    shipment_id: "SHIP-001",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2026-01-10T10:00:00Z"
  },
  {
    event_id: "EVT-002",
    shipment_id: "SHIP-001",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped - tracking number pending",
    event_time: "2026-01-12T14:00:00Z"
  },

  // ========================================
  // Events for SHIP-002 (shipped, no tracking)
  // ========================================
  {
    event_id: "EVT-003",
    shipment_id: "SHIP-002",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2026-01-11T14:30:00Z"
  },
  {
    event_id: "EVT-004",
    shipment_id: "SHIP-002",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped - tracking number pending",
    event_time: "2026-01-13T09:00:00Z"
  },

  // ========================================
  // Events for SHIP-003 (shipped, last update Jan 15, 2026)
  // ========================================
  {
    event_id: "EVT-005",
    shipment_id: "SHIP-003",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2026-01-12T09:00:00Z"
  },
  {
    event_id: "EVT-006",
    shipment_id: "SHIP-003",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped from Grove Fulfillment Center",
    event_time: "2026-01-13T11:00:00Z"
  },
  {
    event_id: "EVT-007",
    shipment_id: "SHIP-003",
    status: DeliveryStatus.IN_TRANSIT,
    status_message: "Package in transit to destination",
    event_time: "2026-01-15T08:30:00Z"  // Last tracking update: Jan 15, 2026
  },

  // ========================================
  // Events for SHIP-004 (returned)
  // ========================================
  {
    event_id: "EVT-008",
    shipment_id: "SHIP-004",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2026-01-05T11:00:00Z"
  },
  {
    event_id: "EVT-009",
    shipment_id: "SHIP-004",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped from Grove Fulfillment Center",
    event_time: "2026-01-06T10:00:00Z"
  },
  {
    event_id: "EVT-010",
    shipment_id: "SHIP-004",
    status: DeliveryStatus.RETURNED,
    status_message: "Package returned to sender - delivery refused",
    event_time: "2026-01-10T16:00:00Z"
  },

  // ========================================
  // Events for SHIP-005 (delivered Jan 15, 2026)
  // ========================================
  {
    event_id: "EVT-011",
    shipment_id: "SHIP-005",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2026-01-08T08:00:00Z"
  },
  {
    event_id: "EVT-012",
    shipment_id: "SHIP-005",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped from Grove Fulfillment Center",
    event_time: "2026-01-09T10:00:00Z"
  },
  {
    event_id: "EVT-013",
    shipment_id: "SHIP-005",
    status: DeliveryStatus.IN_TRANSIT,
    status_message: "Package in transit",
    event_time: "2026-01-12T14:00:00Z"
  },
  {
    event_id: "EVT-014",
    shipment_id: "SHIP-005",
    status: DeliveryStatus.OUT_FOR_DELIVERY,
    status_message: "Out for delivery",
    event_time: "2026-01-15T07:00:00Z"
  },
  {
    event_id: "EVT-015",
    shipment_id: "SHIP-005",
    status: DeliveryStatus.DELIVERED,
    status_message: "Delivered to front door",
    event_time: "2026-01-15T14:30:00Z"  // Delivered: Jan 15, 2026
  },

  // ========================================
  // Events for SHIP-006 (delivered Jan 16, 2026)
  // ========================================
  {
    event_id: "EVT-016",
    shipment_id: "SHIP-006",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2026-01-09T16:00:00Z"
  },
  {
    event_id: "EVT-017",
    shipment_id: "SHIP-006",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped from Grove Fulfillment Center",
    event_time: "2026-01-10T12:00:00Z"
  },
  {
    event_id: "EVT-018",
    shipment_id: "SHIP-006",
    status: DeliveryStatus.IN_TRANSIT,
    status_message: "Package in transit",
    event_time: "2026-01-13T09:00:00Z"
  },
  {
    event_id: "EVT-019",
    shipment_id: "SHIP-006",
    status: DeliveryStatus.OUT_FOR_DELIVERY,
    status_message: "Out for delivery",
    event_time: "2026-01-16T08:00:00Z"
  },
  {
    event_id: "EVT-020",
    shipment_id: "SHIP-006",
    status: DeliveryStatus.DELIVERED,
    status_message: "Delivered to mailbox",
    event_time: "2026-01-16T11:45:00Z"  // Delivered: Jan 16, 2026
  },

  // ========================================
  // Events for SHIP-007 (eligible for cancellation)
  // ========================================
  {
    event_id: "EVT-021",
    shipment_id: "SHIP-007",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed - eligible for cancellation",
    event_time: "2026-01-14T10:00:00Z"
  },

  // ========================================
  // Events for SHIP-008 (delivered Nov 1, 2025)
  // ========================================
  {
    event_id: "EVT-022",
    shipment_id: "SHIP-008",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2025-10-25T09:00:00Z"
  },
  {
    event_id: "EVT-023",
    shipment_id: "SHIP-008",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped from Grove Fulfillment Center",
    event_time: "2025-10-27T10:00:00Z"
  },
  {
    event_id: "EVT-024",
    shipment_id: "SHIP-008",
    status: DeliveryStatus.IN_TRANSIT,
    status_message: "Package in transit",
    event_time: "2025-10-29T14:00:00Z"
  },
  {
    event_id: "EVT-025",
    shipment_id: "SHIP-008",
    status: DeliveryStatus.OUT_FOR_DELIVERY,
    status_message: "Out for delivery",
    event_time: "2025-11-01T08:00:00Z"
  },
  {
    event_id: "EVT-026",
    shipment_id: "SHIP-008",
    status: DeliveryStatus.DELIVERED,
    status_message: "Delivered to front door",
    event_time: "2025-11-01T14:00:00Z"  // Delivered: Nov 1, 2025
  },

  // ========================================
  // Events for SHIP-009 (received, delivered Nov 30, 2025)
  // ========================================
  {
    event_id: "EVT-027",
    shipment_id: "SHIP-009",
    status: DeliveryStatus.ORDER_PLACED,
    status_message: "Order placed successfully",
    event_time: "2025-11-20T11:00:00Z"
  },
  {
    event_id: "EVT-028",
    shipment_id: "SHIP-009",
    status: DeliveryStatus.SHIPPED,
    status_message: "Package shipped from Grove Fulfillment Center",
    event_time: "2025-11-22T09:00:00Z"
  },
  {
    event_id: "EVT-029",
    shipment_id: "SHIP-009",
    status: DeliveryStatus.IN_TRANSIT,
    status_message: "Package in transit to destination",
    event_time: "2025-11-25T10:30:00Z"
  },
  {
    event_id: "EVT-030",
    shipment_id: "SHIP-009",
    status: DeliveryStatus.OUT_FOR_DELIVERY,
    status_message: "Out for delivery",
    event_time: "2025-11-30T08:00:00Z"
  },
  {
    event_id: "EVT-031",
    shipment_id: "SHIP-009",
    status: DeliveryStatus.DELIVERED,
    status_message: "Delivered - Received by customer",
    event_time: "2025-11-30T14:00:00Z"
  }
];

// ============================================
// LEGACY DATA (for dashboard compatibility)
// ============================================
let customers = {
  "shaden.chehab@devrev.ai": {
    id: "shaden.chehab@devrev.ai",
    name: "Shaden Chehab",
    email: "shaden.chehab@devrev.ai",
    phone: "(555) 123-4567",
    memberSince: "2024-03-15",
    vipMember: true,
    credit: 0
  }
};

let payments = [
  {
    id: "PAY-001",
    orderId: "ORD-2026-001",
    customerId: "shaden.chehab@devrev.ai",
    amount: 45.99,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2026-01-10",
    description: "Payment for Order #ORD-2026-001"
  },
  {
    id: "PAY-002",
    orderId: "ORD-2026-002",
    customerId: "shaden.chehab@devrev.ai",
    amount: 32.50,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2026-01-11",
    description: "Payment for Order #ORD-2026-002"
  },
  {
    id: "PAY-003",
    orderId: "ORD-2026-003",
    customerId: "shaden.chehab@devrev.ai",
    amount: 78.25,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2026-01-12",
    description: "Payment for Order #ORD-2026-003"
  },
  {
    id: "PAY-004",
    orderId: "ORD-2026-004",
    customerId: "shaden.chehab@devrev.ai",
    amount: 55.00,
    status: "refunded",
    method: "Visa ending in 4242",
    date: "2026-01-05",
    description: "Payment for Order #ORD-2026-004 (Returned)"
  },
  {
    id: "PAY-005",
    orderId: "ORD-2026-005",
    customerId: "shaden.chehab@devrev.ai",
    amount: 89.99,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2026-01-08",
    description: "Payment for Order #ORD-2026-005"
  },
  {
    id: "PAY-006",
    orderId: "ORD-2026-006",
    customerId: "shaden.chehab@devrev.ai",
    amount: 42.75,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2026-01-09",
    description: "Payment for Order #ORD-2026-006"
  },
  {
    id: "PAY-007",
    orderId: "ORD-2026-007",
    customerId: "shaden.chehab@devrev.ai",
    amount: 39.98,
    status: "pending",
    method: "Pending",
    date: "2026-01-14",
    description: "Payment for Order #ORD-2026-007 (Eligible for Cancellation)"
  },
  {
    id: "PAY-008",
    orderId: "ORD-2025-008",
    customerId: "shaden.chehab@devrev.ai",
    amount: 31.98,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2025-10-25",
    description: "Payment for Order #ORD-2025-008"
  },
  {
    id: "PAY-009",
    orderId: "ORD-2026-009",
    customerId: "shaden.chehab@devrev.ai",
    amount: 110.00,
    status: "completed",
    method: "Visa ending in 4242",
    date: "2026-01-13",
    description: "Payment for Order #ORD-2026-009"
  }
];

// Auto-increment counters for generating IDs
let eventIdCounter = 30;
let addressIdCounter = 10;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate estimated delivery date (5-7 business days)
function getEstimatedDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 3) + 5); // 5-7 days
  return date.toISOString().split('T')[0];
}

// Get latest status for a shipment from delivery events
function getLatestShipmentStatus(shipmentId) {
  const events = deliveryEvents
    .filter(e => e.shipment_id === shipmentId)
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time));
  return events[0] || null;
}

// Get all delivery events for a shipment
function getShipmentEvents(shipmentId) {
  return deliveryEvents
    .filter(e => e.shipment_id === shipmentId)
    .sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
}

// Convert new data model to legacy format for frontend compatibility
function toLegacyShipmentFormat(shipment) {
  const events = getShipmentEvents(shipment.shipment_id);
  const latestEvent = events[events.length - 1];
  const order = orders.find(o => o.order_id === shipment.order_id);
  
  // Map new status to legacy status
  const statusMap = {
    'order_placed': 'pending',
    'processing': 'in_progress',
    'shipped': 'in_progress',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'failed_attempt': 'pending',
    'returned': 'returned'
  };
  
  return {
    id: shipment.shipment_id,
    orderId: shipment.order_id,
    customerId: order?.customer_id || null,
    status: latestEvent ? statusMap[latestEvent.status] || latestEvent.status : 'pending',
    carrier: "EcoShip Green Delivery",
    trackingNumber: shipment.tracking_number,
    estimatedDelivery: shipment.estimated_delivery_date,
    address: shipment.address,
    statusHistory: events.map(e => ({
      status: statusMap[e.status] || e.status,
      timestamp: e.event_time,
      note: e.status_message
    })),
    currentLocation: latestEvent?.status === 'delivered' 
      ? 'Delivered' 
      : (shipment.address ? `In transit to ${shipment.address.city}, ${shipment.address.state}` : null)
  };
}

// Convert new order format to legacy format
function toLegacyOrderFormat(order) {
  // Map order status
  const statusMap = {
    'pending': 'pending',
    'processing': 'processing',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned',
    'eligible_for_cancellation': 'eligible_for_cancellation'
  };
  
  return {
    id: order.order_id,
    customerId: order.customer_id,
    date: order.created_at.split('T')[0],
    status: statusMap[order.order_status] || order.order_status,
    fulfillmentId: order.fulfillment_id,
    deliveryDate: order.delivery_date ? order.delivery_date.split('T')[0] : null,
    items: order.items || [],
    total: order.total || 0
  };
}

// ============================================
// API ROUTES
// ============================================

// Get customer profile
app.get('/api/customer/:id', (req, res) => {
  const customer = customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// Update shipment address (new data model approach)
app.put('/api/shipment/:shipmentId/address', (req, res) => {
  const shipment = shipments.find(s => s.shipment_id === req.params.shipmentId);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }

  const { recipient_name, phone, address_line_1, city, state, postal_code, country } = req.body;
  
  if (!recipient_name || !address_line_1 || !city || !state || !postal_code) {
    return res.status(400).json({ error: 'All address fields are required' });
  }

  // Create new address
  shipment.address = {
    shipment_address_id: `ADDR-${String(addressIdCounter++).padStart(3, '0')}`,
    recipient_name,
    phone: phone || '',
    address_line_1,
    city,
    state,
    postal_code,
    country: country || 'USA'
  };

  // Set estimated delivery date
  shipment.estimated_delivery_date = getEstimatedDeliveryDate();

  // Add processing event
  deliveryEvents.push({
    event_id: `EVT-${String(eventIdCounter++).padStart(3, '0')}`,
    shipment_id: shipment.shipment_id,
    status: DeliveryStatus.PROCESSING,
    status_message: `Address confirmed: ${address_line_1}, ${city}, ${state} ${postal_code}. Package is being prepared.`,
    event_time: new Date().toISOString()
  });

  // Update related order status
  const order = orders.find(o => o.order_id === shipment.order_id);
  if (order && order.order_status === OrderStatus.PENDING) {
    order.order_status = OrderStatus.PROCESSING;
  }

  res.json({
    success: true,
    message: 'Shipment address updated successfully',
    shipment,
    order
  });
});

// Legacy: Update customer address (updates all pending shipments)
app.put('/api/customer/:id/address', (req, res) => {
  const customer = customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const { street, city, state, zipCode, country } = req.body;
  
  if (!street || !city || !state || !zipCode) {
    return res.status(400).json({ error: 'All address fields are required' });
  }

  // Get customer orders
  const customerOrders = orders.filter(o => o.customer_id === req.params.id);
  const customerOrderIds = customerOrders.map(o => o.order_id);
  
  // Update all pending shipments for this customer
  const updatedShipments = [];
  shipments.forEach(shipment => {
    if (customerOrderIds.includes(shipment.order_id) && !shipment.address) {
      // Add address to shipment
      shipment.address = {
        shipment_address_id: `ADDR-${String(addressIdCounter++).padStart(3, '0')}`,
        recipient_name: customer.name,
        phone: customer.phone,
        address_line_1: street,
        city,
        state,
        postal_code: zipCode,
        country: country || 'USA'
      };
      
      // Set estimated delivery
      shipment.estimated_delivery_date = getEstimatedDeliveryDate();
      
      // Add processing event
      deliveryEvents.push({
        event_id: `EVT-${String(eventIdCounter++).padStart(3, '0')}`,
        shipment_id: shipment.shipment_id,
        status: DeliveryStatus.PROCESSING,
        status_message: `Address confirmed: ${street}, ${city}, ${state} ${zipCode}. Package is being prepared.`,
        event_time: new Date().toISOString()
      });

      // Update related order
      const order = orders.find(o => o.order_id === shipment.order_id);
      if (order && order.order_status === OrderStatus.PENDING) {
        order.order_status = OrderStatus.PROCESSING;
      }
      if (order && order.order_status === OrderStatus.PROCESSING) {
        order.order_status = OrderStatus.SHIPPED;
      }

      updatedShipments.push(toLegacyShipmentFormat(shipment));
    }
  });

  res.json({
    success: true,
    message: 'Address updated successfully',
    customer,
    updatedShipments,
    shipmentsUpdatedCount: updatedShipments.length
  });
});

// ============================================
// ORDERS API
// ============================================

// Get all orders for a customer (includes shipment and tracking info)
app.get('/api/orders/:customerId', (req, res) => {
  const customerOrders = orders
    .filter(o => o.customer_id === req.params.customerId)
    .map(order => {
      // Get linked shipment
      const shipment = shipments.find(s => s.order_id === order.order_id);
      // Get delivery events if shipment exists
      const events = shipment ? getShipmentEvents(shipment.shipment_id) : [];
      
      return {
        order_id: order.order_id,
        customer_id: order.customer_id,
        order_status: order.order_status,
        created_at: order.created_at,
        delivery_date: order.delivery_date || null,
        items: order.items,
        total: order.total,
        tracking_number: shipment ? shipment.tracking_number : null,
        shipment_id: shipment ? shipment.shipment_id : null,
        estimated_delivery_date: shipment ? shipment.estimated_delivery_date : null,
        shipping_address: shipment ? shipment.address : null,
        delivery_events: events
      };
    });
  res.json(customerOrders);
});

// Get all orders (new format)
app.get('/api/v2/orders', (req, res) => {
  const { customer_id, order_status } = req.query;
  let result = [...orders];
  
  if (customer_id) {
    result = result.filter(o => o.customer_id === customer_id);
  }
  if (order_status) {
    result = result.filter(o => o.order_status === order_status);
  }
  
  res.json(result);
});

// Get single order details (includes shipment and tracking info)
app.get('/api/order/:orderId', (req, res) => {
  const order = orders.find(o => o.order_id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  // Get linked shipment
  const shipment = shipments.find(s => s.order_id === order.order_id);
  
  // Get delivery events if shipment exists
  const events = shipment ? getShipmentEvents(shipment.shipment_id) : [];
  
  // Combine all info into single response
  res.json({
    order_id: order.order_id,
    customer_id: order.customer_id,
    order_status: order.order_status,
    created_at: order.created_at,
    delivery_date: order.delivery_date || null,
    items: order.items,
    total: order.total,
    tracking_number: shipment ? shipment.tracking_number : null,
    shipment_id: shipment ? shipment.shipment_id : null,
    estimated_delivery_date: shipment ? shipment.estimated_delivery_date : null,
    shipping_address: shipment ? shipment.address : null,
    delivery_events: events
  });
});

// Create order
app.post('/api/v2/orders', (req, res) => {
  const { customer_id, fulfillment_id } = req.body;
  
  if (!customer_id) {
    return res.status(400).json({ error: 'customer_id is required' });
  }
  
  const newOrder = {
    order_id: `ORD-${Date.now()}`,
    customer_id,
    order_status: OrderStatus.PENDING,
    created_at: new Date().toISOString(),
    fulfillment_id: fulfillment_id || `FUL-${Date.now()}`
  };
  
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// Update order status
app.patch('/api/v2/orders/:orderId', (req, res) => {
  const order = orders.find(o => o.order_id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const { order_status } = req.body;
  if (order_status && Object.values(OrderStatus).includes(order_status)) {
    order.order_status = order_status;
  }
  
  res.json(order);
});

// ============================================
// SHIPMENTS API
// ============================================

// Get shipment status (legacy format)
app.get('/api/shipment/:shipmentId', (req, res) => {
  const shipment = shipments.find(s => s.shipment_id === req.params.shipmentId);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  res.json(toLegacyShipmentFormat(shipment));
});

// Get all shipments for a customer (legacy format)
app.get('/api/shipments/:customerId', (req, res) => {
  const customerOrders = orders.filter(o => o.customer_id === req.params.customerId);
  const orderIds = customerOrders.map(o => o.order_id);
  
  const customerShipments = shipments
    .filter(s => orderIds.includes(s.order_id))
    .map(toLegacyShipmentFormat);
  
  res.json(customerShipments);
});

// Get all shipments (new format)
app.get('/api/v2/shipments', (req, res) => {
  const { order_id } = req.query;
  let result = [...shipments];
  
  if (order_id) {
    result = result.filter(s => s.order_id === order_id);
  }
  
  res.json(result);
});

// Get single shipment (new format)
app.get('/api/v2/shipments/:shipmentId', (req, res) => {
  const shipment = shipments.find(s => s.shipment_id === req.params.shipmentId);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  res.json(shipment);
});

// Create shipment
app.post('/api/v2/shipments', (req, res) => {
  const { order_id, tracking_number, address } = req.body;
  
  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }
  
  const order = orders.find(o => o.order_id === order_id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const newShipment = {
    shipment_id: `SHIP-${Date.now()}`,
    order_id,
    tracking_number: tracking_number || `ECO-${Date.now()}`,
    estimated_delivery_date: address ? getEstimatedDeliveryDate() : null,
    address: address ? {
      shipment_address_id: `ADDR-${String(addressIdCounter++).padStart(3, '0')}`,
      ...address
    } : null
  };
  
  shipments.push(newShipment);
  
  // Create initial delivery event
  deliveryEvents.push({
    event_id: `EVT-${String(eventIdCounter++).padStart(3, '0')}`,
    shipment_id: newShipment.shipment_id,
    status: DeliveryStatus.ORDER_PLACED,
    status_message: 'Shipment created',
    event_time: new Date().toISOString()
  });
  
  res.status(201).json(newShipment);
});

// Get order by tracking number (combined order + shipment info)
app.get('/api/track/:trackingNumber', (req, res) => {
  const shipment = shipments.find(s => s.tracking_number === req.params.trackingNumber);
  if (!shipment) {
    return res.status(404).json({ error: 'Tracking number not found' });
  }
  
  // Get the linked order
  const order = orders.find(o => o.order_id === shipment.order_id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found for this tracking number' });
  }
  
  // Get shipment events
  const events = getShipmentEvents(shipment.shipment_id);
  
  // Return combined format (same as /api/order/:orderId)
  res.json({
    order_id: order.order_id,
    customer_id: order.customer_id,
    order_status: order.order_status,
    created_at: order.created_at,
    delivery_date: order.delivery_date || null,
    items: order.items,
    total: order.total,
    tracking_number: shipment.tracking_number,
    shipment_id: shipment.shipment_id,
    estimated_delivery_date: shipment.estimated_delivery_date,
    shipping_address: shipment.address,
    delivery_events: events
  });
});


// ============================================
// DELIVERY EVENTS API
// ============================================

// Get all delivery events for a shipment
app.get('/api/v2/shipments/:shipmentId/events', (req, res) => {
  const shipment = shipments.find(s => s.shipment_id === req.params.shipmentId);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const events = getShipmentEvents(req.params.shipmentId);
  res.json(events);
});

// Add delivery event
app.post('/api/v2/shipments/:shipmentId/events', (req, res) => {
  const shipment = shipments.find(s => s.shipment_id === req.params.shipmentId);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const { status, status_message } = req.body;
  
  if (!status || !Object.values(DeliveryStatus).includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status',
      valid_statuses: Object.values(DeliveryStatus)
    });
  }
  
  const newEvent = {
    event_id: `EVT-${String(eventIdCounter++).padStart(3, '0')}`,
    shipment_id: req.params.shipmentId,
    status,
    status_message: status_message || `Status updated to ${status}`,
    event_time: new Date().toISOString()
  };
  
  deliveryEvents.push(newEvent);
  
  // Update order status if delivered
  if (status === DeliveryStatus.DELIVERED) {
    const order = orders.find(o => o.order_id === shipment.order_id);
    if (order) {
      order.order_status = OrderStatus.RECEIVED;
    }
  }
  
  res.status(201).json(newEvent);
});

// Get all delivery events
app.get('/api/v2/events', (req, res) => {
  const { shipment_id, status } = req.query;
  let result = [...deliveryEvents];
  
  if (shipment_id) {
    result = result.filter(e => e.shipment_id === shipment_id);
  }
  if (status) {
    result = result.filter(e => e.status === status);
  }
  
  result.sort((a, b) => new Date(b.event_time) - new Date(a.event_time));
  res.json(result);
});

// ============================================
// PAYMENTS API (Legacy)
// ============================================

// Get all payments for a customer
app.get('/api/payments/:customerId', (req, res) => {
  const customerPayments = payments.filter(p => p.customerId === req.params.customerId);
  res.json(customerPayments);
});

// Process pending payment
app.post('/api/payment/:paymentId/process', (req, res) => {
  const payment = payments.find(p => p.id === req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (payment.status !== 'pending') {
    return res.status(400).json({ error: 'Payment is not pending' });
  }

  payment.status = 'completed';
  payment.method = req.body.method || 'Visa ending in 4242';
  payment.date = new Date().toISOString().split('T')[0];

  // Update order status
  const order = orders.find(o => o.order_id === payment.orderId);
  if (order && order.order_status === OrderStatus.PENDING) {
    order.order_status = OrderStatus.PROCESSING;
  }

  res.json({
    success: true,
    message: 'Payment processed successfully',
    payment
  });
});

// ============================================
// CANCEL ORDER API
// ============================================
app.post('/api/order/:orderId/cancel', (req, res) => {
  const order = orders.find(o => o.order_id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if order can be cancelled
  if (order.order_status === OrderStatus.RECEIVED) {
    return res.status(400).json({ error: 'Cannot cancel a delivered order' });
  }
  if (order.order_status === OrderStatus.CANCELLED) {
    return res.status(400).json({ error: 'Order is already cancelled' });
  }

  const previousStatus = order.order_status;
  order.order_status = OrderStatus.CANCELLED;

  // Update related payment to refunded if it was completed
  const payment = payments.find(p => p.orderId === order.order_id);
  if (payment && payment.status === 'completed') {
    payment.status = 'refunded';
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order_id: order.order_id,
    previous_status: previousStatus,
    new_status: order.order_status,
    order
  });
});

// ============================================
// REFUND API
// ============================================
app.post('/api/order/:orderId/refund', (req, res) => {
  const { amount } = req.body;
  
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: 'Valid refund amount is required' });
  }

  const order = orders.find(o => o.order_id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const payment = payments.find(p => p.orderId === order.order_id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found for this order' });
  }

  if (amount > payment.amount) {
    return res.status(400).json({ error: `Refund amount cannot exceed order total of $${payment.amount.toFixed(2)}` });
  }

  // Create refund record
  const refund = {
    id: `REF-${Date.now()}`,
    orderId: order.order_id,
    customerId: order.customer_id,
    amount: amount,
    originalPaymentId: payment.id,
    status: 'completed',
    date: new Date().toISOString().split('T')[0]
  };

  // Update payment status if full refund
  if (amount === payment.amount) {
    payment.status = 'refunded';
  } else {
    payment.status = 'partially_refunded';
  }

  res.json({
    success: true,
    message: `Refund of $${amount.toFixed(2)} processed successfully`,
    refund,
    order_id: order.order_id,
    refund_amount: amount
  });
});

// ============================================
// CANCEL ORDER AND ADD CREDIT API
// ============================================
app.post('/api/order/:orderId/cancel-and-credit', (req, res) => {
  const order = orders.find(o => o.order_id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Check if order can be cancelled
  if (order.order_status === OrderStatus.RECEIVED) {
    return res.status(400).json({ error: 'Cannot cancel a delivered order' });
  }
  if (order.order_status === OrderStatus.CANCELLED) {
    return res.status(400).json({ error: 'Order is already cancelled' });
  }

  const customer = customers[order.customer_id];
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const previousStatus = order.order_status;
  const creditAmount = order.total || 0;

  // Cancel the order
  order.order_status = OrderStatus.CANCELLED;

  // Add credit to customer account
  customer.credit = (customer.credit || 0) + creditAmount;

  // Update related payment
  const payment = payments.find(p => p.orderId === order.order_id);
  if (payment && payment.status === 'completed') {
    payment.status = 'credited';
  }

  res.json({
    success: true,
    message: `Order cancelled and $${creditAmount.toFixed(2)} credit added to account`,
    order_id: order.order_id,
    previous_status: previousStatus,
    new_status: order.order_status,
    credit_added: creditAmount,
    new_credit_balance: customer.credit,
    customer_id: customer.id
  });
});

// ============================================
// GET CUSTOMER CREDIT API
// ============================================
app.get('/api/customer/:id/credit', (req, res) => {
  const customer = customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json({
    customer_id: customer.id,
    credit: customer.credit || 0
  });
});

// ============================================
// ADD CREDIT TO CUSTOMER API
// ============================================
app.post('/api/customer/:id/credit', (req, res) => {
  const { amount } = req.body;
  
  if (amount === undefined || amount <= 0) {
    return res.status(400).json({ error: 'Valid credit amount is required' });
  }

  const customer = customers[req.params.id];
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const previousCredit = customer.credit || 0;
  customer.credit = previousCredit + amount;

  res.json({
    success: true,
    message: `$${amount.toFixed(2)} credit added to account`,
    customer_id: customer.id,
    previous_credit: previousCredit,
    credit_added: amount,
    new_credit_balance: customer.credit
  });
});

// ============================================
// DASHBOARD API
// ============================================

// Get dashboard summary (legacy format for frontend)
app.get('/api/dashboard/:customerId', (req, res) => {
  const customerId = req.params.customerId;
  const customer = customers[customerId];
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Get customer orders
  const customerOrders = orders.filter(o => o.customer_id === customerId);
  const orderIds = customerOrders.map(o => o.order_id);
  
  // Get shipments for those orders
  const customerShipments = shipments
    .filter(s => orderIds.includes(s.order_id))
    .map(toLegacyShipmentFormat);
  
  // Get payments
  const customerPayments = payments.filter(p => p.customerId === customerId);
  
  // Convert orders to legacy format with enriched data
  const legacyOrders = customerOrders.map(order => {
    return {
      id: order.order_id,
      customerId: order.customer_id,
      date: order.created_at.split('T')[0],
      status: order.order_status,
      fulfillmentId: order.fulfillment_id,
      deliveryDate: order.delivery_date ? order.delivery_date.split('T')[0] : null,
      items: order.items || [],
      total: order.total || 0
    };
  });

  res.json({
    customer,
    orders: legacyOrders,
    shipments: customerShipments,
    payments: customerPayments,
    summary: {
      totalOrders: customerOrders.length,
      pendingShipments: customerShipments.filter(s => s.status === 'pending').length,
      inProgressShipments: customerShipments.filter(s => s.status === 'in_progress').length,
      pendingPayments: customerPayments.filter(p => p.status === 'pending').length,
      totalPendingAmount: customerPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    }
  });
});

// Get database schema info
app.get('/api/v2/schema', (req, res) => {
  res.json({
    orders: {
      fields: ['order_id (PK)', 'customer_id', 'order_status', 'created_at', 'fulfillment_id', 'delivery_date', 'items', 'total'],
      order_status_enum: Object.values(OrderStatus)
    },
    items: {
      fields: ['item_id', 'name', 'price', 'quantity', 'status'],
      item_status_enum: Object.values(ItemStatus)
    },
    shipments: {
      fields: ['shipment_id (PK)', 'order_id (FK)', 'tracking_number', 'estimated_delivery_date', 'address'],
      address_fields: ['shipment_address_id (PK)', 'recipient_name', 'phone', 'address_line_1', 'city', 'state', 'postal_code', 'country']
    },
    delivery_events: {
      fields: ['event_id (PK)', 'shipment_id (FK)', 'status', 'status_message', 'event_time'],
      status_enum: Object.values(DeliveryStatus)
    }
  });
});

// Serve the customer-facing dashboard (limited info)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});

// Serve the database/admin dashboard (full info - not customer-facing)
app.get('/database', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'database.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🌿 Grove Dashboard API Server running at http://localhost:${PORT}`);
  console.log(`\n📦 Legacy API Endpoints (v1):`);
  console.log(`   GET  /api/customer/:id            - Get customer profile`);
  console.log(`   PUT  /api/customer/:id/address    - Update customer address`);
  console.log(`   GET  /api/orders/:customerId      - Get all orders`);
  console.log(`   GET  /api/order/:orderId          - Get order by ID`);
  console.log(`   GET  /api/shipments/:customerId   - Get all shipments`);
  console.log(`   GET  /api/shipment/:shipmentId    - Get shipment status`);
  console.log(`   GET  /api/track/:trackingNumber   - Track by tracking number`);
  console.log(`   GET  /api/payments/:customerId    - Get all payments`);
  console.log(`   POST /api/payment/:paymentId/process - Process payment`);
  console.log(`   GET  /api/dashboard/:customerId   - Get full dashboard data`);
  console.log(`\n📊 New Data Model API (v2):`);
  console.log(`   GET  /api/v2/schema               - View data model schema`);
  console.log(`   --- Orders ---`);
  console.log(`   GET  /api/v2/orders               - List all orders`);
  console.log(`   POST /api/v2/orders               - Create order`);
  console.log(`   PATCH /api/v2/orders/:orderId     - Update order`);
  console.log(`   --- Shipments ---`);
  console.log(`   GET  /api/v2/shipments            - List all shipments`);
  console.log(`   GET  /api/v2/shipments/:id        - Get shipment details`);
  console.log(`   POST /api/v2/shipments            - Create shipment`);
  console.log(`   PUT  /api/shipment/:id/address    - Update shipment address`);
  console.log(`   --- Delivery Events ---`);
  console.log(`   GET  /api/v2/events               - List all delivery events`);
  console.log(`   GET  /api/v2/shipments/:id/events - Get shipment events`);
  console.log(`   POST /api/v2/shipments/:id/events - Add delivery event`);
  console.log(`\n🌐 Customer Dashboard: http://localhost:${PORT}`);
  console.log(`📊 Database/Admin:     http://localhost:${PORT}/database\n`);
});
