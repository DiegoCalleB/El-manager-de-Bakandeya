import { loadState } from './server/state.js';
const state = loadState();
console.log('userBands:', state.userBands?.length);
