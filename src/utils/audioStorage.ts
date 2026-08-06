/**
 * Audio Storage & Utility Helpers for BandManager.ai
 * Handles IndexedDB persistence for large audio files (MP3/WAV/M4A),
 * Google Drive URL parsing into playable audio streams,
 * and audio file helpers.
 */

const DB_NAME = 'BakandeyaAudioDB';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save audio blob or base64 string in IndexedDB
 */
export async function saveAudioToStorage(id: string, audioData: string | Blob): Promise<string> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(audioData, id);

      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error saving audio to IndexedDB:', err);
    throw err;
  }
}

/**
 * Retrieve audio from IndexedDB as Data URL or Object URL
 */
export async function getAudioFromStorage(id: string): Promise<string | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const val = req.result;
        if (!val) {
          resolve(null);
          return;
        }
        if (typeof val === 'string') {
          resolve(val);
        } else if (val instanceof Blob) {
          const objectUrl = URL.createObjectURL(val);
          resolve(objectUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error getting audio from IndexedDB:', err);
    return null;
  }
}

/**
 * Convert Google Drive share link to direct stream URL
 */
export function parseGoogleDriveAudioUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  
  // If it's already a direct download link or raw data/blob URL, return as is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.includes('uc?export=download')) {
    return trimmed;
  }

  // Extract ID from /file/d/ID/view or ?id=ID
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
}

/**
 * Check if URL is Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com');
}

/**
 * Helper to convert File to Base64 String
 */

/**
 * Uploads a file to the backend server and returns the static URL.
 * Falls back safely to IndexedDB / DataURL if server upload fails or endpoint is unreachable.
 */
export async function uploadFileToServer(
  file: File, 
  options?: { bandId?: string; category?: string; folder?: string } | string
): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const opts = typeof options === 'string' ? { bandId: options } : (options || {});
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        filename: file.name, 
        base64,
        bandId: opts.bandId,
        category: opts.category,
        folder: opts.folder
      })
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.url) return data.url;
    } else {
      console.warn(`/api/upload returned status ${response.status}, falling back to local storage`);
    }
  } catch (err) {
    console.warn("Server upload failed, falling back to local IndexedDB storage:", err);
  }

  // Fallback to IndexedDB local storage
  try {
    const fileKey = `track_file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await saveAudioToStorage(fileKey, file);
    return `indexeddb:${fileKey}`;
  } catch (idbErr) {
    console.warn("IndexedDB fallback failed, returning base64 DataURL:", idbErr);
    return await fileToBase64(file);
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Resolve an audio URL string, supporting IndexedDB stored audio keys (indexeddb:key)
 * and Google Drive stream URLs.
 */
export async function resolveAudioUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('indexeddb:')) {
    const idbKey = trimmed.replace('indexeddb:', '');
    const idbAudio = await getAudioFromStorage(idbKey);
    return idbAudio || '';
  }

  return parseGoogleDriveAudioUrl(trimmed);
}

/**
 * Safely saves the songs catalog to localStorage by persisting large data URLs
 * to IndexedDB first and keeping lightweight references in localStorage,
 * preventing 'Setting the value exceeded the quota' errors.
 */
export async function saveSongsToLocalStorageSafely(songs: any[]): Promise<void> {
  if (!songs || !Array.isArray(songs)) return;

  try {
    const sanitizedSongs = await Promise.all(
      songs.map(async (song) => {
        let principalUrl = song.audioPrincipalUrl || '';

        // If principal audio is a large base64 data URL, store in IndexedDB
        if (principalUrl.startsWith('data:audio') && principalUrl.length > 10000) {
          const key = `audio_song_${song.id}`;
          try {
            await saveAudioToStorage(key, principalUrl);
            principalUrl = `indexeddb:${key}`;
          } catch (err) {
            console.warn('Failed saving song audio to IndexedDB:', err);
          }
        }

        let coverUrl = song.portadaUrl || '';
        // If cover image is a large base64 data URL, store in IndexedDB
        if (coverUrl.startsWith('data:image') && coverUrl.length > 10000) {
          const key = `image_cover_${song.id}`;
          try {
            await saveAudioToStorage(key, coverUrl);
            coverUrl = `indexeddb:${key}`;
          } catch (err) {
            console.warn('Failed saving cover image to IndexedDB:', err);
          }
        }

        // Process audio ideas and multitrack pistas
        const sanitizedIdeas = await Promise.all(
          (song.audioIdeas || []).map(async (idea: any) => {
            let ideaUrl = idea.audioUrl || '';
            if (ideaUrl.startsWith('data:audio') && ideaUrl.length > 10000) {
              const key = `audio_idea_${idea.id}`;
              try {
                await saveAudioToStorage(key, ideaUrl);
                ideaUrl = `indexeddb:${key}`;
              } catch (err) {
                console.warn('Failed saving idea audio to IndexedDB:', err);
              }
            }

            const sanitizedPistas = await Promise.all(
              (idea.pistas || []).map(async (pista: any) => {
                let trackUrl = pista.audioUrl || '';
                if (trackUrl.startsWith('data:audio') && trackUrl.length > 10000) {
                  const key = `audio_track_${pista.id}`;
                  try {
                    await saveAudioToStorage(key, trackUrl);
                    trackUrl = `indexeddb:${key}`;
                  } catch (err) {
                    console.warn('Failed saving track audio to IndexedDB:', err);
                  }
                }
                return {
                  ...pista,
                  audioUrl: trackUrl
                };
              })
            );

            return {
              ...idea,
              audioUrl: ideaUrl,
              pistas: sanitizedPistas.length > 0 ? sanitizedPistas : idea.pistas
            };
          })
        );

        return {
          ...song,
          audioPrincipalUrl: principalUrl,
          portadaUrl: coverUrl,
          audioIdeas: sanitizedIdeas
        };
      })
    );

    localStorage.setItem('bakandeya_songs_catalog', JSON.stringify(sanitizedSongs));
  } catch (e) {
    console.warn('Could not save songs catalog to localStorage:', e);
  }
}

/**
 * Safely saves the setlists array to localStorage by moving large speech audio data URLs
 * to IndexedDB.
 */
export async function saveSetlistsToLocalStorageSafely(setlists: any[]): Promise<void> {
  if (!setlists || !Array.isArray(setlists)) return;

  try {
    const sanitizedSetlists = await Promise.all(
      setlists.map(async (setlist) => {
        const sanitizedItems = await Promise.all(
          (setlist.items || []).map(async (item: any) => {
            let itemAudioUrl = item.audioUrl || '';
            if (itemAudioUrl.startsWith('data:audio') && itemAudioUrl.length > 10000) {
              const key = `audio_setlist_item_${item.id}`;
              try {
                await saveAudioToStorage(key, itemAudioUrl);
                itemAudioUrl = `indexeddb:${key}`;
              } catch (err) {
                console.warn('Failed saving setlist item audio to IndexedDB:', err);
              }
            }
            return {
              ...item,
              audioUrl: itemAudioUrl
            };
          })
        );

        return {
          ...setlist,
          items: sanitizedItems
        };
      })
    );

    localStorage.setItem('bakandeya_setlists', JSON.stringify(sanitizedSetlists));
  } catch (e) {
    console.warn('Could not save setlists to localStorage:', e);
  }
}

