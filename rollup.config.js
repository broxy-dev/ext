import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/broxy.js',
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
