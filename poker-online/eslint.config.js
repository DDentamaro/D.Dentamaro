import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Le fiches non devono mai passare da Number/float (§6.2): vietato Math.random ovunque (§7).
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Usare CSPRNG (node:crypto) fuori dal motore; nei test un mazzo fisso.' },
      ],
    },
  },
);
