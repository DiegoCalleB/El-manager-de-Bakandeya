import fs from 'fs';
let content = fs.readFileSync('server/sheets.ts', 'utf8');
content = content.replace(
  'range: "seguidores!A2:E"',
  'range: "seguidores!A2:G"'
);
fs.writeFileSync('server/sheets.ts', content);
