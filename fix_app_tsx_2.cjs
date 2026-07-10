const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace right floating stack opening
content = content.replace(
  /\{\/\* --- RIGHT SIDE FLOATING STACK ---\*\/}\n[\s]*<div className="fixed right-6 top-24 bottom-28/,
  '{/* --- RIGHT SIDE FLOATING STACK --- */}\n        {!isMinimalMode && (\n        <div className="fixed right-6 top-24 bottom-28'
);

// Replace closing before </main>
content = content.replace(
  /<\/div>\n[\s]*<\/main>/,
  '</div>\n        )}\n      </main>'
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done");
