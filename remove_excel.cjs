const fs = require('fs');
let code = fs.readFileSync('src/components/BandCRM.tsx', 'utf-8');

// Find start and end indices of the handlers
const startStr = "// File upload ref for Excel Import";
const endStr = "// Helper for status badge colors";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + code.substring(endIndex);
}

fs.writeFileSync('src/components/BandCRM.tsx', code);
