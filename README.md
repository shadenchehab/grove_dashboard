# Grove Consumer Dashboard (Demo)

A mock consumer dashboard inspired by [Grove.co](https://www.grove.co/) - an eco-friendly consumer products company. This demo showcases order tracking, shipment status, and payment management with a beautiful, modern UI.

![Grove Dashboard](https://via.placeholder.com/800x400?text=Grove+Dashboard+Demo)

## Features

- 📦 **Order Management** - View order history with status tracking
- 🚚 **Shipment Tracking** - Real-time shipment status with progress indicators
- 💳 **Payment Management** - View and process pending payments
- 📍 **Address Updates** - Update shipping address to trigger shipment processing
- 🔧 **API Console** - Test API endpoints directly from the dashboard

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
open http://localhost:3000
```

## API Endpoints

### Customer

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/:id` | Get customer profile |
| PUT | `/api/customer/:id/address` | Update customer address |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/:customerId` | Get all orders for a customer |
| GET | `/api/order/:orderId` | Get single order details |

### Shipments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments/:customerId` | Get all shipments for a customer |
| GET | `/api/shipment/:shipmentId` | Get shipment status |
| GET | `/api/track/:trackingNumber` | Track by tracking number |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/:customerId` | Get all payments for a customer |
| POST | `/api/payment/:paymentId/process` | Process a pending payment |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/:customerId` | Get full dashboard data |

## Key Feature: Address → Shipment Status Flow

When a customer updates their shipping address, the system automatically:

1. Updates the customer's address in the database
2. Changes all **pending** shipments to **in_progress** status
3. Sets estimated delivery dates for those shipments
4. Updates related order statuses

### Example API Call

```bash
# Update customer address
curl -X PUT http://localhost:3000/api/customer/cust_001/address \
  -H "Content-Type: application/json" \
  -d '{
    "street": "123 Green Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA"
  }'
```

### Response

```json
{
  "success": true,
  "message": "Address updated successfully",
  "customer": {
    "id": "cust_001",
    "name": "Sarah Mitchell",
    "address": {
      "street": "123 Green Street",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    }
  },
  "updatedShipments": [...],
  "shipmentsUpdatedCount": 2
}
```

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Design**: Custom CSS inspired by Grove.co's eco-friendly aesthetic

## Design Philosophy

The dashboard features:
- 🌿 **Earthy color palette** - Forest greens, terracotta, and natural tones
- ✨ **Modern typography** - Playfair Display for headings, DM Sans for body
- 🎨 **Subtle gradients** - Nature-inspired backgrounds
- 📱 **Responsive design** - Works on desktop and mobile
- 🌱 **Eco-friendly aesthetic** - Reflects Grove's sustainability mission

## Demo Data

The demo includes pre-populated data:
- 1 VIP customer (Sarah Mitchell)
- 3 orders (1 delivered, 2 pending/processing)
- 3 shipments with various statuses
- 3 payments (2 completed, 1 pending)

## License

This is a demo project for educational purposes. Not affiliated with Grove Collaborative.


