import express from "express";
import path from "path";
import fs from "fs";
import { exec, spawn } from "child_process";
import promisify from "util";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { getAiClient, generateContentWithFallback } from "../ai.js";
import { loadState, saveState, requireAuth } from "../state.js";
import { getSupabaseClient, getBucketName } from "./upload.js";

async function uploadToSupabaseIfAvailable(
  localFilePath: string,
  storageSubPath: string,
  contentType: string = "audio/mpeg"
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !fs.existsSync(localFilePath)) return null;

  try {
    const bucketName = getBucketName();
    const fileBuffer = fs.readFileSync(localFilePath);
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storageSubPath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`[Supabase Upload Notice] Failed for ${storageSubPath}:`, uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storageSubPath);

    if (publicUrlData?.publicUrl) {
      console.log(`[Supabase Storage] Successfully uploaded: ${storageSubPath} -> ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage Error] ${storageSubPath}:`, err.message || err);
  }
  return null;
}

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const router = express.Router();
const execAsync = (cmd: string, opts: any = {}) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(cmd, opts, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });

interface TrackItem {
  index: number;
  title: string;
  start: number; // in seconds
  end: number;   // in seconds
  duration: number; // in seconds
  type: "musica" | "dialogo";
  speechTranscription?: string;
  lyricsWithChords?: string;
  tonalidad?: string;
  bpm?: number;
  audioUrl?: string;
  videoUrl?: string;
}

// Helper: Direct HTML scraper fallback for YouTube metadata when yt-dlp is blocked by bot checks
async function scrapeYoutubeMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    const html = await res.text();
    let title = "Concierto en Directo";
    let description = "";

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].replace(/ - YouTube$/, "").trim();

    const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i) || html.match(/"shortDescription":"([^"]+)"/i);
    if (descMatch) {
      description = descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }

    return { title, duration: 3600, description, chapters: [] };
  } catch (e: any) {
    console.warn("[Scrape YouTube Fallback Error]:", e.message);
    return { title: "Concierto en Directo", duration: 3600, description: "", chapters: [] };
  }
}

// Helper: Parse description or text for multiline timestamps
function parseTimestampsFromText(text: string, videoDuration: number): TrackItem[] {
  if (!text) return [];

  const lines = text.split("\n");
  const parsedEntries: { start: number; title: string }[] = [];

  // Match: HH:MM:SS Title OR MM:SS Title OR [HH:MM:SS] Title
  const timestampRegex = /^(?:\[)?(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:\])?[\s\-–—:]+(.+)$/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(timestampRegex);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      const title = match[4].trim();
      const startInSeconds = hours * 3600 + mins * 60 + secs;

      if (!isNaN(startInSeconds) && title) {
        parsedEntries.push({ start: startInSeconds, title });
      }
    }
  }

  // Sort by start time
  parsedEntries.sort((a, b) => a.start - b.start);

  const tracks: TrackItem[] = [];
  for (let i = 0; i < parsedEntries.length; i++) {
    const current = parsedEntries[i];
    const nextStart = i < parsedEntries.length - 1 ? parsedEntries[i + 1].start : videoDuration;
    const duration = Math.max(0, nextStart - current.start);

    tracks.push({
      index: i + 1,
      title: current.title,
      start: current.start,
      end: nextStart,
      duration,
      type: duration < 150 ? "dialogo" : "musica",
    });
  }

  return tracks;
}

// Helper: Run FFmpeg silence detection on audio file
async function detectSilencesWithFFmpeg(filePath: string, videoDuration: number): Promise<TrackItem[]> {
  return new Promise((resolve) => {
    console.log(`[FFmpeg Silence] Executing silencedetect on ${filePath}...`);
    const silences: { start: number; end: number }[] = [];

    // Run ffmpeg with silencedetect filter
    const command = ffmpeg(filePath)
      .audioFilters("silencedetect=noise=-25dB:d=1.0")
      .format("null")
      .output("-");

    command.on("stderr", (stderrLine: string) => {
      const startMatch = stderrLine.match(/silence_start:\s*([\d\.]+)/);
      const endMatch = stderrLine.match(/silence_end:\s*([\d\.]+)/);

      if (startMatch) {
        const start = parseFloat(startMatch[1]);
        silences.push({ start, end: start });
      }
      if (endMatch && silences.length > 0) {
        const end = parseFloat(endMatch[1]);
        silences[silences.length - 1].end = end;
      }
    });

    command.on("end", () => {
      console.log(`[FFmpeg Silence] Detected ${silences.length} silence markers.`);
      const cutPoints: number[] = [0];

      for (const silence of silences) {
        const midpoint = (silence.start + silence.end) / 2;
        // Avoid tiny cuts under 15 seconds
        if (midpoint - cutPoints[cutPoints.length - 1] >= 15) {
          cutPoints.push(midpoint);
        }
      }

      if (videoDuration - cutPoints[cutPoints.length - 1] >= 15) {
        cutPoints.push(videoDuration);
      } else {
        cutPoints[cutPoints.length - 1] = videoDuration;
      }

      const tracks: TrackItem[] = [];
      for (let i = 0; i < cutPoints.length - 1; i++) {
        const start = cutPoints[i];
        const end = cutPoints[i + 1];
        const duration = end - start;
        const type = duration < 150 ? "dialogo" : "musica";

        tracks.push({
          index: i + 1,
          title: type === "dialogo" ? `Presentación / Hablado ${i + 1}` : `Tema ${i + 1}`,
          start: Math.round(start * 10) / 10,
          end: Math.round(end * 10) / 10,
          duration: Math.round(duration * 10) / 10,
          type,
        });
      }

      resolve(tracks);
    });

    command.on("error", (err) => {
      console.warn("[FFmpeg Silence] Error detecting silence:", err.message);
      // Fallback: divide into 4-minute equal tracks
      const tracks: TrackItem[] = [];
      const interval = 240;
      let cur = 0;
      let idx = 1;
      while (cur < videoDuration) {
        const end = Math.min(cur + interval, videoDuration);
        const duration = end - cur;
        tracks.push({
          index: idx,
          title: `Tema ${idx}`,
          start: cur,
          end,
          duration,
          type: "musica",
        });
        cur = end;
        idx++;
      }
      resolve(tracks);
    });

    command.run();
  });
}

// 1. ANALYZE CONCERT ROUTE
router.post("/analyze", async (req, res) => {
  try {
    const { url, sourceFilePath, useAi, transcribeFirst, bandName } = req.body;
    let videoTitle = "Concierto en Directo";
    let videoDuration = 3600; // default 1 hour if unknown
    let rawDescription = "";
    let chapters: any[] = [];
    let detectedTracks: TrackItem[] = [];
    let ytDlpBinaryPath = path.join(process.cwd(), "bin", "yt-dlp");

    if (!fs.existsSync(ytDlpBinaryPath)) {
      ytDlpBinaryPath = "yt-dlp";
    }

    let sourceMediaToAnalyze = sourceFilePath || "";
    let youtubeBlocked = false;

    if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
      console.log(`[Concert Analyzer] Investigating YouTube metadata with yt-dlp for: ${url}`);
      const antiBotFlags = `--extractor-args "youtube:player_client=android,web,mweb,ios" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" --no-check-certificates`;
      try {
        const { stdout } = await execAsync(`"${ytDlpBinaryPath}" ${antiBotFlags} --dump-json --skip-download "${url}"`);
        const metadata = JSON.parse(stdout);
        videoTitle = metadata.title || videoTitle;
        videoDuration = metadata.duration || videoDuration;
        rawDescription = metadata.description || "";
        chapters = metadata.chapters || [];
      } catch (err: any) {
        console.warn(`[Concert Analyzer] yt-dlp metadata dump notice: YouTube bot check active. Using web scraper fallback...`);
        youtubeBlocked = true;
        try {
          const scraped = await scrapeYoutubeMetadata(url);
          videoTitle = scraped.title || videoTitle;
          rawDescription = scraped.description || rawDescription;
        } catch (scrapeErr: any) {
          console.warn(`[Concert Analyzer] HTML scraper warning:`, scrapeErr.message);
        }
      }
    }

    // A. Native Chapters check
    if (chapters && chapters.length > 0) {
      console.log(`[Concert Analyzer] Found ${chapters.length} native chapters in video!`);
      detectedTracks = chapters.map((chap: any, idx: number) => {
        const start = chap.start_time || 0;
        const end = chap.end_time || (idx < chapters.length - 1 ? chapters[idx + 1].start_time : videoDuration);
        const duration = end - start;
        return {
          index: idx + 1,
          title: chap.title || `Pista ${idx + 1}`,
          start: Math.round(start * 10) / 10,
          end: Math.round(end * 10) / 10,
          duration: Math.round(duration * 10) / 10,
          type: duration < 150 ? "dialogo" : "musica",
        };
      });
    }

    // B. Description Regex parsing fallback
    if (detectedTracks.length === 0 && rawDescription) {
      console.log(`[Concert Analyzer] Parsing timestamps from description...`);
      detectedTracks = parseTimestampsFromText(rawDescription, videoDuration);
    }

    // C. FFmpeg Silence Detection fallback
    if (detectedTracks.length === 0) {
      console.log(`[Concert Analyzer] No chapters or description timestamps found. Running FFmpeg silence detection...`);
      let mediaForSilence = sourceMediaToAnalyze;

      // If YouTube URL and no local file, download audio first for silence detection
      if (!mediaForSilence && url) {
        const tempAudioDir = path.join(process.cwd(), "public", "uploads", "temp");
        if (!fs.existsSync(tempAudioDir)) fs.mkdirSync(tempAudioDir, { recursive: true });
        mediaForSilence = path.join(tempAudioDir, `analysis_${Date.now()}.mp3`);

        console.log(`[Concert Analyzer] Downloading temporary audio for silence detection...`);
        try {
          const antiBotFlags = `--extractor-args "youtube:player_client=android,web,mweb,ios" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" --no-check-certificates`;
          await execAsync(`"${ytDlpBinaryPath}" ${antiBotFlags} -x --audio-format mp3 -o "${mediaForSilence}" "${url}"`);
        } catch (dlErr: any) {
          console.warn(`[Concert Analyzer] yt-dlp quick audio download failed, attempting best audio stream link:`, dlErr.message);
        }
      }

      if (fs.existsSync(mediaForSilence)) {
        detectedTracks = await detectSilencesWithFFmpeg(mediaForSilence, videoDuration);
      } else {
        // Simple equal interval fallback
        const tracks: TrackItem[] = [];
        const interval = 240;
        let cur = 0;
        let idx = 1;
        while (cur < videoDuration) {
          const end = Math.min(cur + interval, videoDuration);
          const duration = end - cur;
          tracks.push({
            index: idx,
            title: `Tema ${idx}`,
            start: cur,
            end,
            duration,
            type: "musica",
          });
          cur = end;
          idx++;
        }
        detectedTracks = tracks;
      }
    }

    // D. Gemini AI Enrichment & Full Audio Pre-Transcription
    if (useAi) {
      const isPreTranscribing = Boolean(transcribeFirst !== false);
      console.log(`[Concert Analyzer] Enriched by Gemini AI requested (transcribeFirst: ${isPreTranscribing})...`);
      const aiClient = getAiClient();
      if (aiClient) {
        try {
          let contents: any;
          let promptText = "";

          if (isPreTranscribing) {
            promptText = `
Eres un Ingeniero de Sonido, Productor Musical y Transcriptor Profesional Senior.
Estamos analizando y segmentando el concierto en directo completo: "${videoTitle}" (Duración total: ${videoDuration}s).
Banda/Artista: "${bandName || 'Grupo Musical'}".

Lista preliminar de pistas/fragmentos detectados por marcas o silencios:
${JSON.stringify(detectedTracks, null, 2)}

Descripción y metadatos del vídeo/concierto:
${rawDescription.slice(0, 3000)}

INSTRUCCIONES OBLIGATORIAS DE SEGMENTACIÓN E IDENTIFICACIÓN:
1. **REGLA DE ORO: PRESENTACIÓN INICIAL E INTRO CON MÚSICA**:
   Cualquier primer trozo (Pista 1) o fragmento de inicio que contenga la bienvenida de la banda, presentación del show o palabras habladas —AUNQUE TENGA MÚSICA DE FONDO, RÁFAGAS DE GUITARRA, BATERÍA O APLAUSOS— DEBE SER CLASIFICADO OBLIGATORIAMENTE COMO type: "dialogo" (Speech / Presentación). NUNCA lo clasifiques como tipo "musica".

2. **REGLA DE MÚSICA CORTA (< 45s) COMO INTRO A SPEECH**:
   Si un fragmento musical dura muy poco tiempo (menos de 45 segundos) antes o durante un speech, es un intro o ambientación para hablar. DEBES INCLUIRLO EN EL SPEECH Y DETECTARLO COMO TIPO "dialogo".

3. **FIDELIDAD DE CORTES Y TRANSCRIPCIÓN**:
   - Ajusta los timestamps (start y end en segundos float) para no cortar a la mitad de una frase cantada ni de un discurso.
   - NO te inventes letras ni acordes de canciones si no se escucha la canción completa.
   - Para pistas de tipo "dialogo", indica las palabras principales en "speechTranscription".
   - Para pistas de tipo "musica", asigna el título real de la canción.

Responde ÚNICAMENTE con un JSON válido con este esquema exacto:
{
  "albumTitle": "Título Limpio del Concierto",
  "artist": "${bandName || 'Grupo Musical'}",
  "tracks": [
    {
      "index": 1,
      "title": "Nombre de la Canción o Presentación",
      "start": 0.0,
      "end": 145.2,
      "duration": 145.2,
      "type": "musica" | "dialogo",
      "speechTranscription": "Transcripción hablada o nota si es tipo dialogo",
      "lyricsWithChords": "",
      "tonalidad": "Mim",
      "bpm": 120
    }
  ]
}
`;
          } else {
            promptText = `
Eres un Ingeniero de Sonido y Archivero Musical Senior.
Estamos procesando el concierto completo: "${videoTitle}" (Duración total: ${videoDuration}s).
La banda o artista es: "${bandName || 'Grupo Musical'}".

A continuación te paso la lista preliminar de pistas/fragmentos detectados:
${JSON.stringify(detectedTracks, null, 2)}

Descripción del concierto/vídeo:
${rawDescription.slice(0, 3000)}

INSTRUCCIONES:
1. Revisa los títulos, timestamps de inicio y fin (en segundos float), e identifica si cada pista es "musica" o "dialogo" (interludio/speech/presentación).
2. Mejora los títulos de las canciones y presentaciones. Si es una presentación, pon un título descriptivo como "Presentación del grupo / Agradecimientos".
3. Devuelve la lista estructurada con un título propuesto para el Disco ("albumTitle") y la lista final de pistas ("tracks").

Responde ÚNICAMENTE con un JSON válido con este esquema exacto:
{
  "albumTitle": "Directo en En Vivo - ...",
  "artist": "${bandName || 'Grupo Musical'}",
  "tracks": [
    {
      "index": 1,
      "title": "Título pulido de la canción o presentación",
      "start": 0.0,
      "end": 120.0,
      "duration": 120.0,
      "type": "musica" | "dialogo",
      "speechTranscription": "Si es tipo dialogo, una sugerencia o transcripción breve estimada"
    }
  ]
}
`;
          }

          // Check if sourceFilePath exists on disk and fits into inlineData (<20MB)
          if (isPreTranscribing && sourceFilePath && fs.existsSync(sourceFilePath)) {
            const stats = fs.statSync(sourceFilePath);
            if (stats.size < 20 * 1024 * 1024) {
              console.log(`[Concert Analyzer] Sending ${stats.size} bytes local audio to Gemini multimodal audio analysis...`);
              const audioBuf = fs.readFileSync(sourceFilePath);
              contents = [
                {
                  inlineData: {
                    mimeType: "audio/mp3",
                    data: audioBuf.toString("base64"),
                  },
                },
                { text: promptText },
              ];
            } else {
              contents = promptText;
            }
          } else {
            contents = promptText;
          }

          const response = await generateContentWithFallback(aiClient, {
            contents,
            preferredModel: "gemini-3.6-flash",
          });

          const jsonText = response.text || "";
          const match = jsonText.match(/\{[\s\S]*\}/);
          if (match) {
            const aiData = JSON.parse(match[0]);
            if (aiData.tracks && Array.isArray(aiData.tracks) && aiData.tracks.length > 0) {
              detectedTracks = aiData.tracks.map((t: any, idx: number) => {
                const duration = Math.max(0.5, (typeof t.duration === "number" ? t.duration : (t.end || 0) - (t.start || 0)));
                let type = t.type === "dialogo" ? "dialogo" : "musica";
                let title = t.title || `Pista ${idx + 1}`;

                const titleLower = title.toLowerCase();
                const isFirstTrackAndOpening = idx === 0 && (duration < 180 || titleLower.includes("intro") || titleLower.includes("presentac") || titleLower.includes("pista 1") || titleLower.includes("tema 1") || titleLower.includes("inicio"));
                const isShortMusicIntro = type === "musica" && duration < 45;
                const isSpeechTitle = titleLower.includes("presentac") || titleLower.includes("speech") || titleLower.includes("hablado") || titleLower.includes("intro") || titleLower.includes("agradec");

                if (isFirstTrackAndOpening || isShortMusicIntro || isSpeechTitle) {
                  type = "dialogo";
                  if (idx === 0 && (title.startsWith("Pista 1") || title.startsWith("Tema 1") || title.toLowerCase().includes("cancion"))) {
                    title = "Presentación e Intro del Concierto";
                  }
                  if (!t.speechTranscription) {
                    t.speechTranscription = `[Presentación hablada e intro del grupo] ${title}`;
                  }
                }

                return {
                  index: idx + 1,
                  title,
                  start: typeof t.start === "number" ? t.start : 0,
                  end: typeof t.end === "number" ? t.end : duration,
                  duration,
                  type,
                  speechTranscription: t.speechTranscription || (type === "dialogo" ? `Presentación o palabras del artista` : ""),
                  lyricsWithChords: t.lyricsWithChords || "",
                  tonalidad: t.tonalidad || "Mim",
                  bpm: typeof t.bpm === "number" ? t.bpm : 120,
                };
              });
            }
            if (aiData.albumTitle) {
              videoTitle = aiData.albumTitle;
            }
          }
        } catch (aiErr: any) {
          console.warn("[Concert Analyzer] AI Enrichment failed, using algorithmic detection:", aiErr.message || aiErr);
        }
      }
    }

    const audioAvailable = Boolean((sourceFilePath && fs.existsSync(sourceFilePath)) || !youtubeBlocked);

    res.json({
      success: true,
      albumTitle: videoTitle,
      artist: bandName || "Nuestra Banda",
      totalDuration: videoDuration,
      tracks: detectedTracks,
      youtubeBlocked,
      audioAvailable,
    });
  } catch (err: any) {
    console.error("[Concert Analyzer] Error:", err);
    res.status(500).json({ error: err.message || "Error al analizar el concierto." });
  }
});

// 2. SLICE & GENERATE ALBUM ROUTE
router.post("/process", async (req, res) => {
  try {
    const { url, sourceFilePath, tracks, albumTitle, artist } = req.body;

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: "Debe proporcionar una lista de pistas válida para trocear." });
    }

    const albumId = `live_album_${Date.now()}`;
    const outputDir = path.join(process.cwd(), "public", "uploads", "live_albums", albumId);
    const temasDir = path.join(outputDir, "temas");
    const dialogosDir = path.join(outputDir, "dialogos");

    fs.mkdirSync(temasDir, { recursive: true });
    fs.mkdirSync(dialogosDir, { recursive: true });

    let ytDlpBinaryPath = path.join(process.cwd(), "bin", "yt-dlp");
    if (!fs.existsSync(ytDlpBinaryPath)) ytDlpBinaryPath = "yt-dlp";

    let localMasterMedia = sourceFilePath || "";

    // If source is YouTube, download high quality master audio/video first
    if (!localMasterMedia && url) {
      const tempMaster = path.join(outputDir, "master_concert.mp4");
      console.log(`[Concert Slicer] Downloading full master concert from YouTube to ${tempMaster}...`);
      try {
        await execAsync(`"${ytDlpBinaryPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${tempMaster}" "${url}"`);
        localMasterMedia = tempMaster;
      } catch (dlErr: any) {
        console.warn(`[Concert Slicer] Video download failed, downloading audio master instead:`, dlErr.message);
        const tempAudioMaster = path.join(outputDir, "master_concert.mp3");
        await execAsync(`"${ytDlpBinaryPath}" -x --audio-format mp3 -o "${tempAudioMaster}" "${url}"`);
        localMasterMedia = tempAudioMaster;
      }
    }

    if (!fs.existsSync(localMasterMedia)) {
      return res.status(404).json({ error: "No se pudo encontrar o descargar el archivo maestro del concierto." });
    }

    console.log(`[Concert Slicer] Slicing ${tracks.length} tracks using FFmpeg High-Performance...`);
    const processedTracks: TrackItem[] = [];

    for (const track of tracks) {
      const idxStr = String(track.index).padStart(2, "0");
      const safeTitle = (track.title || `Pista_${track.index}`).replace(/[/\\?%*:|"<>]/g, "_");
      const isSong = track.type === "musica";
      const targetFolder = isSong ? temasDir : dialogosDir;

      const mp3FileName = `${idxStr} - ${safeTitle}.mp3`;
      const mp3Path = path.join(targetFolder, mp3FileName);
      const mp3RelativeUrl = `/uploads/live_albums/${albumId}/${isSong ? "temas" : "dialogos"}/${encodeURIComponent(mp3FileName)}`;

      const startTime = Math.max(0, track.start);
      const duration = Math.max(0.5, track.end - track.start);

      // FFmpeg slice to MP3
      console.log(`[Concert Slicer] Cutting Track ${track.index}: "${track.title}" (${startTime}s to ${track.end}s)...`);
      try {
        await execAsync(`"${ffmpegStatic}" -y -ss ${startTime} -i "${localMasterMedia}" -t ${duration} -vn -c:a libmp3lame -q:a 2 "${mp3Path}"`);
      } catch (ffErr: any) {
        console.warn(`[Concert Slicer] FFmpeg slice error on track ${track.index}:`, ffErr.message);
      }

      let audioUrl = mp3RelativeUrl;

      // Upload track MP3 to Supabase Storage if available
      const storageSubPath = `live_albums/${albumId}/${isSong ? "temas" : "dialogos"}/${mp3FileName}`;
      const supabaseUrl = await uploadToSupabaseIfAvailable(mp3Path, storageSubPath, "audio/mpeg");
      if (supabaseUrl) {
        audioUrl = supabaseUrl;
      }

      processedTracks.push({
        ...track,
        audioUrl,
      });
    }

    // Write repertoire_data.json deliverable
    const manifest = {
      albumId,
      albumTitle: albumTitle || "Concierto en Directo",
      artist: artist || "Nuestra Banda",
      createdAt: new Date().toISOString(),
      tracks: processedTracks,
    };
    fs.writeFileSync(path.join(outputDir, "repertoire_data.json"), JSON.stringify(manifest, null, 2));

    // Write repertoire.cue sheet deliverable for DAWs and CD mastering
    const cueLines = [
      `TITLE "${manifest.albumTitle}"`,
      `PERFORMER "${manifest.artist}"`,
      `FILE "master_concert.mp3" MP3`
    ];
    processedTracks.forEach((t) => {
      const startMins = Math.floor(t.start / 60);
      const startSecs = Math.floor(t.start % 60);
      const startFrames = Math.floor((t.start % 1) * 75);
      const timestampCue = `${String(startMins).padStart(2, "0")}:${String(startSecs).padStart(2, "0")}:${String(startFrames).padStart(2, "0")}`;

      cueLines.push(`  TRACK ${String(t.index).padStart(2, "0")} AUDIO`);
      cueLines.push(`    TITLE "${t.title.replace(/"/g, "'")}"`);
      cueLines.push(`    PERFORMER "${manifest.artist.replace(/"/g, "'")}"`);
      cueLines.push(`    INDEX 01 ${timestampCue}`);
    });
    fs.writeFileSync(path.join(outputDir, "repertoire.cue"), cueLines.join("\n"));

    // Write interactive index.html deliverable
    const indexHtmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${manifest.albumTitle} - Disco & Repertorio Directo</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="border-b border-slate-800 pb-4">
      <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Álbum en Directo</span>
      <h1 class="text-3xl font-extrabold text-white mt-1">${manifest.albumTitle}</h1>
      <p class="text-slate-400 font-medium">${manifest.artist} • ${processedTracks.length} Pistas</p>
    </header>

    <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-xl">
      <h2 class="text-lg font-bold mb-3 text-amber-300">🎵 Tracklist Interactivo</h2>
      <div class="space-y-2">
        ${processedTracks
          .map(
            (t) => `
          <div class="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 gap-3">
            <div class="flex items-center gap-3">
              <span class="w-8 text-center font-mono text-sm font-bold text-slate-400">${String(t.index).padStart(2, "0")}</span>
              <div>
                <p class="font-semibold text-white text-sm">${t.title}</p>
                <span class="text-[11px] px-2 py-0.5 rounded font-mono ${t.type === "musica" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-purple-500/20 text-purple-300 border border-purple-500/30"}">
                  ${t.type === "musica" ? "🎵 Canción" : "🗣️ Diálogo / Speech"}
                </span>
              </div>
            </div>
            ${t.audioUrl ? `<audio controls src="${t.audioUrl}" class="h-8 max-w-full md:w-64"></audio>` : ""}
          </div>
          ${t.speechTranscription ? `<div class="ml-11 p-2 bg-purple-950/30 border-l-2 border-purple-500 text-xs text-purple-200 italic">"${t.speechTranscription}"</div>` : ""}
        `
          )
          .join("")}
      </div>
    </div>
  </div>
</body>
</html>`;

    const indexHtmlPath = path.join(outputDir, "index.html");
    const manifestPath = path.join(outputDir, "repertoire_data.json");
    fs.writeFileSync(indexHtmlPath, indexHtmlContent);

    const supabaseHtmlUrl = await uploadToSupabaseIfAvailable(indexHtmlPath, `live_albums/${albumId}/index.html`, "text/html");
    const supabaseManifestUrl = await uploadToSupabaseIfAvailable(manifestPath, `live_albums/${albumId}/repertoire_data.json`, "application/json");

    res.json({
      success: true,
      albumId,
      albumTitle: manifest.albumTitle,
      artist: manifest.artist,
      deliverablePath: supabaseHtmlUrl || `/uploads/live_albums/${albumId}/index.html`,
      manifestUrl: supabaseManifestUrl || `/uploads/live_albums/${albumId}/repertoire_data.json`,
      tracks: processedTracks,
    });
  } catch (err: any) {
    console.error("[Concert Slicer Error]:", err);
    res.status(500).json({ error: err.message || "Error al trocear y generar el disco en el servidor." });
  }
});

// Helper to extract audio snippet buffer or file path for direct preview and Gemini multimodal listening
async function getAudioSnippetPath(params: {
  url?: string;
  sourceFilePath?: string;
  audioUrl?: string;
  start?: number;
  end?: number;
  trackIndex?: number;
}): Promise<string | null> {
  const { url, sourceFilePath, audioUrl, start = 0, end = 30, trackIndex = 1 } = params;
  const tempDir = path.join(process.cwd(), "public", "uploads", "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // 1. If audioUrl is already a local file or remote URL
  if (audioUrl && typeof audioUrl === "string") {
    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
      const tempHash = Buffer.from(audioUrl).toString("base64").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 16);
      const remoteTemp = path.join(tempDir, `remote_${tempHash}.mp3`);
      if (fs.existsSync(remoteTemp) && fs.statSync(remoteTemp).size > 0) {
        return remoteTemp;
      }
      try {
        const resp = await fetch(audioUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          fs.writeFileSync(remoteTemp, Buffer.from(arrayBuffer));
          return remoteTemp;
        }
      } catch (err: any) {
        console.warn("[Snippet Helper] Failed to fetch remote audioUrl:", err.message);
      }
    } else {
      const relativeClean = audioUrl.startsWith("/") ? audioUrl.slice(1) : audioUrl;
      const localPath = path.join(process.cwd(), "public", relativeClean);
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
        return localPath;
      }
    }
  }

  // 2. If sourceFilePath exists on disk
  if (sourceFilePath && fs.existsSync(sourceFilePath)) {
    const startTime = Math.max(0, parseFloat(String(start)) || 0);
    const duration = Math.max(1, (parseFloat(String(end)) - startTime) || 30);
    const snippetFilename = `snippet_${trackIndex}_${Math.round(startTime)}_${Math.round(duration)}_${Date.now()}.mp3`;
    const snippetPath = path.join(tempDir, snippetFilename);

    try {
      await execAsync(`"${ffmpegStatic}" -y -ss ${startTime} -i "${sourceFilePath}" -t ${duration} -vn -c:a libmp3lame -q:a 4 "${snippetPath}"`);
      if (fs.existsSync(snippetPath) && fs.statSync(snippetPath).size > 0) {
        return snippetPath;
      }
    } catch (err: any) {
      console.warn("[Snippet Helper] Local source slice warning:", err.message);
    }
  }

  // 3. If YouTube / Web URL is provided
  if (url) {
    let ytDlpBinaryPath = path.join(process.cwd(), "bin", "yt-dlp");
    if (!fs.existsSync(ytDlpBinaryPath)) ytDlpBinaryPath = "yt-dlp";

    const antiBotFlags = `--extractor-args "youtube:player_client=android,web,mweb,ios" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" --no-check-certificates`;

    const startTime = Math.max(0, parseFloat(String(start)) || 0);
    const duration = Math.max(1, (parseFloat(String(end)) - startTime) || 30);
    const snippetFilename = `snippet_yt_${trackIndex}_${Math.round(startTime)}_${Math.round(duration)}_${Date.now()}.mp3`;
    const snippetPath = path.join(tempDir, snippetFilename);

    // Try A: Direct Stream URL via yt-dlp -g
    try {
      console.log(`[Snippet Helper] Fetching direct stream URL with yt-dlp for: ${url}`);
      const { stdout } = await execAsync(`"${ytDlpBinaryPath}" ${antiBotFlags} -g -f "ba/b/bestaudio/best" "${url}"`);
      const streamUrls = stdout.trim().split("\n");
      const directStreamUrl = streamUrls[0];

      if (directStreamUrl && directStreamUrl.startsWith("http")) {
        console.log(`[Snippet Helper] Slicing stream directly with FFmpeg...`);
        await execAsync(`"${ffmpegStatic}" -y -ss ${startTime} -i "${directStreamUrl}" -t ${duration} -vn -c:a libmp3lame -q:a 4 "${snippetPath}"`);
        if (fs.existsSync(snippetPath) && fs.statSync(snippetPath).size > 0) {
          return snippetPath;
        }
      }
    } catch (err: any) {
      console.warn("[Snippet Helper] Direct stream extract warning:", err.message);
    }

    // Try B: Cached master or yt-dlp audio download with --ffmpeg-location
    const urlHash = Buffer.from(url).toString("base64").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 16);
    const cachedMaster = path.join(tempDir, `master_${urlHash}.mp3`);

    if (!fs.existsSync(cachedMaster)) {
      console.log(`[Snippet Helper] Downloading master audio for fallback...`);
      try {
        await execAsync(`"${ytDlpBinaryPath}" ${antiBotFlags} --ffmpeg-location "${ffmpegStatic}" -x --audio-format mp3 -o "${cachedMaster}" "${url}"`);
      } catch (dlErr: any) {
        console.warn("[Snippet Helper] Master download warning:", dlErr.message);
      }
    }

    if (fs.existsSync(cachedMaster)) {
      try {
        await execAsync(`"${ffmpegStatic}" -y -ss ${startTime} -i "${cachedMaster}" -t ${duration} -vn -c:a libmp3lame -q:a 4 "${snippetPath}"`);
        if (fs.existsSync(snippetPath) && fs.statSync(snippetPath).size > 0) {
          return snippetPath;
        }
      } catch (err: any) {
        console.warn("[Snippet Helper] Cached master slice error:", err.message);
      }
    }
  }

  return null;
}

// 3. TRANSCRIBE SPEECH ROUTE USING GEMINI MULTIMODAL AUDIO
router.post("/transcribe-speech", async (req, res) => {
  try {
    const { trackTitle, audioUrl, url, sourceFilePath, start, end, trackIndex, promptContext } = req.body;
    const aiClient = getAiClient();

    if (!aiClient) {
      return res.status(400).json({ error: "Gemini API no disponible para transcripción." });
    }

    // Get real audio snippet file for Gemini multimodal input
    const snippetPath = await getAudioSnippetPath({ url, sourceFilePath, audioUrl, start, end, trackIndex });

    const promptText = `
Eres un amanuense y transcriptor profesional de audio en directo.
Escucha con máxima atención el fragmento de audio adjunto correspondiente al interludio / speech de la banda ("${trackTitle || "Presentación"}").
Contexto: ${promptContext || "Habla el cantante dirigiéndose al público entre canciones."}

REQUISITOS OBLIGATORIOS:
1. Transcribe LITERALMENTE las palabras exactas expresadas en el audio.
2. NO te inventes ni supongas nada. Transcribe únicamente lo que oyes cantar o hablar.
3. Si hay vítores o aplausos, márcalo brevemente como [Aplausos].
4. Responde únicamente con el texto limpio de la transcripción en español.
`;

    let contents: any;
    if (snippetPath && fs.existsSync(snippetPath)) {
      const audioBuffer = fs.readFileSync(snippetPath);
      contents = [
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: audioBuffer.toString("base64"),
          },
        },
        { text: promptText },
      ];
    } else {
      contents = promptText;
    }

    const response = await generateContentWithFallback(aiClient, {
      contents,
      preferredModel: "gemini-3.6-flash",
    });

    res.json({
      success: true,
      transcription: response.text ? response.text.trim() : "Transcripción no disponible.",
    });
  } catch (err: any) {
    console.error("[Transcribe Speech Error]:", err);
    res.status(500).json({ error: err.message || "Error al transcribir discurso." });
  }
});

// 4. PREVIEW SNIPPET ROUTE (Quick slice of any track item for instant listening in editor table)
router.post("/preview-snippet", async (req, res) => {
  try {
    const { url, sourceFilePath, audioUrl, start, end, trackIndex } = req.body;
    const snippetPath = await getAudioSnippetPath({ url, sourceFilePath, audioUrl, start, end, trackIndex });

    if (!snippetPath || !fs.existsSync(snippetPath)) {
      return res.status(400).json({ error: "No se pudo obtener o extraer el archivo fuente para previsualizar el trozo." });
    }

    const filename = path.basename(snippetPath);
    let publicAudioUrl = `/uploads/temp/${filename}`;

    const supabaseUrl = await uploadToSupabaseIfAvailable(snippetPath, `live_albums/snippets/${filename}`, "audio/mpeg");
    if (supabaseUrl) {
      publicAudioUrl = supabaseUrl;
    }

    res.json({
      success: true,
      audioUrl: publicAudioUrl,
    });
  } catch (err: any) {
    console.error("[Snippet Preview Error]:", err);
    res.status(500).json({ error: err.message || "Error al generar la previsualización del trozo." });
  }
});

// 5. AUTO-CLASSIFY TRACKS ROUTE (Identify Song vs Dialogue automatically)
router.post("/classify-tracks", async (req, res) => {
  try {
    const { tracks, bandName, albumTitle, useAi } = req.body;

    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: "Lista de pistas no válida." });
    }

    let classifiedTracks = [...tracks];

    // If Gemini AI is requested and available, use AI classification
    const aiClient = getAiClient();
    if (useAi && aiClient) {
      try {
        const prompt = `
Eres un productor e ingeniero musical profesional. Clasifica automáticamente cada pista de este concierto en vivo entre "musica" (canción interpretada) o "dialogo" (hablado, speech, agradecimientos, presentación de la banda, interludio).

Banda: ${bandName || "Nuestra Banda"}
Título Álbum: ${albumTitle || "Concierto en Directo"}

Pistas a clasificar:
${JSON.stringify(tracks.map(t => ({ index: t.index, title: t.title, duration: t.duration, start: t.start, end: t.end })), null, 2)}

Criterios:
- Si la duración es menor a 140 segundos o el título sugiere habla/presentación/agradecimientos/saludo, es "dialogo".
- Si el título indica una canción o la duración es de estructura canción (>140s), es "musica".
- Si es "dialogo", puedes proponer un título sugerido más descriptivo.

Responde ÚNICAMENTE con un JSON con este formato exacto:
{
  "classified": [
    {
      "index": 1,
      "type": "musica" | "dialogo",
      "suggestedTitle": "Título propuesto de la pista"
    }
  ]
}
`;
        const response = await generateContentWithFallback(aiClient, {
          contents: prompt,
          preferredModel: "gemini-3.6-flash",
        });

        const jsonText = response.text || "";
        const match = jsonText.match(/\{[\s\S]*\}/);
        if (match) {
          const aiData = JSON.parse(match[0]);
          if (aiData.classified && Array.isArray(aiData.classified)) {
            classifiedTracks = classifiedTracks.map((t) => {
              const item = aiData.classified.find((c: any) => c.index === t.index);
              if (item) {
                return {
                  ...t,
                  type: item.type === "dialogo" ? "dialogo" : "musica",
                  title: item.suggestedTitle || t.title,
                };
              }
              return t;
            });
          }
        }
      } catch (aiErr: any) {
        console.warn("[Auto-Classify] AI Classification fallback to algorithmic:", aiErr.message);
      }
    } else {
      // Algorithmic self-classification rules
      classifiedTracks = classifiedTracks.map((t, idx) => {
        const titleLower = (t.title || "").toLowerCase();
        const isSpeechTitle =
          titleLower.includes("presentacion") ||
          titleLower.includes("hablado") ||
          titleLower.includes("speech") ||
          titleLower.includes("gracias") ||
          titleLower.includes("intro") ||
          titleLower.includes("agradecimientos") ||
          titleLower.includes("saludo");

        const isShort = t.duration < 50;
        const isFirstTrackAndOpening = idx === 0 && t.duration < 180;
        const isDialogo = isSpeechTitle || isShort || isFirstTrackAndOpening;

        let title = t.title;
        if (idx === 0 && isDialogo && (title.startsWith("Pista 1") || title.startsWith("Tema 1") || title.toLowerCase().includes("cancion"))) {
          title = "Presentación e Intro del Concierto";
        }

        return {
          ...t,
          type: isDialogo ? "dialogo" : "musica",
          title,
        };
      });
    }

    res.json({
      success: true,
      tracks: classifiedTracks,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al auto-clasificar pistas." });
  }
});

// 6. TRANSCRIBE SONG LYRICS & CHORDS ROUTE USING GEMINI MULTIMODAL AUDIO
router.post("/transcribe-song", async (req, res) => {
  try {
    const { title, artist, duration, speechTranscription, audioUrl, url, sourceFilePath, start, end, trackIndex } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Título de la canción requerido." });
    }

    const aiClient = getAiClient();
    if (!aiClient) {
      return res.status(500).json({ error: "Gemini AI no disponible en el servidor." });
    }

    // Get real audio snippet file for Gemini multimodal listening
    const snippetPath = await getAudioSnippetPath({ url, sourceFilePath, audioUrl, start, end, trackIndex });

    const promptText = `
Eres un productor musical, oído absoluto y transcriptor armónico/lírico profesional.
Escucha con máxima atención el audio adjunto de este fragmento de canción interpretado en el concierto en directo:

Título Propuesto: "${title}"
Banda / Artista: "${artist || 'Nuestra Banda'}"
Duración del tramo: ${duration ? `${duration} segundos` : 'estándar'}
${speechTranscription ? `Anotaciones o contexto previo: "${speechTranscription}"` : ''}

INSTRUCCIONES DE TRANSCRIPCIÓN BASADA EN EL AUDIO REAL:
1. Escucha la interpretación real en el audio y transcribe la LETRA EXACTA cantada por el vocalista. No inventes estrofas que no suenan en la grabación.
2. Escucha la armonía e instrumentos para determinar la TONALIDAD REAL (ej. "Mim / Em", "Sol / G", "Lam / Am") y el TEMPO estimado en BPM (ej. 120).
3. Transcribe el CIFRADO DE ACORDES en formato estándar (LaCuerda / Ultimate Guitar), colocando los acordes en notación [Acorde] antes de la palabra o sílaba correspondiente.
4. Si la interpretación en vivo varía respecto a la versión en estudio (un solo extra, intro extendida, improvisación de voz), refleja la versión exacta del directo.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "tonalidad": "Mim / Em",
  "bpm": 120,
  "lyricsWithChords": "[Intro]\nMim  Do  Sol  Re\n\n[Verso 1]\n[Mim]En la noche que caía [Do]sobre la ciudad..."
}
`;

    let contents: any;
    if (snippetPath && fs.existsSync(snippetPath)) {
      const audioBuffer = fs.readFileSync(snippetPath);
      contents = [
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: audioBuffer.toString("base64"),
          },
        },
        { text: promptText },
      ];
    } else {
      contents = promptText;
    }

    const response = await generateContentWithFallback(aiClient, {
      contents,
      preferredModel: "gemini-3.6-flash",
    });

    const jsonText = response.text || "";
    const match = jsonText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "No se pudo interpretar la respuesta de transcripción de IA." });
    }

    const resultData = JSON.parse(match[0]);

    res.json({
      success: true,
      tonalidad: resultData.tonalidad || "Mim",
      bpm: resultData.bpm || 120,
      lyricsWithChords: resultData.lyricsWithChords || `[Intro]\n[Mim] [Do] [Sol] [Re]\n\n[Verso 1]\nLetra para ${title}...`,
    });
  } catch (err: any) {
    console.error("[Transcribe Song Error]:", err);
    res.status(500).json({ error: err.message || "Error al transcribir letra y acordes." });
  }
});

export default router;
