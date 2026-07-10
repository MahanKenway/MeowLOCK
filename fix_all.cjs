const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Strip all `{!isMinimalMode && (`
content = content.replace(/\{!isMinimalMode && \(\n/g, '');
content = content.replace(/\{!isMinimalMode && \(/g, '');
// Strip all stray `)}` that are by themselves on a line, or closing tags
content = content.replace(/^[\s]*\)\}[\s]*$/gm, '');
content = content.replace(/<\/div>\n[\s]*\)\}/g, '</div>');
content = content.replace(/<\/header>\n[\s]*\)\}/g, '</header>');
content = content.replace(/<\/main>\n[\s]*\)\}/g, '</main>');
content = content.replace(/<\/motion\.div>\n[\s]*\)\}/g, '</motion.div>');

// Also `</>` and `<>`
content = content.replace(/<>\n/g, '');
content = content.replace(/<\/>\n/g, '');

fs.writeFileSync('src/App.tsx', content);
