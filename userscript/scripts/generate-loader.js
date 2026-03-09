import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distPath = path.join(__dirname, '../../dist/broxy.js');
const templatePath = path.join(__dirname, 'tampermonkey-template.js');
const dataPath = path.join(__dirname, '../data.json');
const outputPath = path.join(__dirname, '../../tampermonkey-loader.js');

if (!fs.existsSync(distPath)) {
  console.error('Error: dist/broxy.js not found. Please run rollup first.');
  process.exit(1);
}

const coreCode = fs.readFileSync(distPath, 'utf-8');
const template = fs.readFileSync(templatePath, 'utf-8');

let initDataStr = 'null';
if (fs.existsSync(dataPath)) {
  try {
    const dataContent = fs.readFileSync(dataPath, 'utf-8');
    JSON.parse(dataContent);
    initDataStr = dataContent;
    console.log('   ✅ data.json loaded');
  } catch (error) {
    console.warn('   ⚠️ data.json parse error, using null:', error.message);
  }
}

const buildTime = new Date().toISOString();
const finalScript = template
  .replace('{{VERSION}}', pkg.version)
  .replace('{{BUILD_TIME}}', buildTime)
  .replace('{{INIT_DATA}}', initDataStr)
  .replace('{{CORE_CODE}}', coreCode);

fs.writeFileSync(outputPath, finalScript);

console.log('✅ tampermonkey-loader.js generated successfully!');
console.log(`   Build time: ${buildTime}`);
console.log(`   Output: ${outputPath}`);
console.log(`   Core code size: ${(coreCode.length / 1024).toFixed(2)} KB`);
