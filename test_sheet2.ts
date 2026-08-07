import { fetchUserBandsFromSheet } from './server/sheets.js';

fetchUserBandsFromSheet().then(res => {
  console.log('Result length:', res.length);
}).catch(err => {
  console.error('Error:', err);
});
