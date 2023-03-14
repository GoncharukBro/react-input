import rollupConfig from '../../rollup.config';

export default {
  ...rollupConfig,
  input: ['src/index.ts', 'src/InputNumberFormat.tsx', 'src/useNumberFormat.ts'],
};
