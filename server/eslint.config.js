import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config({
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommended,
  ],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
})