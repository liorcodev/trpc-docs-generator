import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the CSS and JS files
const styles = readFileSync(join(__dirname, '../src/styles.css'), 'utf-8');
const scripts = readFileSync(join(__dirname, '../src/scripts.js'), 'utf-8');
const logo = readFileSync(join(__dirname, '../src/logo-base64.txt'), 'utf-8').trim();

// Create the inlined version
const inlinedContent = `// Auto-generated file with inlined CSS and JS
const INLINED_STYLES = ${JSON.stringify(styles)};
const INLINED_SCRIPTS = ${JSON.stringify(scripts)};
const INLINED_LOGO = ${JSON.stringify(logo)};

export function getStyles() {
  return INLINED_STYLES;
}

export function getScripts() {
  return INLINED_SCRIPTS;
}

export function getLogo() {
  return INLINED_LOGO;
}
`;

// Ensure dist directory exists
mkdirSync('dist', { recursive: true });

// Write the inlined file
writeFileSync(join(__dirname, '../src/assets-inline.ts'), inlinedContent);

console.log('✅ Created assets-inline.ts with embedded CSS and JS');
