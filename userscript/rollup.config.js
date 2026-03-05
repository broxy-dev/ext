import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  input: join(__dirname, '../shared/main.js'),
  output: {
    file: join(__dirname, '../dist/broxy.js'),
    format: 'iife',
    name: 'Broxy'
  },
  plugins: [
    resolve(),
    terser({
      compress: {
        drop_console: false
      },
      format: {
        comments: false
      }
    })
  ]
};
