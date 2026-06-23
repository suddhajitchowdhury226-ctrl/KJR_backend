/**
 * seed_demo_orders.js
 * Run:  node seed_demo_orders.js
 *
 * Seeds 5 demo orders into the KJR database covering every status in the
 * order lifecycle so you can test the full admin → user flow end-to-end.
 *
 * Statuses covered:
 *   1. pending_approval  — brand-new order waiting for admin to review
 *   2. confirmed         — approved, delivery date set
 *   3. shipped           — tracking number assigned, in transit
 *   4. out_for_delivery  — final mile, arriving today
 *   5. delivered         — completed order
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

// ── Helper ────────────────────────────────────────────────────────────────
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function inv(n) { return `KJR-DEMO00${n}`; }

// ── Demo order definitions ────────────────────────────────────────────────
const DEMO_ORDERS = [

  // ── ORDER 1: pending_approval ──────────────────────────────────────────
  {
    invoiceNumber: inv(1),
    transactionId: 'DEMO-TXN-60071234',
    authCode: 'DEMO01',
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.johnson@demotest.com',
    phone: '615-555-0101',
    company: 'Johnson HVAC LLC',
    address: '482 Peachtree Blvd',
    city: 'Atlanta',
    state: 'GA',
    zip: '30308',
    items: [
      { name: 'Rheem VA-35-5S Accumulator', part: 'VA-35-5S', qty: 2, unitPrice: 96.95, lineTotal: 193.90 },
      { name: 'Merv 8 Replacement Filter', part: 'PD540040', qty: 4, unitPrice: 64.95, lineTotal: 259.80 },
      { name: 'Pro Filter Pleated 21-Inches', part: 'PD540002', qty: 1, unitPrice: 73.95, lineTotal: 73.95 },
    ],
    subtotal: 527.65,
    taxRate: 0.08,
    taxAmount: 42.21,
    shipping: 0,
    total: 569.86,
    status: 'paid',
    approvalStatus: 'pending_approval',
    orderStatus: 'pending_approval',
    estimatedDelivery: null,
    createdAt: daysAgo(0),
    trackingEvents: [
      {
        status: 'Order Received — Pending Review',
        description: 'Payment of $569.86 received. Order #KJR-DEMO001 is awaiting admin review before processing.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(0),
      }
    ],
  },

  // ── ORDER 2: confirmed (approved, awaiting processing) ─────────────────
  {
    invoiceNumber: inv(2),
    transactionId: 'DEMO-TXN-60075678',
    authCode: 'DEMO02',
    firstName: 'Sandra',
    lastName: 'Rivera',
    email: 'sandra.rivera@demotest.com',
    phone: '615-555-0202',
    company: '',
    address: '1209 Maple Street',
    address2: 'Apt 3B',
    city: 'Nashville',
    state: 'TN',
    zip: '37201',
    items: [
      { name: 'Rheem VPA-5811-7SRD Accumulator', part: 'VPA-5811-7SRD', qty: 1, unitPrice: 120.95, lineTotal: 120.95 },
      { name: 'Air Bear 16 X 25 — 1400 CFM', part: '84-25050-06', qty: 2, unitPrice: 226.95, lineTotal: 453.90 },
    ],
    subtotal: 574.85,
    taxRate: 0.08,
    taxAmount: 45.99,
    shipping: 0,
    total: 620.84,
    status: 'paid',
    approvalStatus: 'approved',
    approvedAt: daysAgo(1),
    orderStatus: 'confirmed',
    estimatedDelivery: daysAhead(4),
    createdAt: daysAgo(2),
    trackingEvents: [
      {
        status: 'Order Received — Pending Review',
        description: 'Payment of $620.84 received. Order is awaiting admin review.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(2),
      },
      {
        status: 'Order Approved',
        description: 'Order approved and confirmed. Items are in stock and being prepared for shipment.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(1),
      },
    ],
  },

  // ── ORDER 3: shipped ────────────────────────────────────────────────────
  {
    invoiceNumber: inv(3),
    transactionId: 'DEMO-TXN-60079999',
    authCode: 'DEMO03',
    firstName: 'Derek',
    lastName: 'Thompson',
    email: 'derek.thompson@demotest.com',
    phone: '404-555-0303',
    company: 'Thompson Realty Group',
    address: '3301 Buckhead Lane',
    city: 'Alpharetta',
    state: 'GA',
    zip: '30022',
    items: [
      { name: 'Rheem VA-31-5S Accumulator', part: 'VA-31-5S', qty: 3, unitPrice: 97.95, lineTotal: 293.85 },
      { name: '20X25 Media Filter Merv 13', part: '813', qty: 2, unitPrice: 106.95, lineTotal: 213.90 },
      { name: 'Nu Iwave-r', part: '4900-20', qty: 1, unitPrice: 635.95, lineTotal: 635.95 },
      { name: 'Right Angle Air Bear', part: '84-25050-03', qty: 1, unitPrice: 294.95, lineTotal: 294.95 },
    ],
    subtotal: 1438.65,
    taxRate: 0.08,
    taxAmount: 115.09,
    shipping: 0,
    total: 1553.74,
    status: 'paid',
    approvalStatus: 'approved',
    approvedAt: daysAgo(4),
    orderStatus: 'shipped',
    trackingNumber: '1Z999AA10123456784',
    trackingCarrier: 'UPS',
    trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
    estimatedDelivery: daysAhead(2),
    createdAt: daysAgo(5),
    trackingEvents: [
      {
        status: 'Order Received — Pending Review',
        description: 'Payment of $1,553.74 received. Order awaiting admin review.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(5),
      },
      {
        status: 'Order Approved',
        description: 'Order approved. All items confirmed in stock.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(4),
      },
      {
        status: 'Order Processing',
        description: 'Items being picked and packed at KJR warehouse.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(3),
      },
      {
        status: 'Picked Up by UPS',
        description: 'Package picked up by UPS driver. Tracking # 1Z999AA10123456784',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(2),
      },
      {
        status: 'In Transit — Atlanta Hub',
        description: 'Package scanned at UPS Atlanta distribution hub.',
        location: 'Atlanta, GA',
        timestamp: daysAgo(1),
      },
    ],
  },

  // ── ORDER 4: out_for_delivery ───────────────────────────────────────────
  {
    invoiceNumber: inv(4),
    transactionId: 'DEMO-TXN-60083344',
    authCode: 'DEMO04',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@demotest.com',
    phone: '770-555-0404',
    company: '',
    address: '88 Rosewood Drive',
    city: 'Marietta',
    state: 'GA',
    zip: '30060',
    items: [
      { name: 'Tri Purity Rheem Cabinet', part: 'TUV-PRT-ER-17.5', qty: 1, unitPrice: 1505.95, lineTotal: 1505.95 },
      { name: 'H/W 20X25 Media Filter', part: 'FC200E1037/U', qty: 1, unitPrice: 97.95, lineTotal: 97.95 },
    ],
    subtotal: 1603.90,
    taxRate: 0.08,
    taxAmount: 128.31,
    shipping: 0,
    total: 1732.21,
    status: 'paid',
    approvalStatus: 'approved',
    approvedAt: daysAgo(6),
    orderStatus: 'out_for_delivery',
    trackingNumber: '9400111899223481765014',
    trackingCarrier: 'USPS',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223481765014',
    estimatedDelivery: new Date(),   // today
    createdAt: daysAgo(8),
    trackingEvents: [
      {
        status: 'Order Received — Pending Review',
        description: 'Payment of $1,732.21 received.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(8),
      },
      {
        status: 'Order Approved',
        description: 'Order approved and confirmed.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(6),
      },
      {
        status: 'Packed & Ready to Ship',
        description: 'All items packed. Awaiting carrier pickup.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(5),
      },
      {
        status: 'Handed to USPS',
        description: 'Package accepted at USPS facility.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(4),
      },
      {
        status: 'In Transit',
        description: 'Package in transit to destination facility.',
        location: 'Atlanta, GA',
        timestamp: daysAgo(2),
      },
      {
        status: 'Out for Delivery',
        description: 'Your package is out for delivery today. Expected by end of day.',
        location: 'Marietta, GA',
        timestamp: new Date(),
      },
    ],
  },

  // ── ORDER 5: delivered ─────────────────────────────────────────────────
  {
    invoiceNumber: inv(5),
    transactionId: 'DEMO-TXN-60087788',
    authCode: 'DEMO05',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@demotest.com',
    phone: '901-555-0505',
    company: 'Wilson Property Management',
    address: '502 Oak Park Way',
    city: 'Memphis',
    state: 'TN',
    zip: '38103',
    items: [
      { name: 'Rheem VA-35-6S Accumulator', part: 'VA-35-6S', qty: 2, unitPrice: 179.95, lineTotal: 359.90 },
      { name: 'April Media For 2400', part: '401', qty: 3, unitPrice: 78.95, lineTotal: 236.85 },
      { name: '410 Air Cleaner Merv 10', part: '410', qty: 2, unitPrice: 53.95, lineTotal: 107.90 },
      { name: 'Merv 8 Replacement Filter For Xhf-e21', part: 'PD540042', qty: 2, unitPrice: 69.95, lineTotal: 139.90 },
    ],
    subtotal: 844.55,
    taxRate: 0.08,
    taxAmount: 67.56,
    shipping: 0,
    total: 912.11,
    status: 'paid',
    approvalStatus: 'approved',
    approvedAt: daysAgo(12),
    orderStatus: 'delivered',
    trackingNumber: '772845791290',
    trackingCarrier: 'FedEx',
    trackingUrl: 'https://www.fedex.com/fedextrack/?tracknumbers=772845791290',
    estimatedDelivery: daysAgo(3),
    deliveredAt: daysAgo(3),
    createdAt: daysAgo(14),
    trackingEvents: [
      {
        status: 'Order Received — Pending Review',
        description: 'Payment of $912.11 received.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(14),
      },
      {
        status: 'Order Approved',
        description: 'Order approved. Items confirmed in stock.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(12),
      },
      {
        status: 'Processing',
        description: 'Items being picked and prepared for shipment.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(10),
      },
      {
        status: 'Packed',
        description: 'Order packed and ready for carrier pickup.',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(9),
      },
      {
        status: 'Picked Up by FedEx',
        description: 'Package picked up. Tracking # 772845791290',
        location: 'Lawrenceville, GA',
        timestamp: daysAgo(8),
      },
      {
        status: 'Departed FedEx Hub',
        description: 'Package departed FedEx facility on its way to destination.',
        location: 'Atlanta, GA',
        timestamp: daysAgo(6),
      },
      {
        status: 'In Transit',
        description: 'Package in transit — on schedule.',
        location: 'Birmingham, AL',
        timestamp: daysAgo(5),
      },
      {
        status: 'At Delivery Facility',
        description: 'Package arrived at the local FedEx delivery station.',
        location: 'Memphis, TN',
        timestamp: daysAgo(4),
      },
      {
        status: 'Delivered ✓',
        description: 'Package delivered. Signed for by recipient.',
        location: 'Memphis, TN 38103',
        timestamp: daysAgo(3),
      },
    ],
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱  KJR Demo Order Seeder');
  console.log('─'.repeat(50));

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
    });
    console.log('✅  Connected to MongoDB Atlas\n');
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    console.log('\n💡  Make sure your MONGODB_URI in .env is correct and your IP is whitelisted on Atlas.');
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;

  for (const order of DEMO_ORDERS) {
    try {
      // Remove existing demo order with same invoice number first (idempotent)
      await Invoice.deleteOne({ invoiceNumber: order.invoiceNumber });
      await Invoice.create(order);
      console.log(`  ✅  ${order.invoiceNumber}  ${order.firstName} ${order.lastName}  →  [${order.orderStatus.toUpperCase()}]  $${order.total.toFixed(2)}`);
      inserted++;
    } catch (err) {
      console.error(`  ❌  ${order.invoiceNumber}  failed: ${err.message}`);
      skipped++;
    }
  }

  console.log('\n─'.repeat(50));
  console.log(`✅  Seeded: ${inserted}   ❌  Failed: ${skipped}`);
  console.log('\n📋  Order Numbers for Testing:');
  DEMO_ORDERS.forEach(o =>
    console.log(`    ${o.invoiceNumber}  — ${o.orderStatus.padEnd(20)}  ${o.firstName} ${o.lastName}`)
  );
  console.log('\n🔗  Test order tracking:');
  DEMO_ORDERS.forEach(o =>
    console.log(`    http://localhost:5500/order-tracking.html?id=${o.invoiceNumber}`)
  );
  console.log('\n🔑  Admin login:  admin@kjrid.com  /  KJRAdmin2024!');
  console.log('    Admin panel:  http://localhost:5500/admin/index.html');
  console.log('─'.repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeder crashed:', err);
  process.exit(1);
});
