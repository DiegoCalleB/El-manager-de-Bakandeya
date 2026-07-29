import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { EmailMessage } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Gmail readonly scope
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(provider.setCustomParameters({ prompt: 'select_account' }) ? auth : auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
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
