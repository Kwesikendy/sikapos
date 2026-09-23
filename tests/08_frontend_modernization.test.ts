import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectGhanaCarrier, formatGHS } from '../client/src/lib/utils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Frontend Modernization - Unit 1: Ghana Telco Detection', () => {
  // MTN prefixes: 024, 054, 055, 059, 025
  assert.strictEqual(detectGhanaCarrier('0244123456').slug, 'mtn');
  assert.strictEqual(detectGhanaCarrier('0551000000').slug, 'mtn');
  assert.strictEqual(detectGhanaCarrier('233244123456').slug, 'mtn');

  // Telecel prefixes: 020, 050
  assert.strictEqual(detectGhanaCarrier('0201234567').slug, 'telecel');
  assert.strictEqual(detectGhanaCarrier('0509876543').slug, 'telecel');

  // AT prefixes: 027, 057, 026, 056
  assert.strictEqual(detectGhanaCarrier('0271234567').slug, 'at');
  assert.strictEqual(detectGhanaCarrier('0267654321').slug, 'at');
});

test('Frontend Modernization - Unit 2: Currency Tabular Formatting', () => {
  assert.strictEqual(formatGHS(48), 'GH₵ 48.00');
  assert.strictEqual(formatGHS(12.5), 'GH₵ 12.50');
  assert.strictEqual(formatGHS(0), 'GH₵ 0.00');
});

test('Frontend Modernization - Constraint 1: Zero Emojis in React Source Code', () => {
  const clientSrcDir = path.join(rootDir, 'client', 'src');
  
  function scanDir(dir: string): string[] {
    const files = fs.readdirSync(dir);
    let results: string[] = [];
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        results = results.concat(scanDir(full));
      } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.html')) {
        results.push(full);
      }
    }
    return results;
  }

  const filesToScan = scanDir(clientSrcDir);
  // Regex to detect common emojis (Unicode ranges for emojis)
  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(emojiRegex);
    assert.strictEqual(
      match,
      null,
      `Found forbidden emoji "${match?.[0]}" in file: ${path.relative(rootDir, file)}`
    );
  }
});

test('Frontend Modernization - Constraint 2: Zero Em Dashes in React User Copy', () => {
  const clientPagesDir = path.join(rootDir, 'client', 'src', 'pages');
  const files = fs.readdirSync(clientPagesDir).filter((f) => f.endsWith('.tsx'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(clientPagesDir, file), 'utf8');
    assert.ok(
      !content.includes('—'),
      `Found forbidden em dash "—" in client page: ${file}`
    );
  }
});

test('Frontend Modernization - Verification: Production Build Artifacts Exist', () => {
  const distDir = path.join(rootDir, 'dist', 'client');
  assert.ok(fs.existsSync(distDir), 'dist/client directory exists');
  assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/client/index.html exists');

  const assetsDir = path.join(distDir, 'assets');
  assert.ok(fs.existsSync(assetsDir), 'dist/client/assets directory exists');
  const assetFiles = fs.readdirSync(assetsDir);
  assert.ok(assetFiles.some((f) => f.endsWith('.js')), 'Compiled JS bundle exists');
  assert.ok(assetFiles.some((f) => f.endsWith('.css')), 'Compiled CSS bundle exists');
});
