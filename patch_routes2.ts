import fs from 'fs';

let content = fs.readFileSync('server/routes/users.ts', 'utf8');

// Association endpoint
content = content.replace(
  /state\.userBands\.push\(\{([\s\S]*?)createdAt: new Date\(\)\.toISOString\(\)\s*\}\);/,
  `const newUB = {
    $1createdAt: new Date().toISOString()
  };
  state.userBands.push(newUB);
  try {
    await googleSheetsService.appendUserBand(newUB);
  } catch (e) {
    console.warn("Failed to append userBand to sheets", e);
  }`
);

// 2nd occurrence
content = content.replace(
  /state\.userBands\.push\(\{([\s\S]*?)createdAt: new Date\(\)\.toISOString\(\)\s*\}\);/,
  `const newUB = {
    $1createdAt: new Date().toISOString()
  };
  state.userBands.push(newUB);
  try {
    await googleSheetsService.appendUserBand(newUB);
  } catch (e) {
    console.warn("Failed to append userBand to sheets", e);
  }`
);

// 3rd occurrence
content = content.replace(
  /state\.userBands\.push\(\{([\s\S]*?)createdAt: new Date\(\)\.toISOString\(\)\s*\}\);/,
  `const newUB = {
    $1createdAt: new Date().toISOString()
  };
  state.userBands.push(newUB);
  try {
    await googleSheetsService.appendUserBand(newUB);
  } catch (e) {
    console.warn("Failed to append userBand to sheets", e);
  }`
);

// Delete route
content = content.replace(
  `    await googleSheetsService.deleteUser(id);
  } catch (err) {`,
  `    await googleSheetsService.deleteUserBand(\`ub-\${id}-\${targetBandId}\`);
    if (!otherBandsExist) {
      await googleSheetsService.deleteUser(id);
    }
  } catch (err) {`
);

// Put route
content = content.replace(
  /if \\(userBand\\) \\{[\\s\\S]*?userBand\\.role = role === "leader" \\? "leader" : "member";[\\s\\S]*?\\}/g,
  `if (userBand) {
        userBand.role = role === "leader" ? "leader" : "member";
        try {
          googleSheetsService.updateUserBand(userBand);
        } catch (e) { console.warn(e); }
      }`
);

fs.writeFileSync('server/routes/users.ts', content);
