const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The LEFT SIDE FLOATING STACK should be closed before Central Immersive Timer Area
content = content.replace(
  /<\/div>\n[\s]*\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\//,
  '</div>\n        )}\n\n        {/* --- CENTRAL IMMERSIVE TIMER AREA --- */'
);

// Central Immersive Timer Area should be opened and closed properly
content = content.replace(
  /\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\/}\n[\s]*<div className="flex-1 flex items-center justify-center h-full select-none pb-20">\n[\s]*<CentralClock username=\{username\} clockFontClass=\{clockFontClass\} \/>\n[\s]*(<\/div>|<\/div>\n[\s]*\)\})/,
  '{/* --- CENTRAL IMMERSIVE TIMER AREA --- */}\n        {!isMinimalMode && (\n        <div className="flex-1 flex items-center justify-center h-full select-none pb-20">\n          <CentralClock username={username} clockFontClass={clockFontClass} />\n        </div>\n        )}'
);

// If there are stray `)}` anywhere, let's just make sure there are no syntax errors
fs.writeFileSync('src/App.tsx', content);
console.log("Done");
