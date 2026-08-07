import fs from 'fs';

let content = fs.readFileSync('src/components/FansPanel.tsx', 'utf8');

// Replace domain fallback
content = content.replace(
  /: window\.location\.origin;/g,
  ": 'https://bandmanagement-ai.vercel.app';"
);

// Replace copy link
content = content.replace(
  /navigator\.clipboard\.writeText\(\`\$\{window\.location\.origin\}\/unete\`\);/g,
  "navigator.clipboard.writeText(qrConcertUrl);"
);

// Replace href fallback in link
content = content.replace(
  /\`\$\{window\.location\.origin\}\$\{pathFormatted\}\`/g,
  "\`https://bandmanagement-ai.vercel.app\${pathFormatted}\`"
);

fs.writeFileSync('src/components/FansPanel.tsx', content);
