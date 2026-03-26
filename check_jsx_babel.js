const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const root = process.cwd();
let issues = [];

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item === 'node_modules') continue;
      walk(full);
    } else if (full.endsWith('.js')) {
      if (!full.includes('screens') && !full.endsWith('App.js') && !full.endsWith('index.js')) return;
      const code = fs.readFileSync(full, 'utf8');
      try {
        parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
      } catch (e) {
        issues.push({ file: full, message: e.message });
      }
    }
  }
}

walk(root);

if (issues.length) {
  console.log('issues:', issues);
  process.exit(1);
} else {
  console.log('babel parse ok');
}
