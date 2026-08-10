import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../state.js";

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://brynltixytuyjdfdupjx.supabase.co";
  // Favor JWT formatted keys (starts with eyJ) if available
  const keys = [
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY
  ].filter(Boolean) as string[];

  const jwtKey = keys.find(k => k.startsWith("eyJ")) || keys[0];

  if (url && jwtKey) {
    try {
      return createClient(url, jwtKey);
    } catch (e) {
      console.error("Error initializing Supabase client:", e);
    }
  }
  return null;
}

function getBucketName() {
  const envBucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!envBucket || envBucket.length > 25) {
    return "band-media";
  }
  return envBucket;
}

router.get("/test-supabase", async (req, res) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ success: false, message: "No se pudo inicializar el cliente de Supabase (faltan claves)." });
  }

  const bucketName = getBucketName();
  const testBuffer = Buffer.from("test connection " + Date.now());
  const testPath = `diagnostics/test-${Date.now()}.txt`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testBuffer, { contentType: "text/plain", upsert: true });

    if (uploadError) {
      return res.json({
        success: false,
        bucket: bucketName,
        error: uploadError.message,
        details: uploadError.message.includes("row-level security")
          ? "Es necesario añadir la política RLS en Supabase Storage (INSERT / SELECT para la tabla/bucket 'band-media')."
          : uploadError.message
      });
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(testPath);
    await supabase.storage.from(bucketName).remove([testPath]);

    return res.json({
      success: true,
      bucket: bucketName,
      message: "¡Conexión y subida a Supabase exitosas!",
      publicUrl: publicUrlData?.publicUrl
    });
  } catch (err: any) {
    return res.json({ success: false, error: err.message || String(err) });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { filename, base64, bandId, category, folder } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: "Missing filename or base64" });
    }

    const ext = path.extname(filename) || '';
    const baseNameSanitized = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const uniqueName = `${crypto.randomUUID()}${baseNameSanitized ? '-' + baseNameSanitized : ''}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Remove the data URI scheme if present (e.g. data:image/jpeg;base64,)
    const match = base64.match(/^data:([A-Za-z-+\/]+);base64,/);
    const mimeType = match ? match[1] : 'application/octet-stream';
    const base64Data = base64.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Always save locally first as safe fallback
    fs.writeFileSync(filePath, buffer);
    let finalUrl = `/uploads/${uniqueName}`;
    let storageEngine = "local";

    // Attempt Supabase Storage upload if credentials are environment-configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const bucketName = getBucketName();
        // Determine organized storage path by band and category or folder
        let subPath = "bandas/bakandeya/general";
        if (folder) {
          subPath = folder.replace(/^\/+|\/+$/g, '');
        } else {
          const targetBand = bandId || 'bakandeya';
          const cleanBandId = String(targetBand).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          const cleanCategory = category ? String(category).toLowerCase().replace(/[^a-z0-9_-]/g, '-') : 'general';
          subPath = `bandas/${cleanBandId}/${cleanCategory}`;
        }
        
        const storagePath = `${subPath}/${uniqueName}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            finalUrl = publicUrlData.publicUrl;
            storageEngine = "supabase";
          }
        } else {
          console.warn("Supabase upload notice (using local storage fallback):", uploadError.message);
        }
      } catch (sbErr) {
        console.warn("Supabase Storage error (fallback to local):", sbErr);
      }
    }

    res.json({ url: finalUrl, storage: storageEngine });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
