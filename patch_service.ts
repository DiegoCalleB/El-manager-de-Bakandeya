import fs from 'fs';

let content = fs.readFileSync('server/services/googleSheets.service.ts', 'utf8');

if (!content.includes('fetchUserBandsFromSheet')) {
  content = content.replace(
    '// Users / App Members (usuarios)',
    `// User Bands (many-to-many)
  fetchUserBands: sheetsRaw.fetchUserBandsFromSheet,
  appendUserBand: sheetsRaw.appendUserBandToSheet,
  updateUserBand: sheetsRaw.updateUserBandInSheet,
  deleteUserBand: sheetsRaw.deleteUserBandInSheet,

  // Users / App Members (usuarios)`
  );
  fs.writeFileSync('server/services/googleSheets.service.ts', content);
}
