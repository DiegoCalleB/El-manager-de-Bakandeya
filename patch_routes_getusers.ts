import fs from 'fs';

let content = fs.readFileSync('server/routes/users.ts', 'utf8');

content = content.replace(
  /const bandUsers = state\.users\.filter\(\(u: any\) => bandUserIds\.has\(u\.id\)\);/g,
  `const bandUsers = state.users.filter((u: any) => bandUserIds.has(u.id)).map((u: any) => {
    const ub = state.userBands.find((ub: any) => ub.user_id === u.id && ub.band_id === bandId);
    return { ...u, role: ub?.role || 'member' };
  });`
);

content = content.replace(
  /res\.json\(getSafeUsers\(sheetUsers\)\);/g,
  `const mergedUsers = sheetUsers.map((u: any) => {
      const ub = state.userBands.find((ub: any) => ub.user_id === u.id && ub.band_id === bandId);
      return { ...u, role: ub?.role || 'member' };
    });
    res.json(getSafeUsers(mergedUsers));`
);

fs.writeFileSync('server/routes/users.ts', content);
