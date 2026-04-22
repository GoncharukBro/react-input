import transformRuntime from '@babel/plugin-transform-runtime';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

import readdir from './utils/readdir.js';

const { npm_package_name } = process.env;

if (!npm_package_name) {
  throw new Error('');
}

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.es6', '.es', '.mjs'];
const ENTRIES = {
  '@react-input/core': {
    react: {
      input: ['./src'],
    },
  },
  '@react-input/mask': {
    cdn: {
      input: 'src/Mask.ts',
      output: {
        name: 'Mask',
      },
    },
    react: {
      input: ['src/index.ts', 'src/InputMask.tsx', 'src/Mask.ts', 'src/useMask.ts', 'src/utils.ts'],
    },
  },
  '@react-input/number-format': {
    cdn: {
      input: 'src/NumberFormat.ts',
      output: {
        name: 'NumberFormat',
      },
    },
    react: {
      input: [
        'src/index.ts',
        'src/InputNumberFormat.tsx',
        'src/NumberFormat.ts',
        'src/useNumberFormat.ts',
        'src/utils.ts',
      ],
    },
  },
};

const reduceFromDir = (/** @type {import("fs").PathLike} */ dir) => {
  return readdir(dir)
    .filter((path) => !/\.stories\.[^/]+$|\.test\.[^/]+$|types.ts$|\.d\.ts$/gm.test(path))
    .reduce((prev, path) => {
      return { ...prev, [path.replace(/^\.\/src\/|\.[^/]+$/g, '')]: path };
    }, {});
};

const reduceEntries = (/** @type {string[]} */ entries) => {
  return entries.reduce((prev, path) => {
    if (/\.[^/]+$/.test(path)) {
      return { ...prev, [path.replace(/^src\/|\.[^/]+$/g, '')]: path };
    }

    return { ...prev, ...reduceFromDir(path) };
  }, {});
};

const plugins = (/** @type {'cdn'|'react'} */ output) => [
  replace({
    preventAssignment: true,
    values: {
      'process.env.__OUTPUT__': JSON.stringify(output),
      ...(output === 'cdn' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {}),
    },
  }),
  nodeResolve({
    extensions: EXTENSIONS,
  }),
  commonjs(),
  babel({
    root: '../..',
    babelHelpers: 'runtime',
    extensions: EXTENSIONS,
    plugins: [transformRuntime],
  }),
  terser(),
];

export default () => {
  // @ts-expect-error
  const entries = ENTRIES[npm_package_name];
  const config = [];

  if (entries.cdn) {
    config.push({
      input: entries.cdn.input,
      output: {
        format: 'umd',
        file: 'cdn/index.js',
        name: `ReactInput.${entries.cdn.output.name}`,
      },
      plugins: plugins('cdn'),
    });
  }

  if (entries.react) {
    config.push({
      input: reduceEntries(entries.react.input),
      output: [
        {
          format: 'es',
          dir: 'module',
          entryFileNames: '[name].js',
          chunkFileNames: 'helpers-[hash].js',
          hoistTransitiveImports: false,
        },
        {
          format: 'cjs',
          dir: 'node',
          entryFileNames: '[name].cjs',
          chunkFileNames: 'helpers-[hash].cjs',
          hoistTransitiveImports: false,
          exports: 'named',
        },
      ],
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^@react-input\/core(\/.*)?$/],
      plugins: plugins('react'),
    });
  }

  return config;
};
