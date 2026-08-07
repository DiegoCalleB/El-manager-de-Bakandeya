import { ensureUsuariosBandasSheet } from './server/sheets.js';

ensureUsuariosBandasSheet().then(res => {
  console.log('Result:', res);
}).catch(err => {
  console.error('Error:', err);
});
