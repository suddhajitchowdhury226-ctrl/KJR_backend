/**
 * payment.js  —  Authorize.net Accept.js charge route
 *
 * Flow:
 *  1. Frontend tokenises card details with Authorize.net Accept.js
 *     (card data never touches our server — fully PCI-compliant)
 *  2. Frontend POSTs the opaque nonce + order data here
 *  3. We call Authorize.net's createTransactionRequest
 *  4. We return the transaction result to the frontend
 */

const express = require('express');
const router = express.Router();
const AuthorizenetSDK = require('authorizenet');
const nodemailer = require('nodemailer');
const Invoice = require('../models/Invoice');

const ApiContracts = AuthorizenetSDK.APIContracts;
const ApiControllers = AuthorizenetSDK.APIControllers;
const SDKConstants = AuthorizenetSDK.Constants;

// ─────────────────────────────────────────────────────────────────────────────
// Helper — pick sandbox vs production environment
// ─────────────────────────────────────────────────────────────────────────────
function getEnvironment() {
  return (process.env.AUTHORIZENET_ENVIRONMENT || 'SANDBOX').toUpperCase() === 'PRODUCTION'
    ? SDKConstants.endpoint.production
    : SDKConstants.endpoint.sandbox;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/charge
//
// Body (JSON):
// {
//   opaqueDataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT",
//   opaqueDataValue:      "<nonce from Accept.js>",
//   amount:               "99.99",          // string, two decimal places
//   firstName:            "John",
//   lastName:             "Smith",
//   email:                "john@example.com",
//   phone:                "5551234567",
//   address:              "123 Main St",
//   city:                 "Nashville",
//   state:                "TN",
//   zip:                  "37201",
//   company:              "ACME LLC",       // optional
//   invoiceNumber:        "KJR-123456",     // optional, for records
//   description:          "KJR Product Order"
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/charge', async (req, res) => {
  const {
    opaqueDataDescriptor,
    opaqueDataValue,
    amount,
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    company,
    invoiceNumber,
    description,
    cartItems        // array of { name, part, qty, price } for line items
  } = req.body;

  // ── Basic input validation ──────────────────────────────────────────────
  if (!opaqueDataDescriptor || !opaqueDataValue) {
    return res.status(400).json({ success: false, message: 'Payment token is missing. Please try again.' });
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
  }
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ success: false, message: 'Customer information is incomplete.' });
  }

  // ── Merchant authentication ─────────────────────────────────────────────
  const merchantAuth = new ApiContracts.MerchantAuthenticationType();
  merchantAuth.setName(process.env.AUTHORIZENET_API_LOGIN_ID);
  merchantAuth.setTransactionKey(process.env.AUTHORIZENET_TRANSACTION_KEY);

  // ── Payment — Accept.js opaque data ────────────────────────────────────
  const opaqueData = new ApiContracts.OpaqueDataType();
  opaqueData.setDataDescriptor(opaqueDataDescriptor);
  opaqueData.setDataValue(opaqueDataValue);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setOpaqueData(opaqueData);

  // ── Order ───────────────────────────────────────────────────────────────
  const orderDetails = new ApiContracts.OrderType();
  orderDetails.setInvoiceNumber(invoiceNumber || `KJR-${Date.now()}`);
  orderDetails.setDescription(description || 'KJR Interior Designs Order');

  // ── Line items (optional but professional) ──────────────────────────────
  const lineItemsArr = new ApiContracts.ArrayOfLineItem();
  if (Array.isArray(cartItems) && cartItems.length > 0) {
    const items = cartItems.slice(0, 30).map((item, idx) => { // API max = 30
      const li = new ApiContracts.LineItemType();
      li.setItemId(String(idx + 1));
      li.setName((item.name || 'Item').substring(0, 31));           // max 31 chars
      li.setDescription((item.part || '').substring(0, 255));
      li.setQuantity(String(item.qty || 1));
      li.setUnitPrice(String(parseFloat((item.price || '0').replace(/[^0-9.]/g, '')) || 0));
      return li;
    });
    lineItemsArr.setLineItem(items);
  }

  // ── Customer info ───────────────────────────────────────────────────────
  const customerData = new ApiContracts.CustomerDataType();
  customerData.setType(ApiContracts.CustomerTypeEnum.individual);
  customerData.setEmail(email);

  // ── Billing address ─────────────────────────────────────────────────────
  const billTo = new ApiContracts.CustomerAddressType();
  billTo.setFirstName(firstName.substring(0, 50));
  billTo.setLastName(lastName.substring(0, 50));
  if (company) billTo.setCompany(company.substring(0, 50));
  if (address) billTo.setAddress(address.substring(0, 60));
  if (city) billTo.setCity(city.substring(0, 40));
  if (state) billTo.setState(state.substring(0, 40));
  if (zip) billTo.setZip(zip.substring(0, 20));
  billTo.setCountry('US');
  if (phone) billTo.setPhoneNumber(phone.replace(/\D/g, '').substring(0, 25));

  // ── Transaction request ─────────────────────────────────────────────────
  const transactionRequest = new ApiContracts.TransactionRequestType();
  transactionRequest.setTransactionType(ApiContracts.TransactionTypeEnum.authCaptureTransaction);
  transactionRequest.setPayment(paymentType);
  transactionRequest.setAmount(parsedAmount.toFixed(2));
  transactionRequest.setOrder(orderDetails);
  transactionRequest.setCustomer(customerData);
  transactionRequest.setBillTo(billTo);
  if (Array.isArray(cartItems) && cartItems.length > 0) {
    transactionRequest.setLineItems(lineItemsArr);
  }

  // ── Create the full API request ─────────────────────────────────────────
  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequest);

  // ── Execute ─────────────────────────────────────────────────────────────
  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment());

  return new Promise((resolve) => {
    ctrl.execute(async () => {
      try {
        const apiResponse = ctrl.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (!response) {
          console.error('[Payment] No response from Authorize.net');
          res.status(502).json({ success: false, message: 'No response from payment gateway. Please try again.' });
          return resolve();
        }

        const messages = response.getMessages();
        const resultCode = messages.getResultCode();

        if (resultCode === ApiContracts.MessageTypeEnum.OK) {
          const txnResponse = response.getTransactionResponse();
          const txnMsgs = txnResponse ? txnResponse.getMessages() : null;

          if (txnResponse && txnMsgs) {
            const transId = txnResponse.getTransId();
            const authCode = txnResponse.getAuthCode();
            const msgCode = txnMsgs.getMessage()[0].getCode();
            const msgText = txnMsgs.getMessage()[0].getDescription();

            console.log(`[Payment] ✅ Approved — TransID: ${transId}  AuthCode: ${authCode}  Msg: ${msgCode} – ${msgText}`);

            // ── Build invoice data ────────────────────────────────────────
            const finalInvoiceNumber = invoiceNumber || `KJR-${Date.now()}`;
            const TAX_RATE = 0.08;

            const items = Array.isArray(cartItems) ? cartItems.map(item => {
              const unitPrice = parseFloat((item.price || '0').replace(/[^0-9.]/g, '')) || 0;
              const qty = parseInt(item.qty) || 1;
              return {
                name: item.name || 'Item',
                part: item.part || '',
                qty,
                unitPrice,
                lineTotal: parseFloat((unitPrice * qty).toFixed(2))
              };
            }) : [];

            const subtotal = parseFloat(items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
            const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
            const total = parseFloat((subtotal + taxAmount).toFixed(2));

            // ── Save invoice to DB ────────────────────────────────────────
            let savedInvoice = null;
            try {
              const estDelivery = new Date();
              estDelivery.setDate(estDelivery.getDate() + 5); // ~5 business days

              savedInvoice = await new Invoice({
                invoiceNumber: finalInvoiceNumber,
                transactionId: transId,
                authCode,
                firstName, lastName, email, phone,
                company: company || '',
                address: address || '',
                address2: req.body.address2 || '',
                city: city || '',
                state: state || '',
                zip: zip || '',
                notes: req.body.notes || '',
                items,
                subtotal,
                taxRate: TAX_RATE,
                taxAmount,
                shipping: 0,
                total,
                status: 'paid',
                orderStatus: 'confirmed',
                estimatedDelivery: estDelivery,
                // Seed the first tracking event
                trackingEvents: [{
                  status: 'Order Confirmed',
                  description: `Payment of $${total.toFixed(2)} received. Order #${finalInvoiceNumber} is confirmed and being prepared.`,
                  location: 'Lawrenceville, GA',
                  timestamp: new Date()
                }]
              }).save();
              console.log(`[Invoice] Saved: ${finalInvoiceNumber}`);
            } catch (dbErr) {
              console.error('[Invoice] DB save failed (payment still OK):', dbErr.message);
            }

            // ── Send invoice email ────────────────────────────────────────
            try {
              const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              });

              const itemRows = items.map(it => `
                <tr>
                  <td style="padding:.6rem .8rem;border-bottom:1px solid #eee;">${it.name}</td>
                  <td style="padding:.6rem .8rem;border-bottom:1px solid #eee;color:#64748b;font-size:.82rem;">${it.part || '—'}</td>
                  <td style="padding:.6rem .8rem;border-bottom:1px solid #eee;text-align:center;">${it.qty}</td>
                  <td style="padding:.6rem .8rem;border-bottom:1px solid #eee;text-align:right;">$${it.unitPrice.toFixed(2)}</td>
                  <td style="padding:.6rem .8rem;border-bottom:1px solid #eee;text-align:right;font-weight:700;">$${it.lineTotal.toFixed(2)}</td>
                </tr>`).join('');

              const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

              const htmlInvoice = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:700px;margin:2rem auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);">

    <!-- Header -->
    <div style="background:#0f172a;padding:2rem 2.5rem;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="color:#cc0000;font-size:.7rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:.3rem;">TAX INVOICE</div>
        <div style="color:#fff;font-size:1.5rem;font-weight:800;">KJIR Interior Designs Inc.</div>
        <div style="color:rgba(255,255,255,.55);font-size:.82rem;margin-top:.25rem;">1420 Industrial Park Road, Paris, TN 38242</div>
        <div style="color:rgba(255,255,255,.55);font-size:.82rem;">888-944-6313 &bull; info@kjrid.com</div>
      </div>
      <div style="text-align:right;">
        <div style="background:#cc0000;color:#fff;padding:.4rem 1rem;border-radius:6px;font-size:.75rem;font-weight:800;letter-spacing:.08em;margin-bottom:.75rem;">PAID ✓</div>
        <div style="color:#fff;font-size:1.1rem;font-weight:800;">#${finalInvoiceNumber}</div>
        <div style="color:rgba(255,255,255,.55);font-size:.78rem;margin-top:.25rem;">${invoiceDate}</div>
      </div>
    </div>

    <!-- Bill To / Ship To -->
    <div style="display:flex;gap:2rem;padding:1.75rem 2.5rem;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
      <div style="flex:1;">
        <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#64748b;margin-bottom:.6rem;">Bill To</div>
        <div style="font-weight:700;color:#0f172a;">${firstName} ${lastName}</div>
        ${company ? `<div style="color:#475569;font-size:.88rem;">${company}</div>` : ''}
        <div style="color:#475569;font-size:.88rem;">${email}</div>
        ${phone ? `<div style="color:#475569;font-size:.88rem;">${phone}</div>` : ''}
      </div>
      <div style="flex:1;">
        <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#64748b;margin-bottom:.6rem;">Ship To</div>
        <div style="font-weight:700;color:#0f172a;">${firstName} ${lastName}</div>
        <div style="color:#475569;font-size:.88rem;">${address || ''} ${req.body.address2 || ''}</div>
        <div style="color:#475569;font-size:.88rem;">${city || ''}, ${state || ''} ${zip || ''}</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#64748b;margin-bottom:.6rem;">Payment Info</div>
        <div style="color:#475569;font-size:.88rem;">Transaction ID: <strong>${transId}</strong></div>
        <div style="color:#475569;font-size:.88rem;">Auth Code: <strong>${authCode}</strong></div>
        <div style="color:#475569;font-size:.88rem;">Method: Credit Card</div>
        <div style="color:#16a34a;font-size:.88rem;font-weight:700;">Status: PAID</div>
      </div>
    </div>

    <!-- Line Items -->
    <div style="padding:1.75rem 2.5rem;">
      <table style="width:100%;border-collapse:collapse;font-size:.88rem;">
        <thead>
          <tr style="background:#0f172a;">
            <th style="padding:.65rem .8rem;text-align:left;color:#e2e8f0;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Item</th>
            <th style="padding:.65rem .8rem;text-align:left;color:#e2e8f0;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Part #</th>
            <th style="padding:.65rem .8rem;text-align:center;color:#e2e8f0;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Qty</th>
            <th style="padding:.65rem .8rem;text-align:right;color:#e2e8f0;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Unit Price</th>
            <th style="padding:.65rem .8rem;text-align:right;color:#e2e8f0;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
      <div style="margin-top:1.5rem;border-top:2px solid #e2e8f0;padding-top:1rem;max-width:280px;margin-left:auto;">
        <div style="display:flex;justify-content:space-between;padding:.35rem 0;font-size:.88rem;color:#475569;">
          <span>Subtotal</span><span>$${subtotal.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.35rem 0;font-size:.88rem;color:#475569;">
          <span>Tax (8%)</span><span>$${taxAmount.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.35rem 0;font-size:.88rem;color:#475569;">
          <span>Shipping</span><span>TBD</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.65rem 0;font-size:1.1rem;font-weight:800;color:#0f172a;border-top:2px solid #0f172a;margin-top:.35rem;">
          <span>Total Paid</span><span style="color:#cc0000;">$${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:1.25rem 2.5rem;text-align:center;">
      <p style="color:#64748b;font-size:.8rem;margin:0;">Thank you for your order! Questions? Call <strong>888-944-6313</strong> (24/7 Live Operator) or email <a href="mailto:info@kjrid.com" style="color:#cc0000;">info@kjrid.com</a></p>
      <p style="color:#94a3b8;font-size:.72rem;margin:.5rem 0 0;">View your invoice online at: <a href="https://kjr.vercel.app/invoice.html?id=${finalInvoiceNumber}" style="color:#cc0000;">kjr.vercel.app/invoice.html?id=${finalInvoiceNumber}</a></p>
      <p style="color:#94a3b8;font-size:.72rem;margin:.25rem 0 0;">Track your order: <a href="https://kjr.vercel.app/order-tracking.html?id=${finalInvoiceNumber}" style="color:#cc0000;">kjr.vercel.app/order-tracking.html?id=${finalInvoiceNumber}</a></p>
    </div>
  </div>
</body>
</html>`;

              // Send to customer
              await transporter.sendMail({
                from: `"KJR Interior Designs" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `Your Invoice #${finalInvoiceNumber} — KJR Interior Designs`,
                html: htmlInvoice
              });

              // Send copy to KJR team
              await transporter.sendMail({
                from: `"KJR Invoice System" <${process.env.SMTP_USER}>`,
                to: process.env.NOTIFY_EMAILS || 'estimating@kjrid.com',
                subject: `New Order Invoice #${finalInvoiceNumber} — ${firstName} ${lastName}`,
                html: htmlInvoice
              });

              console.log(`[Invoice] Email sent to: ${email}`);
            } catch (emailErr) {
              console.error('[Invoice] Email failed (payment+DB still OK):', emailErr.message);
            }

            res.json({
              success: true,
              transactionId: transId,
              authCode,
              message: msgText,
              invoiceNumber: finalInvoiceNumber,
              invoiceId: savedInvoice ? savedInvoice._id : null
            });
          } else {
            // ResultCode OK but transaction declined
            const errMsgs = txnResponse ? txnResponse.getErrors() : null;
            const errText = errMsgs
              ? errMsgs.getError()[0].getErrorText()
              : 'Transaction declined.';
            console.warn('[Payment] ⚠️  Declined:', errText);
            res.status(402).json({ success: false, message: errText });
          }
        } else {
          // API-level error
          const errText = messages.getMessage()[0].getText();
          console.error('[Payment] ❌ API error:', resultCode, errText);
          res.status(400).json({ success: false, message: errText });
        }
      } catch (err) {
        console.error('[Payment] Exception processing response:', err);
        res.status(500).json({ success: false, message: 'Internal server error processing payment.' });
      }
      resolve();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/config
// Returns the public client key so the frontend can initialise Accept.js
// (Safe to expose — this is designed to be public-facing)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/config', (req, res) => {
  res.json({
    apiLoginId: process.env.AUTHORIZENET_API_LOGIN_ID,
    publicClientKey: process.env.AUTHORIZENET_PUBLIC_CLIENT_KEY,
    environment: (process.env.AUTHORIZENET_ENVIRONMENT || 'SANDBOX').toUpperCase()
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/invoice/:invoiceNumber
// Returns invoice data for the public invoice page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/invoice/:invoiceNumber', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    console.error('[Invoice] Lookup error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/invoices  (admin)
// Returns all invoices
// ─────────────────────────────────────────────────────────────────────────────
const auth = require('../middleware/auth');
router.get('/invoices', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/order/:invoiceNumber
// Public order tracking endpoint — returns order status + timeline
// ─────────────────────────────────────────────────────────────────────────────
router.get('/order/:invoiceNumber', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber });
    if (!invoice) return res.status(404).json({ error: 'Order not found' });

    // Return only tracking-relevant fields (not card/payment details)
    res.json({
      invoiceNumber: invoice.invoiceNumber,
      orderStatus: invoice.orderStatus || 'confirmed',
      trackingNumber: invoice.trackingNumber || '',
      trackingCarrier: invoice.trackingCarrier || '',
      trackingUrl: invoice.trackingUrl || '',
      estimatedDelivery: invoice.estimatedDelivery || null,
      deliveredAt: invoice.deliveredAt || null,
      trackingEvents: invoice.trackingEvents || [],
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,

      // Customer name (first only for privacy)
      firstName: invoice.firstName,
      lastName: invoice.lastName.charAt(0) + '.',   // mask last name

      // Ship FROM (warehouse)
      shipFrom: {
        name: invoice.shipFromName || 'Jacob N Artye',
        company: invoice.shipFromCompany || 'KJR Interior Designs Inc.',
        address: invoice.shipFromAddress || '775 Tipton Industrial Dr Suite F',
        city: invoice.shipFromCity || 'Lawrenceville',
        state: invoice.shipFromState || 'GA',
        zip: invoice.shipFromZip || '30046',
        country: invoice.shipFromCountry || 'US',
      },

      // Ship TO (customer — show city/state only for privacy)
      shipTo: {
        city: invoice.city,
        state: invoice.state,
        zip: invoice.zip,
        country: 'US',
      },

      // Items summary
      items: invoice.items.map(i => ({
        name: i.name,
        part: i.part,
        qty: i.qty,
        lineTotal: i.lineTotal
      })),
      total: invoice.total,
    });
  } catch (err) {
    console.error('[Order] Tracking error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/payment/order/:invoiceNumber  (admin — update tracking)
// Body: { orderStatus, trackingNumber, trackingCarrier, trackingUrl,
//         estimatedDelivery, event: { status, description, location } }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/order/:invoiceNumber', auth, async (req, res) => {
  try {
    const inv = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber });
    if (!inv) return res.status(404).json({ error: 'Order not found' });

    const {
      orderStatus, trackingNumber, trackingCarrier,
      trackingUrl, estimatedDelivery, deliveredAt, event
    } = req.body;

    if (orderStatus) inv.orderStatus = orderStatus;
    if (trackingNumber) inv.trackingNumber = trackingNumber;
    if (trackingCarrier) inv.trackingCarrier = trackingCarrier;
    if (trackingUrl) inv.trackingUrl = trackingUrl;
    if (estimatedDelivery) inv.estimatedDelivery = new Date(estimatedDelivery);
    if (deliveredAt) inv.deliveredAt = new Date(deliveredAt);
    inv.updatedAt = new Date();

    // Push new timeline event if provided
    if (event && event.status) {
      inv.trackingEvents.push({
        status: event.status,
        description: event.description || '',
        location: event.location || '',
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
      });
    }

    await inv.save();
    res.json({ success: true, orderStatus: inv.orderStatus, trackingEvents: inv.trackingEvents });
  } catch (err) {
    console.error('[Order] Update error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
