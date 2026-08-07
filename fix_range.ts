import fs from 'fs';
let content = fs.readFileSync('server/sheets.ts', 'utf8');
content = content.replace(
  'range: "registro_bandas!A2:O"',
  'range: "registro_bandas!A2:P"'
);
fs.writeFileSync('server/sheets.ts', content);
