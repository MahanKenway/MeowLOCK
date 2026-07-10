const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Wrap MAIN HEADER BAR
content = content.replace(
  /\{\/\* --- MAIN HEADER BAR ---\*\/}\n[\s]*<header[\s\S]*?<\/header>/,
  match => `{!isMinimalMode && (\n${match}\n      )}`
);

// 2. Wrap LEFT SIDE FLOATING STACK
content = content.replace(
  /\{\/\* --- LEFT SIDE FLOATING STACK ---\*\/}\n[\s]*<div className="fixed left-6 top-24 bottom-28 w-80 md:w-96 z-20 flex flex-col gap-4 pointer-events-none overflow-visible pb-4">[\s\S]*?<\/div>[\s]*\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\//,
  match => `{!isMinimalMode && (\n${match.replace(/\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\//, ')}\n        {/* --- CENTRAL IMMERSIVE TIMER AREA --- */}')}`
);

// 3. Wrap CENTRAL IMMERSIVE TIMER AREA
content = content.replace(
  /\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\/}\n[\s]*<div className="flex-1 flex items-center justify-center h-full select-none pb-20">\n[\s]*<CentralClock[\s\S]*?<\/div>/,
  match => `{!isMinimalMode && (\n${match}\n        )}`
);

// 4. Wrap RIGHT SIDE FLOATING STACK
content = content.replace(
  /\{\/\* --- RIGHT SIDE FLOATING STACK ---\*\/}\n[\s]*<div className="fixed right-6 top-24 bottom-28 w-80 md:w-96 z-20 flex flex-col gap-4 pointer-events-none overflow-visible pb-4">[\s\S]*?<\/div>\n[\s]*<\/main>/,
  match => `{!isMinimalMode && (\n${match.replace(/<\/div>\n[\s]*<\/main>/, '</div>\n        )}\n      </main>')}`
);

// 5. Wrap everything after <main> (SPOTIFY, LEFT DOCK, RIGHT DOCK)
content = content.replace(
  /<\/main>\n[\s]*\{\/\* --- SPOTIFY POPUP \(Mock\) ---\*\//,
  `</main>\n      {!isMinimalMode && (\n      <>\n      {/* --- SPOTIFY POPUP (Mock) --- */}`
);

// And close it before the last `</div>` of the App
content = content.replace(
  /<\/motion.div>\n    <\/div>\n  \);\n}/,
  `</motion.div>\n      </>\n      )}\n    </div>\n  );\n}`
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done");
