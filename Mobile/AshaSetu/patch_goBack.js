const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (/\.jsx?$/.test(entry.name)) {
      let content = fs.readFileSync(p, 'utf8');
      if (content.includes('navigation.goBack()')) {
        const fixed = content.replace(/navigation\.goBack\(\)/g, 'navigation.canGoBack() ? navigation.goBack() : undefined');
        if (fixed !== content) {
          fs.writeFileSync(p, fixed, 'utf8');
          console.log('patched', p);
        }
      }
    }
  }
}

walk(root);
