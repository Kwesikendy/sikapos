const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const logoPath = path.join(rootDir, 'Sika POS Glossy Fintech Logo.png');
const logoBuf = fs.readFileSync(logoPath);
const base64Logo = logoBuf.toString('base64');
const dataUri = `data:image/png;base64,${base64Logo}`;

const iconDir = path.join(rootDir, 'client', 'public', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

fs.writeFileSync(path.join(iconDir, 'icon-192.png'), logoBuf);
fs.writeFileSync(path.join(iconDir, 'icon-512.png'), logoBuf);
fs.writeFileSync(path.join(iconDir, 'maskable-512.png'), logoBuf);
fs.writeFileSync(path.join(iconDir, 'maskable-192.png'), logoBuf);
fs.writeFileSync(path.join(rootDir, 'client', 'public', 'logo.png'), logoBuf);
fs.writeFileSync(path.join(rootDir, 'client', 'public', 'favicon.png'), logoBuf);
fs.writeFileSync(path.join(rootDir, 'client', 'public', 'apple-touch-icon.png'), logoBuf);

// SVGs
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192"><image href="${dataUri}" width="192" height="192" preserveAspectRatio="xMidYMid meet" /></svg>`;
fs.writeFileSync(path.join(iconDir, 'icon-192.svg'), svg192);

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="${dataUri}" width="512" height="512" preserveAspectRatio="xMidYMid meet" /></svg>`;
fs.writeFileSync(path.join(iconDir, 'icon-512.svg'), svg512);

const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" fill="#0D5C3A" /><image href="${dataUri}" x="51" y="51" width="410" height="410" preserveAspectRatio="xMidYMid meet" /></svg>`;
fs.writeFileSync(path.join(iconDir, 'maskable-512.svg'), svgMaskable);

console.log('All PWA icons (PNG and SVG) successfully updated with Sika POS Glossy Fintech Logo.');
