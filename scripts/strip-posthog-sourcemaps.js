/**
 * posthog-js ships source map links to files it doesn't include, so Create React App prints a
 * "Failed to parse source map" warning for each one. This removes those links after every install.
 */
const fs = require('fs');
const path = require('path');

const roots = ['posthog-js', '@posthog'].map((p) => path.join(__dirname, '..', 'node_modules', p));
const MAP_LINK = /\n?\/\/# sourceMappingURL=\S+\s*$/;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(m?js|cjs)$/.test(entry.name)) {
      const code = fs.readFileSync(file, 'utf8');
      if (MAP_LINK.test(code)) fs.writeFileSync(file, code.replace(MAP_LINK, '\n'));
    }
  }
}

roots.forEach(walk);
