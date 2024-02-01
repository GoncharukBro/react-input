const babel = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');
const typescript = require('@rollup/plugin-typescript');

const output = {
  module: {
    format: 'es',
    dir: 'dist',
  },
  node: {
    format: 'cjs',
    dir: 'dist/node',
    entryFileNames: '[name].cjs',
    chunkFileNames: '[name]-[hash].cjs',
  },
};

function createRollupConfig(env, config) {
  return {
    ...config,
    output: output[env],
    external: ['react', 'react-dom', 'react/jsx-runtime', /^@react-input\/core.*/],
    plugins: [
      nodeResolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
      }),
      typescript({
        tsconfig: `tsconfig.${env}.json`,
      }),
      terser(),
    ],
  };
}

module.exports = createRollupConfig;
