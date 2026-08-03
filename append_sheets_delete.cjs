const fs = require('fs');

const NEW_CODE = `
export async function deleteBandInSheet(bandId: string) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    const response = await getValuesCached(sheets, {
      spreadsheetId,
      range: "bandas!A2:N",
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row: any) => row[0] === bandId);

    if (rowIndex !== -1) {
      const range = \`bandas!A\${rowIndex + 2}:N\${rowIndex + 2}\`;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      invalidateValuesCache("bandas");
    }
  } catch (error) {
    console.error("Error deleting band in sheet:", error);
  }
}
`;

fs.appendFileSync('server/sheets.ts', NEW_CODE);
