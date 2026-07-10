const fs = require('fs');
let content = fs.readFileSync('/tmp/app_section.tsx', 'utf8');

// 1. Fix Left Side Floating Stack opening missing `{!isMinimalMode && (`
content = content.replace(
  /\{\/\* --- LEFT SIDE FLOATING STACK ---\*\/}\n[\s]*<div className="fixed left-6/,
  '{/* --- LEFT SIDE FLOATING STACK --- */}\n        {!isMinimalMode && (\n        <div className="fixed left-6'
);

// 2. Fix the `)}` before Central Immersive Timer Area (it should close the Left Side Floating Stack `div`)
content = content.replace(
  /<\/div>\n[\s]*\)}\n[\s]*\{\/\* --- CENTRAL IMMERSIVE TIMER AREA ---\*\//,
  '</div>\n        )}\n        {/* --- CENTRAL IMMERSIVE TIMER AREA --- */'
);

// 3. Fix Right Side Floating Stack `{!isMinimalMode && (` BEFORE the comment
content = content.replace(
  /\{!isMinimalMode && \(\n[\s]*\{\/\* --- RIGHT SIDE FLOATING STACK ---\*\//,
  '{/* --- RIGHT SIDE FLOATING STACK --- */}\n        {!isMinimalMode && ('
);

fs.writeFileSync('/tmp/app_section_fixed.tsx', content);
