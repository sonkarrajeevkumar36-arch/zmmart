import { createRazorpayOrderOnGateway, getRazorpayCredentials, CORS_HEADERS } from './_utils/razorpay';

// Helper to safely parse body in Node/Vercel serverless environment
async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  // If body is a stream (e.g. raw Node IncomingMessage)
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Universal handler supporting both Vercel Serverless (req, res) and Web (Request, Response)
export default async function handler(req: any, res?: any) {
  // 1. Web Standard (Request, Response) Mode (Edge runtime or fetch event)
  if (req instanceof Request || (!res && typeof (req as any)?.json === 'function')) {
    const webReq = req as Request;
    if (webReq.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { keyId, keySecret } = getRazorpayCredentials();

    if (webReq.method === 'GET') {
      return new Response(
        JSON.stringify({
          success: true,
          service: 'Zypsomart Razorpay Order Creation API (Vercel Serverless)',
          status: 'ready',
          keysConfigured: Boolean(keyId && keySecret),
          keyType: keyId ? (keyId.startsWith('rzp_live_') ? 'rzp_live_...' : keyId.startsWith('rzp_test_') ? 'rzp_test_...' : 'configured') : 'missing'
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (webReq.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    try {
      if (!keyId || !keySecret) {
        const missingList: string[] = [];
        if (!keyId) missingList.push('RAZORPAY_KEY_ID');
        if (!keySecret) missingList.push('RAZORPAY_KEY_SECRET');
        return new Response(
          JSON.stringify({
            success: false,
            keysConfigured: false,
            missingKeys: missingList,
            error: `Razorpay credentials missing in Vercel Environment Variables: ${missingList.join(', ')}.`
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const body = await webReq.json().catch(() => ({}));
      const order = await processOrderCreation(body, keyId, keySecret);
      return new Response(JSON.stringify(order), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err?.message || 'Order creation failed' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }

  // 2. Node.js (req, res) Serverless Mode (Standard Vercel Node runtime)
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, val);
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { keyId, keySecret } = getRazorpayCredentials();

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Zypsomart Razorpay Order Creation API (Vercel Serverless)',
      status: 'ready',
      keysConfigured: Boolean(keyId && keySecret),
      keyType: keyId ? (keyId.startsWith('rzp_live_') ? 'rzp_live_...' : keyId.startsWith('rzp_test_') ? 'rzp_test_...' : 'configured') : 'missing'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!keyId || !keySecret) {
      const missingList: string[] = [];
      if (!keyId) missingList.push('RAZORPAY_KEY_ID');
      if (!keySecret) missingList.push('RAZORPAY_KEY_SECRET');

      console.warn(`[Vercel Razorpay API Diagnostics]: Missing environment variables: ${missingList.join(', ')}`);

      return res.status(200).json({
        success: false,
        keysConfigured: false,
        missingKeys: missingList,
        error: `Razorpay credentials missing in Vercel Environment Variables: ${missingList.join(', ')}. Please add them in Vercel Project Settings -> Environment Variables and redeploy.`
      });
    }

    const body = await parseRequestBody(req);
    const orderData = await processOrderCreation(body, keyId, keySecret);
    return res.status(200).json(orderData);
  } catch (err: any) {
    console.error('[Vercel Razorpay Order Error]:', err?.message || err);
    return res.status(500).json({
      success: false,
      gatewayError: true,
      error: err?.message || 'Failed to create Razorpay order'
    });
  }
}

// Common business logic for recalculating total and generating gateway order
async function processOrderCreation(body: any, keyId: string, keySecret: string) {
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw new Error('Cart is empty or invalid.');
  }

  // Recalculate trusted server-side total
  const itemTotal = body.items.reduce((sum: number, item: any) => {
    const price = Math.max(0, Number(item?.price) || 0);
    const qty = Math.max(1, Number(item?.qty) || 1);
    return sum + price * qty;
  }, 0);

  // Free delivery above ₹100 rule
  const isFreeDelivery = itemTotal > 100;
  const delivery = isFreeDelivery ? 0 : Math.max(0, Number(body.deliveryCharge) || 25);
  const finalTotal = itemTotal + delivery;
  const amountInPaise = Math.round(finalTotal * 100);

  if (amountInPaise <= 0) {
    throw new Error('Order total must be greater than zero.');
  }

  const receipt = `zyp_${Date.now().toString(36)}`;

  const razorpayOrder = await createRazorpayOrderOnGateway({
    amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      customerName: String(body.customerName || '').slice(0, 50),
      customerPhone: String(body.customerPhone || '').slice(0, 15),
      customerAddress: String(body.customerAddress || '').slice(0, 100)
    },
    keyId,
    keySecret
  });

  return {
    success: true,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId,
    isLive: keyId.startsWith('rzp_live_')
  };
}
