import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { EmailMessage } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Gmail scopes (readonly, compose, send)
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
// Force prompt select account to let user choose diegolimado@gmail.com easily
provider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

const STORAGE_TOKEN_KEY = 'bakandeya_gmail_token';
const STORAGE_TOKEN_EXP_KEY = 'bakandeya_gmail_token_exp';

// Save token to localStorage for persistence across reloads/sessions
const saveTokenToStorage = (token: string) => {
  cachedAccessToken = token;
  try {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    // Google tokens usually expire in 3600 seconds (1 hr). We set 50 mins threshold.
    localStorage.setItem(STORAGE_TOKEN_EXP_KEY, String(Date.now() + 50 * 60 * 1000));
  } catch (e) {
    console.warn('Could not save Gmail token to localStorage', e);
  }
};

const getStoredToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    const exp = localStorage.getItem(STORAGE_TOKEN_EXP_KEY);
    if (token && exp && Date.now() < Number(exp)) {
      cachedAccessToken = token;
      return token;
    }
  } catch (e) {
    // ignore storage errors
  }
  return null;
};

// Check redirect result on load
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        saveTokenToStorage(credential.accessToken);
        console.log('[Google Auth] Redirect login successful for:', result.user.email);
      }
    }
  })
  .catch((err) => {
    console.warn('[Google Auth] Redirect result error:', err);
  });

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    const validToken = getStoredToken();
    if (user && validToken) {
      if (onAuthSuccess) onAuthSuccess(user, validToken);
    } else if (user) {
      if (validToken && onAuthSuccess) {
        onAuthSuccess(user, validToken);
      } else if (!isSigningIn && onAuthFailure) {
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_TOKEN_EXP_KEY);
      } catch (e) {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with popup and redirect fallback for iframe environments
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Auth');
    }

    saveTokenToStorage(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    const errCode = error?.code || '';
    const errMsg = String(error?.message || '').toLowerCase();

    if (
      errCode === 'auth/popup-closed-by-user' ||
      errCode === 'auth/cancelled-popup-request' ||
      errCode === 'auth/user-cancelled' ||
      errMsg.includes('popup-closed-by-user') ||
      errMsg.includes('cancelled-popup-request') ||
      errMsg.includes('closed-by-user')
    ) {
      console.log('[Google Auth] El usuario cerró la ventana de autenticación con Google.');
      return null;
    }

    // If popup is blocked or running in restrictive iframe, try redirect method automatically
    if (errCode === 'auth/popup-blocked' || errMsg.includes('popup-blocked') || window.self !== window.top) {
      console.log('[Google Auth] Popup blocked or in iframe, initiating redirect sign-in...');
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr) {
        console.error('Redirect sign-in error:', redirectErr);
        throw redirectErr;
      }
    }

    if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
      throw new Error('El dominio actual de la app no está en la lista de "Dominios autorizados" en la consola de Firebase Authentication.');
    }

    if (errCode === 'auth/operation-not-allowed' || errMsg.includes('operation-not-allowed')) {
      throw new Error('El proveedor de inicio de sesión con Google no está habilitado en Firebase Authentication.');
    }

    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getStoredToken();
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_TOKEN_EXP_KEY);
  } catch (e) {}
};

// Base64URL decoder
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    try {
      return atob(base64);
    } catch (err) {
      return '';
    }
  }
}

// Extract headers from message
function getHeader(headers: any[], name: string): string {
  if (!headers) return '';
  const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

// Extract message body
function getMessageBody(payload: any): string {
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        // Strip basic HTML tags to keep text clean, or return parsed
        const html = decodeBase64Url(part.body.data);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || doc.body.innerText || html;
      }
      if (part.parts) {
        const subBody = getMessageBody(part);
        if (subBody) return subBody;
      }
    }
  }
  return '';
}

// Fetch messages from Gmail for a specific contact email
export const fetchGmailThreadsForEmail = async (
  email: string,
  token: string
): Promise<EmailMessage[]> => {
  if (!email || !token) return [];

  try {
    // Search messages matching the lead email
    const query = encodeURIComponent(email);
    const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=15`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchRes.ok) {
      throw new Error(`Gmail API search error: ${searchRes.statusText}`);
    }

    const searchData = await searchRes.json();
    if (!searchData.messages || searchData.messages.length === 0) {
      return [];
    }

    // Fetch individual messages details
    const messagePromises = searchData.messages.map(async (msg: { id: string }) => {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
      const detailRes = await fetch(detailUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (detailRes.ok) {
        return detailRes.json();
      }
      return null;
    });

    const messagesRaw = await Promise.all(messagePromises);
    const validMessages = messagesRaw.filter((m) => m !== null);

    // Map to EmailMessage format
    const emailMessages: EmailMessage[] = validMessages.map((m) => {
      const headers = m.payload?.headers || [];
      const fromHeader = getHeader(headers, 'from');
      const subject = getHeader(headers, 'subject') || '(Sin Asunto)';
      
      // Determine if sender is the lead (sala) or the band (banda)
      const isFromLead = fromHeader.toLowerCase().includes(email.toLowerCase());
      const remitente = isFromLead ? ('sala' as const) : ('banda' as const);
      
      // Clean up sender name
      const cleanSender = fromHeader.replace(/<.*?>/, '').trim();
      
      // Parse Date
      const dateHeader = getHeader(headers, 'date');
      let fechaFormatted = '';
      if (dateHeader) {
        try {
          const parsedDate = new Date(dateHeader);
          fechaFormatted = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')} ${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
        } catch (e) {
          fechaFormatted = dateHeader;
        }
      } else {
        const internalDate = Number(m.internalDate);
        if (internalDate) {
          const parsedDate = new Date(internalDate);
          fechaFormatted = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')} ${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
        }
      }

      // Get body text
      let bodyText = getMessageBody(m.payload);
      if (!bodyText) {
        bodyText = m.snippet || '';
      }

      return {
        id: m.id,
        fecha: fechaFormatted,
        remitente,
        remitente_nombre: cleanSender || fromHeader,
        asunto: subject,
        mensaje: bodyText,
      };
    });

    // Sort by date ascending (oldest first for thread representation) or descending depending on CRM
    return emailMessages.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  } catch (err) {
    console.error('Error fetching Gmail messages:', err);
    throw err;
  }
};

// Helper to safely encode UTF-8 strings to Base64URL
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  dataBase64: string;
}

// Helper to construct base64url encoded MIME message (supports HTML, UTF-8, and Attachments)
export function buildRawMimeMessage(
  to: string,
  subject: string,
  bodyContent: string,
  from?: string,
  isHtml: boolean = true,
  attachments: EmailAttachment[] = []
): string {
  const bytes = new TextEncoder().encode(subject);
  let binarySubject = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binarySubject += String.fromCharCode(bytes[i]);
  }
  const subjectB64 = btoa(binarySubject);

  const boundary = `====_Bakandeya_Boundary_${Date.now()}_====`;

  let rawMime = '';

  if (attachments && attachments.length > 0) {
    // Multipart MIME Message with Attachments
    const headers = [
      `To: ${to}`,
      from ? `From: ${from}` : '',
      `Subject: =?UTF-8?B?${subjectB64}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ].filter(Boolean);

    let mimeParts = headers.join('\r\n') + '\r\n\r\n';

    // Body Part
    mimeParts += `--${boundary}\r\n`;
    mimeParts += isHtml
      ? 'Content-Type: text/html; charset=UTF-8\r\n'
      : 'Content-Type: text/plain; charset=UTF-8\r\n';
    mimeParts += 'Content-Transfer-Encoding: 8bit\r\n\r\n';
    mimeParts += bodyContent + '\r\n\r\n';

    // Attachment Parts
    for (const att of attachments) {
      mimeParts += `--${boundary}\r\n`;
      mimeParts += `Content-Type: ${att.contentType}; name="${att.filename}"\r\n`;
      mimeParts += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
      mimeParts += 'Content-Transfer-Encoding: base64\r\n\r\n';
      mimeParts += att.dataBase64 + '\r\n\r\n';
    }

    mimeParts += `--${boundary}--\r\n`;
    rawMime = mimeParts;
  } else {
    // Single part Message
    const headers: string[] = [`To: ${to}`];
    if (from) {
      headers.push(`From: ${from}`);
    }
    headers.push(`Subject: =?UTF-8?B?${subjectB64}?=`);
    headers.push('MIME-Version: 1.0');
    headers.push(
      isHtml
        ? 'Content-Type: text/html; charset=UTF-8'
        : 'Content-Type: text/plain; charset=UTF-8'
    );

    rawMime = headers.join('\r\n') + '\r\n\r\n' + bodyContent;
  }

  return base64UrlEncode(rawMime);
}

// Create Draft in Gmail
export const createGmailDraft = async (
  to: string,
  subject: string,
  bodyContent: string,
  token?: string | null,
  isHtml: boolean = true,
  attachments: EmailAttachment[] = []
): Promise<{ id: string; message: any }> => {
  let activeToken = token || (await getAccessToken());
  if (!activeToken) {
    const authRes = await googleSignIn();
    activeToken = authRes?.accessToken || null;
  }
  if (!activeToken) throw new Error('No hay sesión de Google activa para crear borrador en Gmail.');

  const raw = buildRawMimeMessage(to, subject, bodyContent, undefined, isHtml, attachments);
  let response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: { raw }
    })
  });

  if (response.status === 401) {
    console.warn("Gmail token expirado (401), reintentando actualización automática...");
    const authRes = await googleSignIn();
    if (authRes?.accessToken) {
      activeToken = authRes.accessToken;
      response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: { raw }
        })
      });
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error ${response.status} al crear borrador en Gmail`);
  }

  return response.json();
};

// Send Message in Gmail
export const sendGmailMessage = async (
  to: string,
  subject: string,
  bodyContent: string,
  token?: string | null,
  isHtml: boolean = true,
  attachments: EmailAttachment[] = []
): Promise<{ id: string; threadId: string }> => {
  let activeToken = token || (await getAccessToken());
  if (!activeToken) {
    const authRes = await googleSignIn();
    activeToken = authRes?.accessToken || null;
  }
  if (!activeToken) throw new Error('No hay sesión de Google activa para enviar correo vía Gmail.');

  const raw = buildRawMimeMessage(to, subject, bodyContent, undefined, isHtml, attachments);
  let response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (response.status === 401) {
    console.warn("Gmail token expirado (401), reintentando actualización automática...");
    const authRes = await googleSignIn();
    if (authRes?.accessToken) {
      activeToken = authRes.accessToken;
      response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Error ${response.status} al enviar correo vía Gmail`);
  }

  return response.json();
};
