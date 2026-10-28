import { verifyWebhookSignature, getRazorpayCredentials, RazorpayEnv, CORS_HEADERS } from '../_utils/razorpay';
import { getGoogleAccessToken, updateFirestoreDocument } from '../_utils/firebase';

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
};

export const onRequestGet = async (): Promise<Response> => {
  return new Response(
    JSON.stringify({
      success: true,
      service: 'Zypsomart Razorpay Webhook Endpoint',
      status: 'active'
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
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || keySecret;

    if (!webhookSecret) {
      console.warn('[Webhook] No secret configured to verify incoming webhook');
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook secret unconfigured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing x-razorpay-signature header' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await request.text();
    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.warn('[Webhook] Signature verification failed');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid webhook signature' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    let event: any = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Malformed webhook event JSON' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Razorpay Webhook Event]:', event?.event);

    // Handle payment captured or order paid events
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;

      if (env.FIREBASE_SERVICE_ACCOUNT && orderId) {
        const projectId = env.FIREBASE_PROJECT_ID || 'zypso-mart-cd989';
        const token = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
        if (token) {
          const firestoreId = payment?.notes?.firestoreOrderId;
          if (firestoreId) {
            await updateFirestoreDocument({
              projectId,
              collection: 'orders',
              docId: firestoreId,
              fields: {
                paymentStatus: 'paid',
                paymentMethod: 'online',
                razorpayPaymentId: paymentId || '',
                razorpayOrderId: orderId,
                status: 'placed',
                paidAt: new Date().toISOString()
              },
              accessToken: token
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, verified: true, received: true }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Webhook processing error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
};
