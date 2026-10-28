import { verifyRazorpaySignature, getRazorpayCredentials, RazorpayEnv, CORS_HEADERS } from '../_utils/razorpay';
import { getGoogleAccessToken, updateFirestoreDocument } from '../_utils/firebase';

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
  const { keySecret } = getRazorpayCredentials(env);

  return new Response(
    JSON.stringify({
      success: true,
      service: 'Zypsomart Payment Verification API',
      status: 'ready',
      secretConfigured: Boolean(keySecret)
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
    const { keySecret } = getRazorpayCredentials(env);

    if (!keySecret) {
      console.warn('[Verify Payment API Diagnostics]: Missing RAZORPAY_KEY_SECRET in Cloudflare Secrets');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured in Cloudflare Pages Secrets.'
        }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firestoreOrderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required Razorpay payment verification fields.'
        }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Cryptographic signature check (HMAC-SHA256)
    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.warn('[Payment Verification Failed]: Invalid HMAC signature for order', {
        razorpay_order_id: String(razorpay_order_id).slice(-8)
      });
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'Payment signature verification failed. Transaction was not verified.'
        }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // If Firebase Service Account is configured in Cloudflare Secrets, update Firestore directly
    let firestoreUpdated = false;
    if (env.FIREBASE_SERVICE_ACCOUNT && firestoreOrderId) {
      const projectId = env.FIREBASE_PROJECT_ID || 'zypso-mart-cd989';
      const token = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
      if (token) {
        firestoreUpdated = await updateFirestoreDocument({
          projectId,
          collection: 'orders',
          docId: firestoreOrderId,
          fields: {
            paymentStatus: 'paid',
            paymentMethod: 'online',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            status: 'placed',
            paidAt: new Date().toISOString()
          },
          accessToken: token
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        firestoreUpdated
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Verify Payment Failure]:', err?.message || err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Server error during payment verification'
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
};
