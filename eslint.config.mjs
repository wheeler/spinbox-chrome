import globals from 'globals';
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';

export default defineConfig([
  {
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        spinbox: true,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_\\w' }],
      // customize rules here
    },
  },
]);
