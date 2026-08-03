const fs = require('fs');

const NEW_CODE = `
export function bandToRow(b: any): any[] {
  return [
    b.id || "",
    b.nombre_banda || "",
    b.estilo_musical || "",
    b.localizacion || "",
    b.estado_relacion || "",
    b.ultimo_contacto || "",
    b.contacto_nombre || "",
    b.email || "",
    b.telefono || "",
    b.instagram || "",
    b.spotify_youtube || "",
    b.aforo_promedio || 0,
    b.notas_colaboracion || "",
    b.ciudad_origen_swap || ""
  ];
}

export function rowToBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    nombre_banda: String(r[1] || ""),
    estilo_musical: String(r[2] || ""),
    localizacion: String(r[3] || ""),
    estado_relacion: String(r[4] || "sin_contactar"),
    ultimo_contacto: String(r[5] || ""),
    contacto_nombre: String(r[6] || ""),
    email: String(r[7] || ""),
    telefono: String(r[8] || ""),
    instagram: String(r[9] || ""),
    spotify_youtube: String(r[10] || ""),
    aforo_promedio: Number(r[11]) || 0,
    notas_colaboracion: String(r[12] || ""),
    ciudad_origen_swap: String(r[13] || "")
  };
}

export async function ensureBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "bandas");
    
    const headers = [
      "id", "nombre_banda", "estilo_musical", "localizacion", "estado_relacion", "ultimo_contacto", 
      "contacto_nombre", "email", "telefono", "instagram", "spotify_youtube", "aforo_promedio", 
      "notas_colaboracion", "ciudad_origen_swap"
    ];
    
    const res = await s.spreadsheets.values.get({ spreadsheetId: id, range: "bandas!A1:N1" });
    if (!res.data.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "bandas!A1:N1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      });
    }
    return true;
  } catch (err: any) {
    console.error("Error ensuring bandas sheet:", err.message);
    return false;
  }
}

export async function fetchBandsFromSheet(fallback: any[]): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:N",
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      for (const b of fallback) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "bandas!A:N",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [bandToRow(b)] },
        }));
      }
      invalidateValuesCache("bandas");
      return fallback;
    }
    return rows.map(rowToBand).filter((b: any) => b.id);
  } catch (err: any) {
    console.error("Error fetching bands from sheet:", err.message);
    return fallback;
  }
}

export async function updateBandInSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:N",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === band.id);

    if (rowIndex !== -1) {
      const range = \`bandas!A\${rowIndex + 2}:N\${rowIndex + 2}\`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [bandToRow(band)] },
      });
      invalidateValuesCache("bandas");
    } else {
      await appendBandToSheet(band);
    }
  } catch (error) {
    console.error("Error updating band in sheet:", error);
  }
}

export async function appendBandToSheet(band: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "bandas!A:N",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [bandToRow(band)] },
    });
    invalidateValuesCache("bandas");
  } catch (error) {
    console.error("Error appending band to sheet:", error);
  }
}
`;

fs.appendFileSync('server/sheets.ts', NEW_CODE);
