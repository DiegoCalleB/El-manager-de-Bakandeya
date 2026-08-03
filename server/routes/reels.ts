import express from "express";
import fs from "fs";
import path from "path";
import os from "os";
import ytdl from "@distube/ytdl-core";
import { YoutubeTranscript } from "youtube-transcript";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { requireAuth } from "../state.js";
import { getAiClient, GEMINI_MODEL, generateContentWithFallback } from "../ai.js";

const router = express.Router();

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

function getYouTubeId(urlStr?: string): string | null {
  if (!urlStr) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlStr.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function formatVttTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(3);
  const hStr = hrs.toString().padStart(2, "0");
  const mStr = mins.toString().padStart(2, "0");
  const [sInt, sDec] = secs.split(".");
  const sStr = sInt.padStart(2, "0") + "." + (sDec || "000").padEnd(3, "0").substring(0, 3);
  return `${hStr}:${mStr}:${sStr}`;
}

router.post("/cut-video-clip", requireAuth, async (req, res) => {
  const { youtubeUrl, start = 0, duration = 30, cropVertical = true } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({ success: false, error: "Se requiere 'youtubeUrl'." });
  }

  const videoId = getYouTubeId(youtubeUrl);
  if (!videoId) {
    return res.status(400).json({ success: false, error: "URL de YouTube no válida." });
  }

  const reqId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tempDownloadPath = path.join(os.tmpdir(), `${reqId}_raw.mp4`);
  const tempOutputPath = path.join(os.tmpdir(), `${reqId}_cut.mp4`);

  try {
    console.log(`[Video Cut] Descargando vídeo de YouTube (${videoId}) en ${tempDownloadPath}...`);
    
    await new Promise<void>((resolve, reject) => {
      const stream = ytdl(youtubeUrl, {
        quality: "highestvideo",
        filter: (format) => format.container === "mp4" && Boolean(format.hasVideo) && Boolean(format.hasAudio)
      }).on("error", (err) => {
        console.warn("[ytdl warning] Error filtering video+audio format, falling back to highest:", err.message);
      });

      const writeStream = fs.createWriteStream(tempDownloadPath);
      let hasError = false;
      stream.pipe(writeStream);

      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err) => {
        hasError = true;
        reject(err);
      });
      stream.on("error", (err) => {
        if (!hasError) reject(err);
      });
    }).catch(async () => {
      await new Promise<void>((resolve, reject) => {
        const fallbackStream = ytdl(youtubeUrl, { quality: "highest" });
        const writeStream = fs.createWriteStream(tempDownloadPath);
        fallbackStream.pipe(writeStream);
        writeStream.on("finish", () => resolve());
        writeStream.on("error", (err) => reject(err));
        fallbackStream.on("error", (err) => reject(err));
      });
    });

    if (!fs.existsSync(tempDownloadPath) || fs.statSync(tempDownloadPath).size === 0) {
      throw new Error("No se pudo descargar el vídeo de YouTube.");
    }

    console.log(`[Video Cut] Recortando vídeo con ffmpeg (start: ${start}s, duration: ${duration}s)...`);
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(tempDownloadPath)
        .setStartTime(start)
        .setDuration(duration);

      if (cropVertical) {
        command = command.videoFilters("crop=ih*(9/16):ih");
      }

      command
        .outputOptions([
          "-c:v libx264",
          "-preset ultrafast",
          "-crf 26",
          "-c:a aac",
          "-b:a 128k",
          "-movflags +faststart"
        ])
        .output(tempOutputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    if (!fs.existsSync(tempOutputPath) || fs.statSync(tempOutputPath).size === 0) {
      throw new Error("Fallo al recortar el clip de vídeo con ffmpeg.");
    }

    let subtitles: Array<{ text: string; start: number; end: number }> = [];
    let words: Array<{ word: string; start: number; end: number }> = [];
    let vttContent = "";
    let sinTranscripcionReal = false;

    try {
      console.log(`[Video Cut] Consultando subtítulos reales de YouTube para ${videoId}...`);
      let rawTranscript: any[] = [];
      try {
        rawTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "es" });
      } catch (eEs) {
        rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
      }

      if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
        const clipStartMs = start * 1000;
        const clipEndMs = (start + duration) * 1000;

        const filtered = rawTranscript.filter((item: any) => {
          const itemStart = item.offset;
          const itemEnd = item.offset + item.duration;
          return itemEnd >= clipStartMs && itemStart <= clipEndMs;
        });

        if (filtered.length > 0) {
          subtitles = filtered.map((item: any) => {
            const relStartSec = Math.max(0, (item.offset - clipStartMs) / 1000);
            const relEndSec = Math.min(duration, (item.offset + item.duration - clipStartMs) / 1000);
            return {
              text: item.text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(),
              start: Number(relStartSec.toFixed(2)),
              end: Number(relEndSec.toFixed(2))
            };
          });

          let vtt = "WEBVTT\n\n";
          subtitles.forEach((sub, idx) => {
            vtt += `${idx + 1}\n`;
            vtt += `${formatVttTime(sub.start)} --> ${formatVttTime(sub.end)}\n`;
            vtt += `${sub.text}\n\n`;
          });
          vttContent = vtt;
        } else {
          sinTranscripcionReal = true;
        }
      } else {
        sinTranscripcionReal = true;
      }
    } catch (subErr: any) {
      console.log(`[Video Cut] No hay transcripción real disponible en YouTube para ${videoId}:`, subErr.message || subErr);
      sinTranscripcionReal = true;
      subtitles = [];
      words = [];
      vttContent = "";
    }

    const fileBuffer = await fs.promises.readFile(tempOutputPath);
    const videoBase64 = `data:video/mp4;base64,${fileBuffer.toString("base64")}`;

    return res.json({
      success: true,
      videoBase64,
      subtitles,
      words,
      vttContent,
      sinTranscripcionReal
    });

  } catch (err: any) {
    console.error("[Video Cut Error]:", err);
    return res.status(500).json({
      success: false,
      error: `Error procesando el recorte del vídeo: ${err.message || err}`
    });
  } finally {
    try {
      if (fs.existsSync(tempDownloadPath)) await fs.promises.unlink(tempDownloadPath);
    } catch (e) { console.error("Error removing temp download file:", e); }
    try {
      if (fs.existsSync(tempOutputPath)) await fs.promises.unlink(tempOutputPath);
    } catch (e) { console.error("Error removing temp output file:", e); }
  }
});

// POST /api/analyze-video-highlights - Analyze video using Gemini AI to identify viral Reels/Shorts clips
router.post("/analyze-video-highlights", requireAuth, async (req, res) => {
  try {
    const { fileName, youtubeUrl, videoDuration = 180, videoTopic } = req.body || {};

    let transcriptSummary = "";
    let youtubeMeta = { title: "", description: "", duration: 0, author: "" };

    if (youtubeUrl) {
      const videoId = getYouTubeId(youtubeUrl);
      if (videoId) {
        // Fetch YouTube metadata: try oEmbed first (fast, public API without bot restrictions)
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            youtubeMeta.title = oembed.title || "";
            youtubeMeta.author = oembed.author_name || "";
          }
        } catch (e2) {}

        // Try ytdl for extra description/duration if available
        try {
          const info = await ytdl.getBasicInfo(youtubeUrl);
          if (info && info.videoDetails) {
            if (!youtubeMeta.title) youtubeMeta.title = info.videoDetails.title || "";
            youtubeMeta.description = info.videoDetails.description || "";
            if (!youtubeMeta.author) youtubeMeta.author = info.videoDetails.author?.name || "";
            if (info.videoDetails.lengthSeconds) {
              youtubeMeta.duration = parseInt(info.videoDetails.lengthSeconds, 10);
            }
          }
        } catch (infoErr: any) {
          // Silently handle bot restriction on ytdl getBasicInfo
        }

        // Fetch transcript if available
        try {
          let rawTranscript: any[] = [];
          try {
            rawTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "es" });
          } catch (eEs) {
            rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
          }
          if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
            transcriptSummary = rawTranscript
              .slice(0, 100)
              .map((t: any) => `[${Math.floor(t.offset / 1000)}s - ${Math.floor((t.offset + t.duration) / 1000)}s] ${t.text}`)
              .join("\n");
          }
        } catch (err: any) {
          console.log(`[Highlights AI] No se pudo obtener transcripción de YouTube para ${videoId}:`, err.message || err);
        }
      }
    }

    const ai = getAiClient();
    const totalDur = youtubeMeta.duration || Number(videoDuration) || 180;
    const realVideoTitle = youtubeMeta.title || fileName || videoTopic || "Vídeo de Bakandeya";
    const topicStr = videoTopic || (youtubeMeta.title ? `Vídeo de YouTube: "${youtubeMeta.title}"` : "Ensayo o directo de la banda");

    if (ai) {
      try {
        const prompt = `Actúa como un experto en estrategia de contenido viral para bandas de música en TikTok e Instagram Reels.
Estamos analizando un vídeo real para la banda "Bakandeya" (banda de balkan-ska-reggae-rock con violín virtuoso, percusión reciclada, sintetizadores analógicos, guitarra, bajo y batería).

REGLA OBLIGATORIA SOBRE LA INSTRUMENTACIÓN REAL DE BAKANDEYA:
- La banda Bakandeya NO TIENE sección de vientos ni instrumentos de viento (NO hay trompetas, NO hay saxofones, NO hay trombones).
- JAMÁS e NUNCA inventes o menciones "vientos", "sección de vientos", "trompetas", "saxos" ni nada similar.
- La identidad sonora de Bakandeya se basa en: Violín solista virtuoso, sintetizadores analógicos, percusión reciclada, ritmo ska/reggae de guitarra, bajo potente y batería.

REGLA DE PRECISIÓN EN LOS TÍTULOS Y DESCRIPCIONES DE CADA FRAGMENTO:
- NO asumas qué instrumento específico lidera en un tramo exacto (ej: no digas "Solo de Violín" o "Clímax de Percusión") a menos que la transcripción u observaciones de ese minuto lo dejen 100% claro.
- Si es un fragmento de audio/vídeo general sin certeza de qué instrumento destaca en esos segundos, utiliza títulos estructurales pero atractivos, como:
  * "Arranque y Hook Inicial (${realVideoTitle.substring(0, 25)})"
  * "Sección Rítmica y Groovy en Directo"
  * "Pasaje Central con Energía de Banda"
  * "Cierre y Clímax del Tema"

DETALLES REALES EXTRAÍDOS DEL VÍDEO:
- Título del vídeo/archivo: "${realVideoTitle}"
${youtubeMeta.description ? `- Descripción original del vídeo: "${youtubeMeta.description.substring(0, 800)}"` : ""}
${youtubeMeta.author ? `- Canal/Autor: "${youtubeMeta.author}"` : ""}
- Tema/Instrucciones del usuario: "${topicStr}"
- Duración total real: ${totalDur} segundos
${fileName ? `- Nombre del archivo local: ${fileName}` : ""}
${youtubeUrl ? `- URL de YouTube: ${youtubeUrl}` : ""}
${transcriptSummary ? `- Transcripción con timestamps del vídeo:\n${transcriptSummary.substring(0, 2000)}` : ""}

Tu tarea es analizar ESPECÍFICAMENTE este vídeo ("${realVideoTitle}") e identificar entre 3 y 4 fragmentos (highlights) de entre 15 y 45 segundos con el mayor potencial de enganche viral para Reels y Shorts.
Para cada fragmento, genera un título representativo y realista del contenido de ESTE vídeo específico, el rango de tiempo exacto (formato MM:SS - MM:SS, dentro de los 0 a ${totalDur}s del vídeo), la duración en segundos, el nivel de energía, un copy/caption listo para publicar con hashtags en español y la razón estratégica.
Determina también la mejor fecha y hora de publicación en redes sociales.

Responde ÚNICAMENTE con un JSON válido con la siguiente estructura (sin bloques markdown ni explicaciones adicionales):
{
  "highlights": [
    {
      "id": "hl-1",
      "title": "Nombre del momento basado en el vídeo real",
      "range": "0:15 - 0:45",
      "duration": 30,
      "confidence": 95,
      "energyLevel": "Muy Alta",
      "recommendedCopy": "Texto de publicación sugerido para Instagram/TikTok sobre este vídeo...",
      "hashtags": ["#Bakandeya", "#BalkanSka", "#ViolinEnDirecto"],
      "reason": "Explicación de por qué este fragmento engancha en los primeros 3 segundos..."
    }
  ],
  "optimalTime": {
    "date": "2026-07-30",
    "time": "20:30",
    "reason": "Explicación del horario óptimo para el público objetivo..."
  }
}`;

        const aiResponse = await generateContentWithFallback(ai, {
          contents: prompt,
          preferredModel: GEMINI_MODEL
        });

        if (aiResponse && aiResponse.text) {
          let cleanText = aiResponse.text.trim();
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
          }

          const parsed = JSON.parse(cleanText);
          if (parsed && Array.isArray(parsed.highlights) && parsed.highlights.length > 0) {
            return res.json({
              success: true,
              highlights: parsed.highlights,
              optimalTime: parsed.optimalTime || { date: "2026-07-30", time: "20:30", reason: "Horario pico de consumo de vídeos musicales." }
            });
          }
        }
      } catch (err: any) {
        console.warn("[Highlights AI] Error llamando a Gemini, usando fallback dinámico estructurado:", err.message || err);
      }
    }

    // Dynamic generator based on the actual video info when AI call fails or is unavailable
    const formatSecToMin = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const clip1End = Math.min(30, Math.floor(totalDur * 0.25));
    const clip2Start = Math.floor(totalDur * 0.35);
    const clip2End = Math.min(clip2Start + 35, Math.floor(totalDur * 0.65));
    const clip3Start = Math.floor(totalDur * 0.70);
    const clip3End = Math.min(clip3Start + 30, totalDur);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const displayTitle = youtubeMeta.title || fileName || videoTopic || "Vídeo de Bakandeya";

    const fallbackHighlights = [
      {
        id: "hl-1",
        title: `Inicio Potente: ${displayTitle.length > 35 ? displayTitle.substring(0, 35) + "..." : displayTitle}`,
        range: `${formatSecToMin(0)} - ${formatSecToMin(clip1End)}`,
        duration: clip1End,
        confidence: 96,
        energyLevel: "Muy Alta",
        recommendedCopy: `🎻🔥 ¡Enganche inicial de "${displayTitle}"! El violín de Bakandeya y la base de sintetizadores marcando el ritmo. ¿Qué os parece este arranque? 🎸💥 #Bakandeya #BalkanSka #ViolinEnDirecto #EnDirecto`,
        hashtags: ["#Bakandeya", "#BalkanSka", "#ViolinEnDirecto", "#MusicaEnVivo"],
        reason: "Pico de energía inicial ideal para captar la atención en los primeros 3 segundos en Instagram Reels y TikTok."
      },
      {
        id: "hl-2",
        title: `Clímax de Violín & Percusión Reciclada`,
        range: `${formatSecToMin(clip2Start)} - ${formatSecToMin(clip2End)}`,
        duration: clip2End - clip2Start,
        confidence: 91,
        energyLevel: "Alta",
        recommendedCopy: `🎻⚡ Momento cumbre en "${displayTitle}". Siente la fuerza del violín solista y la percusión reciclada en pleno directo. 🚀 #BalkanReggae #BakandeyaEnConcierto #Gira2026`,
        hashtags: ["#Bakandeya", "#BalkanReggae", "#SkaSpain", "#ConciertoDirecto"],
        reason: "Contraste de secciones con ritmo bailable, alto potencial para guardados y compartidos en redes."
      },
      {
        id: "hl-3",
        title: `Cierre Explosivo & Respuesta del Público`,
        range: `${formatSecToMin(clip3Start)} - ${formatSecToMin(clip3End)}`,
        duration: clip3End - clip3Start,
        confidence: 88,
        energyLevel: "Muy Alta",
        recommendedCopy: `🙌 ¡Cierre en plena euforia de "${displayTitle}"! Así suena la recta final de nuestros bolos con violín, percusión y sintetizadores. 🎶🔥 #Bakandeya #BolosEnDirecto #GiraDeOtoño`,
        hashtags: ["#Bakandeya", "#DirectoSevilla", "#MusicaIndie", "#SalasDeConciertos"],
        reason: "Muestra la interacción y euforia final, perfecto como llamado a la acción para la compra de entradas."
      }
    ];

    return res.json({
      success: true,
      highlights: fallbackHighlights,
      optimalTime: {
        date: dateStr,
        time: "20:30",
        reason: "Pico de interacción en Instagram y TikTok para público de música en directo (20:00 - 21:30)."
      }
    });
  } catch (err: any) {
    console.error("[Highlights AI Route Error]:", err);
    return res.status(500).json({
      success: false,
      error: `Error al procesar el vídeo: ${err.message || err}`
    });
  }
});

// POST /api/reanalyze-clip - Re-analyze a specific cut/segment with optional user notes
router.post("/reanalyze-clip", requireAuth, async (req, res) => {
  try {
    const {
      youtubeUrl,
      fileName,
      videoTitle,
      start = 0,
      duration = 30,
      userNotes = "",
      currentTitle = ""
    } = req.body || {};

    const end = Number(start) + Number(duration);

    const formatSecToMin = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const rangeStr = `${formatSecToMin(Number(start))} - ${formatSecToMin(end)}`;
    let exactTranscript = "";

    if (youtubeUrl) {
      const videoId = getYouTubeId(youtubeUrl);
      if (videoId) {
        try {
          let rawTranscript: any[] = [];
          try {
            rawTranscript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "es" });
          } catch (eEs) {
            rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
          }
          if (Array.isArray(rawTranscript) && rawTranscript.length > 0) {
            const clipStartMs = Number(start) * 1000;
            const clipEndMs = end * 1000;
            const matched = rawTranscript.filter((t: any) => {
              const itemStart = t.offset;
              const itemEnd = t.offset + t.duration;
              return itemEnd >= clipStartMs && itemStart <= clipEndMs;
            });
            if (matched.length > 0) {
              exactTranscript = matched.map((t: any) => t.text).join(" ").trim();
            }
          }
        } catch (subErr) {
          console.log("[Reanalyze Clip] No transcript segment available:", subErr);
        }
      }
    }

    const ai = getAiClient();
    const displayTitle = videoTitle || fileName || "Corte de Bakandeya";

    if (ai) {
      try {
        const prompt = `Actúa como productor musical y gestor de contenidos para la banda Bakandeya (balkan-ska-reggae-rock con violín virtuoso, percusión reciclada, sintetizadores analógicos, bajo, guitarra y batería).

Estamos REANALIZANDO UN CORTE DE VÍDEO ESPECÍFICO de ${duration} segundos (${rangeStr}):
- Vídeo general: "${displayTitle}"
- Rango de tiempo exacto del corte: de ${formatSecToMin(Number(start))} a ${formatSecToMin(end)} (${rangeStr})
${exactTranscript ? `- Transcripción exacta de las palabras/letras en este tramo de ${rangeStr}:\n"${exactTranscript}"` : "- En este tramo exacto no se detectaron letras/palabras habladas (es un pasaje instrumental o musical sin voz)."}
${userNotes ? `- OBSERVACIONES EXPLÍCITAS DEL USUARIO SOBRE LO QUE OCURRE EN ESTE TRANO: "${userNotes}"` : ""}
${currentTitle ? `- Título previo asignado al corte: "${currentTitle}"` : ""}

REGLAS DE MÁXIMA PRECISIÓN PARA ESTE CORTE:
1. Re-evalúa el contenido de estos ${duration} segundos específicos (${rangeStr}).
2. Si el usuario ha proporcionado notas u observaciones (ej. "En este tramo solo toca el bajo Filgue y la batería Jon, no hay violín"), AJUSTA TOTALMENTE el título, la descripción y el copy para reflejar fielmente eso.
3. Si NO hay notas del usuario ni letras habladas, NO inventes solos de instrumentos específicos (como 'Solo de Violín') a menos que estés 100% seguro. Asigna un título representativo como "Momento Rítmico de Banda (${rangeStr})" o "Potencia en Directo (${rangeStr})".
4. Bakandeya NO TIENE sección de vientos (NO trompetas, NO saxos).

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "title": "Título preciso y atractivo para este corte exacto",
  "reason": "Explicación realista y estratégica de lo que se ve/escucha en estos ${duration} segundos y por qué funciona en redes",
  "recommendedCopy": "Pie de foto (copy) listo para publicar en Instagram Reels/TikTok adaptado a lo que ocurre en este fragmento",
  "hashtags": ["#Bakandeya", "#BalkanSka", "#MusicaEnVivo"],
  "energyLevel": "Muy Alta",
  "confidence": 98
}`;

        const aiResponse = await generateContentWithFallback(ai, {
          contents: prompt,
          preferredModel: GEMINI_MODEL
        });

        if (aiResponse && aiResponse.text) {
          let cleanText = aiResponse.text.trim();
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
          }

          const parsed = JSON.parse(cleanText);
          if (parsed && parsed.title) {
            return res.json({
              success: true,
              analysis: {
                title: parsed.title,
                reason: parsed.reason || "Fragmento re-analizado para máxima fidelidad con el audio/vídeo.",
                recommendedCopy: parsed.recommendedCopy || "",
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ["#Bakandeya"],
                energyLevel: parsed.energyLevel || "Alta",
                confidence: parsed.confidence || 95
              }
            });
          }
        }
      } catch (err: any) {
        console.warn("[Reanalyze Clip AI Error]:", err.message || err);
      }
    }

    // Fallback if AI call fails
    return res.json({
      success: true,
      analysis: {
        title: userNotes ? `Corte (${rangeStr}): ${userNotes.substring(0, 30)}` : `Corte de Banda (${rangeStr})`,
        reason: userNotes ? `Análisis ajustado a las notas del usuario: "${userNotes}"` : `Pasaje extraído de ${displayTitle} (${rangeStr}).`,
        recommendedCopy: `🔥 Pasaje de Bakandeya de ${rangeStr}. ${userNotes ? userNotes + '.' : ''} ¡Disfruta del directo! 🚀 #Bakandeya #BalkanSka #EnDirecto`,
        hashtags: ["#Bakandeya", "#Directo", "#Música"],
        energyLevel: "Alta",
        confidence: 90
      }
    });
  } catch (err: any) {
    console.error("[Reanalyze Clip Route Error]:", err);
    return res.status(500).json({
      success: false,
      error: `Error al reanalizar el fragmento: ${err.message || err}`
    });
  }
});

export default router;
