const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<\/main>\n\n[\s]*\{\/\* --- SPOTIFY POPUP \(Mock\) ---\*\//,
  '        )}\n      </main>\n\n      {!isMinimalMode && (\n      <>\n      {/* --- SPOTIFY POPUP (Mock) --- */'
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done");
