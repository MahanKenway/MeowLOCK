const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix Central Immersive Timer Area duplication
content = content.replace(
/        \{\/\* --- CENTRAL IMMERSIVE TIMER AREA --- \*\/}\n        <\/div>\n        \)}\n\n        \{\/\* --- CENTRAL IMMERSIVE TIMER AREA --- \*\/}/,
'        )}\n\n        {/* --- CENTRAL IMMERSIVE TIMER AREA --- */}'
);

// Fix Right side floating stack not closing correctly
// let's check what's around line 1128
// ...

fs.writeFileSync('src/App.tsx', content);
