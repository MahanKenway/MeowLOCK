const fs = require('fs');
const files = ['src/App.tsx', 'src/components/CentralClock.tsx', 'src/components/TimerWidget.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // replace import
  content = content.replace(/import ReactDraggable from "react-draggable";\nconst Draggable = ReactDraggable as any;/g, 'import { motion } from "motion/react";');
  
  // replace <Draggable nodeRef={xxxRef} ...><div ref={xxxRef} ...> with <motion.div drag dragMomentum={false} ...>
  // using regex is hard, let's use some targeted replacements
  
  content = content.replace(/<Draggable nodeRef=\{[^}]+\} cancel="[^"]+">[\s]*<div ref=\{[^}]+\}/g, '<motion.div drag dragMomentum={false}');
  content = content.replace(/<\/div>[\s]*<\/Draggable>/g, '</motion.div>');
  
  // also fix timer widget which might have Draggable without nodeRef before ? Wait, I updated all of them to have nodeRef
  content = content.replace(/<Draggable[^>]*>[\s]*<div ref=\{[^}]+\}/g, '<motion.div drag dragMomentum={false}');
  
  // just in case
  content = content.replace(/<Draggable[^>]*>[\s]*<div/g, '<motion.div drag dragMomentum={false}');
  
  fs.writeFileSync(file, content);
}
console.log("Done");
