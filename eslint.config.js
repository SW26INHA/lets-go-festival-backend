import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'

export default [
  prettier,

  {
    files: ['**/*.js'],
    ignores: ['node_modules', 'dist'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        log: 'readonly',
      },
      sourceType: 'module',
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: { import: importPlugin },
    rules: {
      // import 순서 정렬
      'import/order': [
        'error',
        {
          alphabetize: { caseInsensitive: true, order: 'asc' },
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],

      'no-console': 'error',
    },
  },
]
