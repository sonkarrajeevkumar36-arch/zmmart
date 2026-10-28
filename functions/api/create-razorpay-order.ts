import { createRazorpayOrderOnGateway, getRazorpayCredentials, RazorpayEnv, CORS_HEADERS } from '../_utils/razorpay';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
};

export const onRequestGet = async (context: {
  env: RazorpayEnv;
}): Promise<Response> => {
  const { env } = context;
  const { keyId, keySecret } = getRazorpayCredentials(env);
  const isConfigured = Boolean(keyId && keySecret);
  const keyPrefix = keyId ? (keyId.startsWith('rzp_live_') ? 'rzp_live_...' : keyId.startsWith('rzp_test_') ? 'rzp_test_...' : 'configured') : 'missing';

  return new Response(
    JSON.stringify({
      success: true,
      service: 'Zypsomart Razorpay Order Creation API',
      status: 'ready',
      keysConfigured: isConfigured,
      keyType: keyPrefix
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    }
  );
};

export const onRequestPost = async (context: {
  request: Request;
  env: RazorpayEnv;
}): Promise<Response> => {
  const { request, env } = context;

  try {
    const { keyId, keySecret } = getRazorpayCredentials(env);

    if (!keyId || !keySecret) {
      const missingList: string[] = [];
      if (!keyId) missingList.push('RAZORPAY_KEY_ID');
      if (!keySecret) missingList.push('RAZORPAY_KEY_SECRET');

      console.warn(`[Razorpay Order API Diagnostics]: Missing Cloudflare Secrets: ${missingList.join(', ')}`);

      return new Response(
        JSON.stringify({
          success: false,
          keysConfigured: false,
          missingKeys: missingList,
          error: `Razorpay credentials missing in Cloudflare Pages (${missingList.join(', ')}). Please add them in Cloudflare Pages Settings -> Environment variables and trigger a redeployment.`
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    let rawBody = '';
    try {
      rawBody = await request.text();
    } catch {
      rawBody = '{}';
    }

    let body: any = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON request payload.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cart is empty or invalid.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ success: false, error: 'Order total must be greater than zero.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const receipt = `zyp_${Date.now().toString(36)}`;

    // Call Razorpay API to create official order
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

    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
        isLive: keyId.startsWith('rzp_live_')
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    // Safe logging without credentials or sensitive user data
    console.error('[Create Razorpay Order Failure]:', err?.message || err);
    return new Response(
      JSON.stringify({
        success: false,
        gatewayError: true,
        error: err?.message || 'Failed to create Razorpay order'
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
  }
};
