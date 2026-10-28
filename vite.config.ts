import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import crypto from 'crypto';
import { defineConfig } from 'vite';

function razorpayDevPlugin() {
  return {
    name: 'razorpay-dev-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const rawUrl = req.url || '';
        const urlPath = rawUrl.split('?')[0].replace(/\/+$/, '');

        // Global CORS headers for dev API
        const setCorsHeaders = () => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-razorpay-signature');
        };

        // Handle preflight OPTIONS requests for all /api/* routes
        if (urlPath.startsWith('/api/') && req.method === 'OPTIONS') {
          setCorsHeaders();
          res.writeHead(204);
          res.end();
          return;
        }

        // 1. Server-side Order Creation Endpoint
        if (urlPath === '/api/create-razorpay-order') {
          setCorsHeaders();

          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, service: 'create-razorpay-order', status: 'online' }));
            return;
          }

          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
              const keySecret = process.env.RAZORPAY_KEY_SECRET;

              const itemTotal = (body.items || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
              const isFree = itemTotal > 100;
              const delivery = isFree ? 0 : (Number(body.deliveryCharge) || 25);
              const finalTotal = itemTotal + delivery;
              const amountInPaise = Math.round(finalTotal * 100);

              if (amountInPaise <= 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Order total must be greater than zero.' }));
                return;
              }

              // If live or test keys are configured, use official Razorpay API
              if (keyId && keySecret) {
                const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
                const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
                  method: 'POST',
                  headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: 'zyp_' + Date.now().toString(36),
                    notes: {
                      customerName: (body.customerName || '').slice(0, 50),
                      customerPhone: (body.customerPhone || '').slice(0, 15)
                    }
                  })
                });

                const rzpText = await rzpRes.text();
                let rzpData: any = {};
                try {
                  rzpData = JSON.parse(rzpText);
                } catch {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'Razorpay returned unexpected response' }));
                  return;
                }

                if (!rzpRes.ok) {
                  res.writeHead(rzpRes.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: rzpData?.error?.description || 'Razorpay order creation failed' }));
                  return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  orderId: rzpData.id,
                  amount: rzpData.amount,
                  currency: rzpData.currency,
                  keyId,
                  mode: keyId.startsWith('rzp_test_') ? 'test' : 'live'
                }));
                return;
              }

              // Sandbox Test Mode fallback (instant testing without requiring live credentials)
              const mockOrderId = 'order_test_' + Date.now().toString(36);
              const mockPaymentId = 'pay_test_' + Date.now().toString(36);
              const testSecret = 'rzp_test_secret_sandbox';
              const testSignature = crypto
                .createHmac('sha256', testSecret)
                .update(mockOrderId + '|' + mockPaymentId)
                .digest('hex');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                orderId: mockOrderId,
                amount: amountInPaise,
                currency: 'INR',
                keyId: 'rzp_test_zypsomart_mock',
                isTestSimulator: true,
                simulatedPayment: {
                  razorpay_order_id: mockOrderId,
                  razorpay_payment_id: mockPaymentId,
                  razorpay_signature: testSignature
                },
                mode: 'test'
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error creating order' }));
            }
          });
          return;
        }

        // 2. Server-side Cryptographic Signature Verification Endpoint
        if (urlPath === '/api/verify-payment') {
          setCorsHeaders();

          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, service: 'verify-payment', status: 'online' }));
            return;
          }

          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

              if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing required Razorpay payment verification fields.' }));
                return;
              }

              const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_sandbox';
              const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(razorpay_order_id + '|' + razorpay_payment_id)
                .digest('hex');

              const isValid = expectedSignature.toLowerCase() === String(razorpay_signature).toLowerCase();

              if (!isValid) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Payment signature verification failed' }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                verified: true,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error verifying payment' }));
            }
          });
          return;
        }

        // 3. Server-side Razorpay Webhook Endpoint
        if (urlPath === '/api/razorpay-webhook') {
          setCorsHeaders();

          if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, service: 'razorpay-webhook', status: 'online' }));
            return;
          }

          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const signature = req.headers['x-razorpay-signature'];
              if (!signature) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing x-razorpay-signature header' }));
                return;
              }

              const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_test_webhook_secret';
              const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(bodyStr)
                .digest('hex');

              const isValid = expectedSignature.toLowerCase() === String(signature).toLowerCase();
              if (!isValid) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid webhook signature' }));
                return;
              }

              const event = bodyStr ? JSON.parse(bodyStr) : {};
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                verified: true,
                receivedEvent: event?.event || 'unknown'
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error processing webhook' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), razorpayDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
