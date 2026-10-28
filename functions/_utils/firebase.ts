/**
 * Firebase Firestore REST API utility for Cloudflare Pages Functions.
 * Allows serverless functions to securely read and update documents without Firebase Admin SDK
 * or Node.js runtime dependencies.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id?: string;
}

/**
 * Converts a PEM encoded PKCS#8 private key to ArrayBuffer for Web Crypto
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

/**
 * Base64url encoding
 */
function base64url(str: string): string {
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function bufferToBase64url(buf: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(buf));
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Obtains a Google OAuth2 access token for Firestore REST using Service Account credentials
 */
export async function getGoogleAccessToken(serviceAccountJson: string): Promise<string | null> {
  try {
    const sa: ServiceAccount = JSON.parse(serviceAccountJson);
    if (!sa.client_email || !sa.private_key) {
      console.warn('[Firebase REST] Missing client_email or private_key in service account');
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedClaim = base64url(JSON.stringify(claim));
    const signingInput = `${encodedHeader}.${encodedClaim}`;

    const keyBuffer = pemToArrayBuffer(sa.private_key);
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    const jwt = `${signingInput}.${bufferToBase64url(signatureBuffer)}`;

    // Exchange JWT for OAuth2 Access Token
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Firebase REST] OAuth2 token exchange failed:', res.status, err);
      return null;
    }

    const data = (await res.json()) as { access_token: string };
    return data.access_token || null;
  } catch (err) {
    console.error('[Firebase REST] Failed to generate access token:', err);
    return null;
  }
}

/**
 * Patch a Firestore document via REST API
 */
export async function updateFirestoreDocument(params: {
  projectId: string;
  collection: string;
  docId: string;
  fields: Record<string, any>;
  accessToken: string;
}): Promise<boolean> {
  const { projectId, collection, docId, fields, accessToken } = params;

  // Convert JS values to Firestore REST Document Value format
  const firestoreFields: Record<string, any> = {};
  const updateMaskPaths: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    updateMaskPaths.push(key);
    if (typeof value === 'string') {
      firestoreFields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        firestoreFields[key] = { integerValue: String(value) };
      } else {
        firestoreFields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      firestoreFields[key] = { booleanValue: value };
    } else if (value === null) {
      firestoreFields[key] = { nullValue: null };
    } else {
      firestoreFields[key] = { stringValue: JSON.stringify(value) };
    }
  }

  const queryParams = new URLSearchParams();
  for (const p of updateMaskPaths) {
    queryParams.append('updateMask.fieldPaths', p);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: firestoreFields })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Firebase REST] Document patch failed:', res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Firebase REST] Error updating document:', err);
    return false;
  }
}
