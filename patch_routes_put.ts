import fs from 'fs';

let content = fs.readFileSync('server/routes/users.ts', 'utf8');

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
