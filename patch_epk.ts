import fs from 'fs';
let content = fs.readFileSync('src/components/EPKManager.tsx', 'utf8');
content = content.replace(
  /\`\$\{window\.location\.origin\}\/epk\`/g,
  "\`https://bandmanagement-ai.vercel.app/epk\`"
);
fs.writeFileSync('src/components/EPKManager.tsx', content);
