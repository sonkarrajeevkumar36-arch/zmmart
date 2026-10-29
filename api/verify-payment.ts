import { verifyRazorpaySignature, getRazorpayCredentials, CORS_HEADERS } from './_utils/razorpay';

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

export default async function handler(req: any, res?: any) {
  // 1. Web Standard Mode
  if (req instanceof Request || (!res && typeof (req as any)?.json === 'function')) {
    const webReq = req as Request;
    if (webReq.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const { keySecret } = getRazorpayCredentials();

    if (webReq.method === 'GET') {
      return new Response(
        JSON.stringify({
          success: true,
          service: 'Zypsomart Payment Verification API (Vercel Serverless)',
          status: 'ready',
          secretConfigured: Boolean(keySecret)
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
      if (!keySecret) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'RAZORPAY_KEY_SECRET is not configured in Vercel Environment Variables.'
          }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const body = await webReq.json().catch(() => ({}));
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required Razorpay payment verification fields.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        keySecret
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, verified: false, error: 'Payment signature verification failed.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err?.message || 'Verification failed' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Node.js (req, res) Serverless Mode
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, val);
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { keySecret } = getRazorpayCredentials();

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Zypsomart Payment Verification API (Vercel Serverless)',
      status: 'ready',
      secretConfigured: Boolean(keySecret)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!keySecret) {
      console.warn('[Vercel Verification API]: Missing RAZORPAY_KEY_SECRET in Vercel Environment Variables');
      return res.status(500).json({
        success: false,
        error: 'RAZORPAY_KEY_SECRET is not configured in Vercel Environment Variables.'
      });
    }

    const body = await parseRequestBody(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Razorpay payment verification fields.'
      });
    }

    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.warn('[Payment Verification Failed]: Invalid HMAC signature', {
        orderId: String(razorpay_order_id).slice(-8)
      });
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Payment signature verification failed. Transaction was not verified.'
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (err: any) {
    console.error('[Verify Payment Failure]:', err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Server error during payment verification'
    });
  }
}
