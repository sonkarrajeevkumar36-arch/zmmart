import { verifyWebhookSignature, getRazorpayCredentials, CORS_HEADERS } from './_utils/razorpay';

async function parseRawBody(req: any): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => resolve(raw));
    req.on('error', () => resolve(''));
  });
}

export default async function handler(req: any, res?: any) {
  // 1. Web Standard Mode
  if (req instanceof Request || (!res && typeof (req as any)?.json === 'function')) {
    const webReq = req as Request;
    if (webReq.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (webReq.method === 'GET') {
      return new Response(
        JSON.stringify({ success: true, service: 'Zypsomart Razorpay Webhook Endpoint (Vercel)', status: 'active' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const { keySecret } = getRazorpayCredentials();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;
    const signature = webReq.headers.get('x-razorpay-signature');

    if (!webhookSecret || !signature) {
      return new Response(JSON.stringify({ success: false, error: 'Missing webhook configuration' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const rawBody = await webReq.text();
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, verified: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  // 2. Node.js (req, res) Serverless Mode
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, val);
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Zypsomart Razorpay Webhook Endpoint (Vercel)',
      status: 'active'
    });
  }

  const { keySecret } = getRazorpayCredentials();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!webhookSecret) {
    return res.status(500).json({ success: false, error: 'Webhook secret not configured' });
  }

  if (!signature) {
    return res.status(400).json({ success: false, error: 'Missing x-razorpay-signature header' });
  }

  const rawBody = await parseRawBody(req);
  const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);

  if (!isValid) {
    return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
  }

  return res.status(200).json({ success: true, verified: true, received: true });
}
