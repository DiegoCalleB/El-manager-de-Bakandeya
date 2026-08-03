const fs = require('fs');
let code = fs.readFileSync('src/components/BandCRM.tsx', 'utf-8');

const startStr = "// File upload ref for Excel Import";
const endStr = "// Handle open modal for creation";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
}

fs.writeFileSync('src/components/BandCRM.tsx', code);
