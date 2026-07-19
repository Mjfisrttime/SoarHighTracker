const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /\bbg-white\b/g, replace: 'bg-white dark:bg-slate-800' },
  { search: /\btext-slate-800\b/g, replace: 'text-slate-800 dark:text-slate-100' },
  { search: /\bbg-slate-50\b/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { search: /\bfocus:bg-white\b/g, replace: 'focus:bg-white dark:focus:bg-slate-800' },
  { search: /\bborder-slate-200\b/g, replace: 'border-slate-200 dark:border-slate-700' },
  { search: /\bborder-slate-300\b/g, replace: 'border-slate-300 dark:border-slate-600' },
  { search: /\btext-slate-700\b/g, replace: 'text-slate-700 dark:text-slate-200' },
  { search: /\btext-slate-600\b/g, replace: 'text-slate-600 dark:text-slate-300' },
  { search: /\btext-slate-500\b/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /\bbg-slate-100\b/g, replace: 'bg-slate-100 dark:bg-slate-700' },
  { search: /\bbg-slate-200\b/g, replace: 'bg-slate-200 dark:bg-slate-600' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
      }
      // Deduplicate if already added (e.g. bg-white dark:bg-slate-800 dark:bg-slate-800)
      content = content.replace(/(dark:\S+)(?:\s+\1)+/g, '$1');
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
processDirectory(path.join(__dirname, 'components'));
console.log("Done adding dark variants!");
