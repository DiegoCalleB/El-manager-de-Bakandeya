import fs from 'fs';
let content = fs.readFileSync('src/components/FansPanel.tsx', 'utf8');
content = content.replace(
  /!qrConcertUrl\.includes\(window\.location\.host\)/g,
  "!qrConcertUrl.includes('bandmanagement-ai.vercel.app')"
);
fs.writeFileSync('src/components/FansPanel.tsx', content);
