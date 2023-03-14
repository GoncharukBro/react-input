import rollupConfig from '../../rollup.config';

export default {
  ...rollupConfig,
  input: ['src/index.ts', 'src/InputMask.tsx', 'src/useMask.ts'],
};
