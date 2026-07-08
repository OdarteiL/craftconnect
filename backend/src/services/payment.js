const axios = require('axios');
const crypto = require('crypto');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = 'https://api.paystack.co';

const headers = () => ({
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json'
});

/**
 * Initialize a Paystack transaction.
 * Returns { authorization_url, access_code, reference }
 */
async function initializePayment({ email, amount_ghs, reference, callback_url, metadata = {} }) {
  if (!PAYSTACK_SECRET) throw new Error('PAYSTACK_SECRET_KEY not configured.');

  // Paystack expects amount in pesewas (GHS * 100)
  const amount = Math.round(parseFloat(amount_ghs) * 100);

  const { data } = await axios.post(`${BASE}/transaction/initialize`, {
    email,
    amount,
    reference,
    callback_url,
    currency: 'GHS',
    channels: ['mobile_money', 'card', 'bank'],
    metadata
  }, { headers: headers() });

  if (!data.status) throw new Error(data.message || 'Paystack initialization failed.');
  return data.data; // { authorization_url, access_code, reference }
}

/**
 * Verify a transaction by reference.
 * Returns the full transaction object.
 */
async function verifyPayment(reference) {
  if (!PAYSTACK_SECRET) throw new Error('PAYSTACK_SECRET_KEY not configured.');

  const { data } = await axios.get(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers()
  });

  if (!data.status) throw new Error(data.message || 'Verification failed.');
  return data.data; // { status: 'success'|'failed', amount, channel, ... }
}

/**
 * Verify Paystack webhook signature.
 * Returns true if the request is genuinely from Paystack.
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!PAYSTACK_SECRET) return false;
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

module.exports = { initializePayment, verifyPayment, verifyWebhookSignature };
