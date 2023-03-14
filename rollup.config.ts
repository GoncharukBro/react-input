import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  output: {
    format: 'es',
    dir: 'dist',
  },
  external: ['react', 'react-dom'],
  plugins: [
    nodeResolve(),
    babel({
      babelHelpers: 'bundled',
    }),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    terser(),
  ],
};
