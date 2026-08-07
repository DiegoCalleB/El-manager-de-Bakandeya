import { syncAllTabsWithBakandeya } from './server/sheets.js';
import { loadState } from './server/state.js';

async function run() {
  const state = loadState();
  console.log("Starting sync...");
  await syncAllTabsWithBakandeya(state);
  console.log("Done");
}
run();
