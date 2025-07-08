// OneFoodDialer - ESLint Configuration
module.exports = {
  extends: ['next/core-web-vitals', 'eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // Code quality rules
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',

    // React specific rules
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',

    // Next.js specific rules
    '@next/next/no-img-element': 'warn',
    '@next/next/no-html-link-for-pages': 'error',

    // Import rules
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
      },
    ],

    // General JavaScript rules
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'es5'],
    semi: ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true }],
    'jsx-quotes': ['error', 'prefer-double'],

    // Spacing and formatting (handled by Prettier mostly)
    indent: 'off', // Let Prettier handle this
    'linebreak-style': 'off', // Let Prettier handle this
    'max-len': 'off', // Let Prettier handle this

    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Performance rules
    'no-loop-func': 'error',
    'no-inner-declarations': 'error',

    // Accessibility rules (basic)
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
  },

  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  settings: {
    react: {
      version: 'detect',
    },
  },

  // Override rules for specific file patterns
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off', // Allow console in tests
      },
    },
    {
      files: ['**/pages/api/**/*.js'],
      rules: {
        'no-console': 'off', // Allow console in API routes for logging
      },
    },
    {
      files: ['next.config.js', 'jest.config.js', 'playwright.config.js'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],

  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    'coverage/',
    'test-results/',
    'playwright-report/',
    '*.min.js',
    '**/*.config.js',
    'public/',
  ],
};
