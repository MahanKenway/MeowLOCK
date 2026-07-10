const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace left floating stack opening
content = content.replace(
  /\{\/\* --- LEFT SIDE FLOATING STACK ---\*\/}\n[\s]*<div className="fixed left-6 top-24 bottom-28/,
  '{/* --- LEFT SIDE FLOATING STACK --- */}\n        {!isMinimalMode && (\n        <div className="fixed left-6 top-24 bottom-28'
);

// Replace Central Clock area
content = content.replace(
  /\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\/}\n[\s]*<div className="flex-1 flex items-center justify-center h-full select-none pb-20">\n[\s]*<CentralClock username=\{username\} clockFontClass=\{clockFontClass\} \/>\n[\s]*<\/div>\n[\s]*\)}/,
  '        )} {/* END LEFT SIDE FLOATING STACK */}\n\n        {/* --- CENTRAL IMMERSIVE TIMER AREA --- */}\n        {!isMinimalMode && (\n        <div className="flex-1 flex items-center justify-center h-full select-none pb-20">\n          <CentralClock username={username} clockFontClass={clockFontClass} />\n        </div>\n        )}'
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done");
