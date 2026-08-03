const fs = require('fs');
let code = fs.readFileSync('server/state.ts', 'utf-8');

code = code.replace(
  '        state.setlists = INITIAL_SETLISTS;\n        changed = true;\n      }',
  '        state.setlists = INITIAL_SETLISTS;\n        changed = true;\n      }\n      if (!state.bands || !Array.isArray(state.bands)) {\n        state.bands = INITIAL_BANDS;\n        changed = true;\n      }'
);

code = code.replace(
  '    setlists: INITIAL_SETLISTS,',
  '    setlists: INITIAL_SETLISTS,\n    bands: INITIAL_BANDS,'
);

fs.writeFileSync('server/state.ts', code);
