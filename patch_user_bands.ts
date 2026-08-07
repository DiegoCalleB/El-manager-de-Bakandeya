import fs from 'fs';

let content = fs.readFileSync('server/sheets.ts', 'utf8');

const newCode = `
export function userBandToRow(ub: any): any[] {
  return [
    ub.id || "",
    ub.user_id || "",
    ub.band_id || "",
    ub.role || "member",
    ub.createdAt || new Date().toISOString()
  ];
}

export function rowToUserBand(r: any[]): any {
  return {
    id: String(r[0] || ""),
    user_id: String(r[1] || ""),
    band_id: String(r[2] || ""),
    role: String(r[3] || "member"),
    createdAt: String(r[4] || "")
  };
}

export async function ensureUsuariosBandasSheet(sheets?: any, spreadsheetId?: string): Promise<boolean> {
  if (verifiedHeadersSet.has("usuarios_bandas")) return true;
  try {
    const s = sheets || getSheetsClient();
    const id = spreadsheetId || getSpreadsheetId();
    if (!s || !id) return false;
    
    await ensureSheetTabExists(s, id, "usuarios_bandas");
    
    const headers = ["id", "user_id", "band_id", "role", "createdAt"];
    
    const res = await getValuesCached(s, { spreadsheetId: id, range: "usuarios_bandas!A1:E1" });
    if (!res?.data?.values || res.data.values.length === 0 || !res.data.values[0][0]) {
      await retrySheetsWrite(() => s.spreadsheets.values.update({
        spreadsheetId: id,
        range: "usuarios_bandas!A1:E1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers] }
      }));
    }
    verifiedHeadersSet.add("usuarios_bandas");
    return true;
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.code === 429 || String(err?.message || "").toLowerCase().includes("quota");
    if (isQuota) {
      console.warn("[ensureUsuariosBandasSheet] Quota limit hit for Google Sheets. Continuing gracefully.");
      verifiedHeadersSet.add("usuarios_bandas");
      return true;
    } else {
      console.warn("Notice ensuring usuarios_bandas sheet:", err?.message || err);
    }
    return false;
  }
}

export async function fetchUserBandsFromSheet(fallback: any[] = []): Promise<any[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return fallback;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response?.data?.values;
    if (!rows || rows.length === 0) {
      if (fallback && fallback.length > 0) {
        await retrySheetsWrite(() => sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "usuarios_bandas!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: fallback.map(userBandToRow) },
        }));
      }
      return fallback;
    }
    return rows.map(rowToUserBand).filter(ub => ub.id && ub.user_id && ub.band_id);
  } catch (error) {
    console.error("Error fetching user bands from sheet:", error);
    return fallback;
  }
}

export async function appendUserBandToSheet(userBand: any): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "usuarios_bandas!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [userBandToRow(userBand)] },
    });
    invalidateValuesCache("usuarios_bandas");
  } catch (error) {
    console.error("Error appending user band to sheet:", error);
  }
}

export async function updateUserBandInSheet(userBand: any): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userBand.id);
    if (rowIndex !== -1) {
      const range = \`usuarios_bandas!A\${rowIndex + 2}:E\${rowIndex + 2}\`;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [userBandToRow(userBand)] },
      });
      invalidateValuesCache("usuarios_bandas");
    } else {
      await appendUserBandToSheet(userBand);
    }
  } catch (error) {
    console.error("Error updating user band in sheet:", error);
  }
}

export async function deleteUserBandInSheet(userBandId: string): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "usuarios_bandas!A2:E",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === userBandId);
    if (rowIndex !== -1) {
      const range = \`usuarios_bandas!A\${rowIndex + 2}:E\${rowIndex + 2}\`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("usuarios_bandas");
    }
  } catch (error) {
    console.error("Error deleting user band in sheet:", error);
  }
}
`;

// Insert the new code before "export async function ensureUsuariosSheet"
content = content.replace(
  "export async function ensureUsuariosSheet",
  newCode + "\nexport async function ensureUsuariosSheet"
);

// Fix users -> usuarios_app sync logic inside syncAllTabsWithBakandeya
content = content.replace(
  /\/\/ 2\. usuarios\s+await ensureUsuariosSheet\(sheets, spreadsheetId\);\s+if \(state\.users && state\.users\.length > 0\) \{\s+await retrySheetsWrite\(\(\) => sheets\.spreadsheets\.values\.update\(\{\s+spreadsheetId,\s+range: "usuarios!A2:J",\s+valueInputOption: "USER_ENTERED",\s+requestBody: \{ values: state\.users\.map\(\(u: any\) => userToRow\(\{ \.\.\.u, band_id: bandId \}\)\) \}\s+\}\)\);\s+\}/,
  `// 2. usuarios
    await ensureUsuariosSheet(sheets, spreadsheetId);
    if (state.users && state.users.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "usuarios!A2:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.users.map((u: any) => userToRow({ ...u, band_id: bandId })) }
      }));
    }

    // 2b. usuarios_bandas
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    if (state.userBands && state.userBands.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "usuarios_bandas!A2:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.userBands.map((ub: any) => userBandToRow(ub)) }
      }));
    }`
);

fs.writeFileSync('server/sheets.ts', content);
