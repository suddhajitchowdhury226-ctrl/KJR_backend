/**
 * routes/payment.js  —  Authorize.net Accept.js charge endpoint
 *
 * Flow:
 *   1. Frontend tokenises card data with Authorize.net Accept.js (PCI-compliant)
 *   2. Frontend POSTs the opaque nonce + order data here
 *   3. We call Authorize.net createTransactionRequest (authCapture)
 *   4. We return transaction result to the frontend
 */

const express           = require('express');
const router            = express.Router();
const AuthorizenetSDK   = require('authorizenet');

const ApiContracts   = AuthorizenetSDK.APIContracts;
const ApiControllers = AuthorizenetSDK.APIControllers;
const SDKConstants   = AuthorizenetSDK.Constants;

function getEnvironment() {
  return (process.env.AUTHORIZENET_ENVIRONMENT || 'SANDBOX').toUpperCase() === 'PRODUCTION'
    ? SDKConstants.endpoint.production
    : SDKConstants.endpoint.sandbox;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/config
// Returns the public client key so the frontend can initialise Accept.js
// (Safe to expose — the Public Client Key is designed to be public-facing)
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

  // Basic validation
  if (!opaqueDataDescriptor || !opaqueDataValue)
    return res.status(400).json({ success: false, message: 'Payment token missing. Please try again.' });

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0)
    return res.status(400).json({ success: false, message: 'Invalid payment amount.' });

  if (!firstName || !lastName || !email)
    return res.status(400).json({ success: false, message: 'Customer information is incomplete.' });

  // Merchant auth
  const merchantAuth = new ApiContracts.MerchantAuthenticationType();
  merchantAuth.setName(process.env.AUTHORIZENET_API_LOGIN_ID);
  merchantAuth.setTransactionKey(process.env.AUTHORIZENET_TRANSACTION_KEY);

  // Opaque (tokenised) card data from Accept.js
  const opaqueData = new ApiContracts.OpaqueDataType();
  opaqueData.setDataDescriptor(opaqueDataDescriptor);
  opaqueData.setDataValue(opaqueDataValue);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setOpaqueData(opaqueData);

  // Order
  const orderDetails = new ApiContracts.OrderType();
  orderDetails.setInvoiceNumber((invoiceNumber || ('KJR-' + Date.now())).substring(0, 20));
  orderDetails.setDescription((description || 'KJR Interior Designs Order').substring(0, 255));

  // Line items (up to 30)
  if (Array.isArray(cartItems) && cartItems.length > 0) {
    const lineItemsArr = new ApiContracts.ArrayOfLineItem();
    const items = cartItems.slice(0, 30).map((item, idx) => {
      const li = new ApiContracts.LineItemType();
      li.setItemId(String(idx + 1));
      li.setName((item.name || 'Item').substring(0, 31));
      li.setDescription((item.part || '').substring(0, 255));
      li.setQuantity(String(item.qty || 1));
      li.setUnitPrice(String(parseFloat((item.price || '0').replace(/[^0-9.]/g, '')) || 0));
      return li;
    });
    lineItemsArr.setLineItem(items);
  }

  // Customer
  const customerData = new ApiContracts.CustomerDataType();
  customerData.setType(ApiContracts.CustomerTypeEnum.individual);
  customerData.setEmail(email);

  // Billing address
  const billTo = new ApiContracts.CustomerAddressType();
  billTo.setFirstName(firstName.substring(0, 50));
  billTo.setLastName(lastName.substring(0, 50));
  if (company) billTo.setCompany(company.substring(0, 50));
  if (address) billTo.setAddress(address.substring(0, 60));
  if (city)    billTo.setCity(city.substring(0, 40));
  if (state)   billTo.setState(state.substring(0, 40));
  if (zip)     billTo.setZip(zip.substring(0, 20));
  billTo.setCountry('US');
  if (phone)   billTo.setPhoneNumber(phone.replace(/\D/g, '').substring(0, 25));

  // Transaction request
  const transactionRequest = new ApiContracts.TransactionRequestType();
  transactionRequest.setTransactionType(ApiContracts.TransactionTypeEnum.authCaptureTransaction);
  transactionRequest.setPayment(paymentType);
  transactionRequest.setAmount(parsedAmount.toFixed(2));
  transactionRequest.setOrder(orderDetails);
  transactionRequest.setCustomer(customerData);
  transactionRequest.setBillTo(billTo);

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuth);
  createRequest.setTransactionRequest(transactionRequest);

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.setEnvironment(getEnvironment());

  return new Promise((resolve) => {
    ctrl.execute(() => {
      try {
        const apiResponse = ctrl.getResponse();
        const response    = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (!response) {
          res.status(502).json({ success: false, message: 'No response from payment gateway.' });
          return resolve();
        }

        const messages   = response.getMessages();
        const resultCode = messages.getResultCode();

        if (resultCode === ApiContracts.MessageTypeEnum.OK) {
          const txnResponse = response.getTransactionResponse();
          const txnMsgs     = txnResponse ? txnResponse.getMessages() : null;

          if (txnResponse && txnMsgs) {
            const transId  = txnResponse.getTransId();
            const authCode = txnResponse.getAuthCode();
            const msgText  = txnMsgs.getMessage()[0].getDescription();
            console.log('[Payment] Approved — TransID:', transId, ' AuthCode:', authCode);
            res.json({ success: true, transactionId: transId, authCode, message: msgText,
                       invoiceNumber: invoiceNumber || ('KJR-' + Date.now()) });
          } else {
            const errMsgs = txnResponse ? txnResponse.getErrors() : null;
            const errText = errMsgs ? errMsgs.getError()[0].getErrorText() : 'Transaction declined.';
            console.warn('[Payment] Declined:', errText);
            res.status(402).json({ success: false, message: errText });
          }
        } else {
          const errText = messages.getMessage()[0].getText();
          console.error('[Payment] API error:', resultCode, errText);
          res.status(400).json({ success: false, message: errText });
        }
      } catch (err) {
        console.error('[Payment] Exception:', err);
        res.status(500).json({ success: false, message: 'Internal server error processing payment.' });
      }
      resolve();
    });
  });
});

module.exports = router;
