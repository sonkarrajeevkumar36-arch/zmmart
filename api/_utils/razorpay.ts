/**
 * Universal utility functions for Razorpay integration on Vercel, Cloudflare, and Node.js.
 * Built with standard Web Crypto API (subtle crypto) for high performance and zero external dependencies.
 */

export interface RazorpayEnv {
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_SERVICE_ACCOUNT?: string;
  VITE_RAZORPAY_KEY_ID?: string;
  [key: string]: any;
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-razorpay-signature',
};

/**
 * Universal credential resolver for Vercel, Cloudflare Pages, and Node.js.
 * Supports standard names, common aliases, case insensitivity, and trims accidental whitespace.
 */
export function getRazorpayCredentials(env?: any): { keyId: string; keySecret: string } {
  const safeEnv = env || {};

  const rawKeyId =
    safeEnv.RAZORPAY_KEY_ID ||
    safeEnv.VITE_RAZORPAY_KEY_ID ||
    safeEnv.RAZORPAY_LIVE_KEY_ID ||
    safeEnv.RAZORPAY_API_KEY ||
    safeEnv.razorpay_key_id ||
    (typeof process !== 'undefined' ? process.env?.RAZORPAY_KEY_ID || process.env?.VITE_RAZORPAY_KEY_ID || process.env?.RAZORPAY_LIVE_KEY_ID || process.env?.razorpay_key_id : '') ||
    '';

  const rawKeySecret =
    safeEnv.RAZORPAY_KEY_SECRET ||
    safeEnv.RAZORPAY_SECRET ||
    safeEnv.RAZORPAY_LIVE_KEY_SECRET ||
    safeEnv.RAZORPAY_API_SECRET ||
    safeEnv.razorpay_key_secret ||
    (typeof process !== 'undefined' ? process.env?.RAZORPAY_KEY_SECRET || process.env?.RAZORPAY_SECRET || process.env?.RAZORPAY_LIVE_KEY_SECRET || process.env?.razorpay_key_secret : '') ||
    '';

  return {
    keyId: String(rawKeyId).trim(),
    keySecret: String(rawKeySecret).trim()
  };
}

/**
 * Safe base64 encoding that works universally across Node.js, Vercel, and Cloudflare Workers runtimes
 */
export function safeBase64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  if (typeof btoa === 'function') {
    try {
      return btoa(str);
    } catch {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }
  return '';
}

/**
 * Verify Razorpay payment signature using Web Crypto HMAC-SHA256
 * Razorpay expects: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
 */
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payload = `${orderId}|${paymentId}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return timingSafeEqual(calculatedSignature.toLowerCase(), signature.toLowerCase());
  } catch (err) {
    console.error('[Razorpay Signature Verification Error]:', err);
    return false;
  }
}

/**
 * Verify Razorpay Webhook signature using Web Crypto HMAC-SHA256
 * Razorpay sends X-Razorpay-Signature containing HMAC_SHA256(raw_body, webhook_secret)
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const calculatedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return timingSafeEqual(calculatedSignature.toLowerCase(), signature.toLowerCase());
  } catch (err) {
    console.error('[Razorpay Webhook Verification Error]:', err);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Calls Razorpay API to create an order
 */
export async function createRazorpayOrderOnGateway(params: {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
  keyId: string;
  keySecret: string;
}): Promise<{ id: string; amount: number; currency: string; receipt: string }> {
  const authHeader = 'Basic ' + safeBase64Encode(`${params.keyId}:${params.keySecret}`);
  const payload = {
    amount: params.amountInPaise,
    currency: params.currency || 'INR',
    receipt: params.receipt,
    notes: params.notes || {}
  };

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorDescription = responseText;
    let errorCode = '';
    try {
      const parsedErr = JSON.parse(responseText);
      errorDescription = parsedErr?.error?.description || parsedErr?.error?.reason || errorDescription;
      errorCode = parsedErr?.error?.code || '';
    } catch {}
    // Safe error logging without exposing secrets or customer data
    console.error('[Razorpay Gateway Error]:', response.status, errorCode, errorDescription);
    throw new Error(`Razorpay gateway error (${response.status}): ${errorDescription}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error('Razorpay returned non-JSON response on order creation.');
  }
}
