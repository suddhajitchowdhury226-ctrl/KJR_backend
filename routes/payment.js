/**
 * routes/payment.js  —  Authorize.net JSON API (Node built-in https, no deps)
 */

const express = require('express');
const router  = require('express').Router();
const https   = require('https');

const ANET_HOST = 'api.authorize.net';          // production
// const ANET_HOST = 'apitest.authorize.net';   // sandbox

function getAnetHost() {
  return (process.env.AUTHORIZENET_ENVIRONMENT || 'SANDBOX').toUpperCase() === 'PRODUCTION'
    ? 'api.authorize.net'
    : 'apitest.authorize.net';
}

/** POST JSON to Authorize.net — returns parsed response object */
function anetPost(bodyObj) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(bodyObj);
    const options = {
      hostname: getAnetHost(),
      path:     '/xml/v1/request.api',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          // Strip BOM if present
          resolve(JSON.parse(raw.replace(/^\uFEFF/, '')));
        } catch (e) {
          reject(new Error('Invalid JSON from Authorize.net: ' + raw.substring(0, 100)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/config
// ─────────────────────────────────────────────────────────────────────────────
router.get('/config', (req, res) => {
  res.json({
    apiLoginId:      process.env.AUTHORIZENET_API_LOGIN_ID,
    publicClientKey: process.env.AUTHORIZENET_PUBLIC_CLIENT_KEY,
    environment:     (process.env.AUTHORIZENET_ENVIRONMENT || 'SANDBOX').toUpperCase()
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/charge
// ─────────────────────────────────────────────────────────────────────────────
router.post('/charge', async (req, res) => {
  const {
    opaqueDataDescriptor, opaqueDataValue,
    amount, firstName, lastName, email, phone,
    address, city, state, zip, company,
    invoiceNumber, description, cartItems
  } = req.body;

  // Validation
  if (!opaqueDataDescriptor || !opaqueDataValue)
    return res.status(400).json({ success: false, message: 'Payment token missing. Please try again.' });

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0)
    return res.status(400).json({ success: false, message: 'Invalid payment amount.' });

  if (!firstName || !lastName || !email)
    return res.status(400).json({ success: false, message: 'Customer information is incomplete.' });

  // Build line items
  const lineItems = Array.isArray(cartItems) && cartItems.length > 0
    ? cartItems.slice(0, 30).map((item, idx) => ({
        itemId:      String(idx + 1),
        name:        (item.name || 'Item').substring(0, 31),
        description: (item.part || '').substring(0, 255),
        quantity:    String(item.qty || 1),
        unitPrice:   String(parseFloat((item.price || '0').replace(/[^0-9.]/g, '')) || 0)
      }))
    : null;

  const invoiceNum = (invoiceNumber || ('KJR-' + Date.now())).substring(0, 20);

  const payload = {
    createTransactionRequest: {
      merchantAuthentication: {
        name:           process.env.AUTHORIZENET_API_LOGIN_ID,
        transactionKey: process.env.AUTHORIZENET_TRANSACTION_KEY
      },
      refId: invoiceNum,
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount:          parsedAmount.toFixed(2),
        payment: {
          opaqueData: {
            dataDescriptor: opaqueDataDescriptor,
            dataValue:      opaqueDataValue
          }
        },
        order: {
          invoiceNumber: invoiceNum,
          description:   (description || 'KJR Interior Designs Order').substring(0, 255)
        },
        ...(lineItems ? { lineItems: { lineItem: lineItems } } : {}),
        billTo: {
          firstName:  firstName.substring(0, 50),
          lastName:   lastName.substring(0, 50),
          ...(company ? { company:     company.substring(0, 50) } : {}),
          ...(address ? { address:     address.substring(0, 60) } : {}),
          ...(city    ? { city:        city.substring(0, 40)    } : {}),
          ...(state   ? { state:       state.substring(0, 40)   } : {}),
          ...(zip     ? { zip:         zip.substring(0, 20)     } : {}),
          country:    'US',
          ...(phone   ? { phoneNumber: phone.replace(/\D/g, '').substring(0, 25) } : {})
        },
        userFields: {
          userField: [{ name: 'source', value: 'KJR-Website' }]
        }
      }
    }
  };

  try {
    const data = await anetPost(payload);

    const resultCode = data.messages && data.messages.resultCode;
    console.log('[Payment] Authorize.net resultCode:', resultCode);

    if (resultCode === 'Ok') {
      const txn = data.transactionResponse;

      if (txn && txn.responseCode === '1') {
        // ✅ Approved
        console.log('[Payment] ✅ Approved — TransID:', txn.transId, ' AuthCode:', txn.authCode);
        return res.json({
          success:       true,
          transactionId: txn.transId,
          authCode:      txn.authCode,
          message:       (txn.messages && txn.messages[0] && txn.messages[0].description) || 'Approved',
          invoiceNumber: invoiceNum
        });
      } else {
        // Declined
        const errText = txn && txn.errors && txn.errors[0]
          ? txn.errors[0].errorText
          : txn && txn.responseCode === '2' ? 'Card declined by your bank.'
          : txn && txn.responseCode === '3' ? 'Card error — please check your details.'
          : 'Transaction declined.';
        console.warn('[Payment] ⚠️  Declined (code', txn && txn.responseCode, '):', errText);
        return res.status(402).json({ success: false, message: errText });
      }
    } else {
      // API-level error (bad credentials, invalid token, etc.)
      const errText = data.messages && data.messages.message && data.messages.message[0]
        ? data.messages.message[0].text
        : 'Payment gateway error.';
      console.error('[Payment] ❌ API error:', errText);
      return res.status(400).json({ success: false, message: errText });
    }

  } catch (err) {
    console.error('[Payment] Request failed:', err.message);
    return res.status(502).json({ success: false, message: 'Could not reach payment gateway. Please try again.' });
  }
});

module.exports = router;
