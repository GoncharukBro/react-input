import { execSync } from 'child_process';
import fs from 'fs';

import readdir from '../utils/readdir';
import style from '../utils/style';

const { npm_package_name } = process.env;

if (!npm_package_name) {
  throw new Error('');
}

/**
 * Write entries
 */

if (npm_package_name === '@react-input/core') {
  const resolvedPaths = readdir('./src').filter((path) => {
    return !/index.[^/]+$|\.stories\.[^/]+$|\.test\.[^/]+$|types\.ts$|\.d\.ts$/gm.test(path);
  });

  const imports = resolvedPaths.map((path) => {
    const normalizedPath = path.replace(/^\.\/src\/|\.[^/]+$/g, '');
    const moduleName = normalizedPath.replace(/^(.*\/)?/g, '');

    return `export { default as ${moduleName} } from './${normalizedPath}';\n`;
  });

  fs.writeFileSync('./src/index.ts', `${imports.join('')}\nexport type * from './types';\n`, { encoding: 'utf-8' });
}

/**
 * Remove output directories
 */

for (const dir of ['@types', 'cdn', 'module', 'node']) {
  fs.rmSync(`./${dir}`, { recursive: true, force: true });
}

/**
 * Rollup build
 */

execSync('rollup --config ../../rollup.config.js');

/**
 * Declare types
 */

execSync(
  `tsc src/index.ts ${npm_package_name === '@react-input/core' ? '--removeComments' : ''} --declaration --emitDeclarationOnly --esModuleInterop --jsx react --rootDir src --outDir @types --skipLibCheck`,
);

/**
 * Clear types
 */

{
  const nodePaths = readdir('./node');
  const typesPaths = readdir('./@types');

  typesPaths.forEach((path) => {
    const normalizedPath = path.replace(/^\.\/@types/, './node').replace(/d\.ts$/, 'cjs');

    if (!nodePaths.includes(normalizedPath) && !path.endsWith('/types.d.ts')) {
      const dirPath = path.replace(/\/[^/]*$/gm, '');

      fs.rmSync(path);

      if (fs.readdirSync(dirPath).length === 0) {
        fs.rmdirSync(dirPath);
      }
    }
  });
}

/**
 * Add directives
 */

{
  const map = {
    '@react-input/mask': 'InputMask',
    '@react-input/number-format': 'InputNumberFormat',
  };

  if (npm_package_name === '@react-input/mask' || npm_package_name === '@react-input/number-format') {
    for (const type of ['node', 'module']) {
      const format = type === 'module' ? 'js' : 'cjs';
      const path = `./${type}/${map[npm_package_name]}.${format}`;

      let src = fs.readFileSync(path, 'utf-8');

      if (type === 'module') {
        src = src.replace('', '"use client";');
      }

      if (type === 'node') {
        src = src.replace('"use strict";', '"use strict";"use client";');
      }

      fs.writeFileSync(path, src);
    }
  }
}

// /**
//  * Create package.json
//  */

// {
//   const map = {
//     '@react-input/mask': 'InputMask',
//     '@react-input/number-format': 'InputNumberFormat',
//   };

//   if (npm_package_name === '@react-input/mask' || npm_package_name === '@react-input/number-format') {
//     for (const type of ['node', 'module']) {
//       fs.writeFileSync(
//         `./${type}/${map[npm_package_name]}/package.json`,
//         JSON.stringify(
//           {
//             sideEffects: false,
//             type: type === 'module' ? 'module' : undefined,
//             types: `../../@types/${map[npm_package_name]}/index.d.ts`,
//             module: type === 'module' ? './index.js' : `../../module/${map[npm_package_name]}/index.js`,
//             main: type === 'node' ? './index.cjs' : `../../node/${map[npm_package_name]}/index.cjs`,
//           },
//           null,
//           2,
//         ),
//       );
//     }
//   }
// }

/**
 * Console
 */

{
  const packageName = `${process.env.npm_package_name}@${process.env.npm_package_version}`;

  console.log(
    `\n${style.fg.yellow}The package ${style.fg.blue}${packageName} ${style.fg.yellow}was successfully built!\n`,
    style.reset,
  );
}
