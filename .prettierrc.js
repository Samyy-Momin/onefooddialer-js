// OneFoodDialer - Prettier Configuration
module.exports = {
  // Core formatting options
  semi: true, // Add semicolons at the end of statements
  trailingComma: 'es5', // Add trailing commas where valid in ES5 (objects, arrays, etc.)
  singleQuote: true, // Use single quotes instead of double quotes
  jsxSingleQuote: false, // Use double quotes in JSX
  printWidth: 100, // Line length that the printer will wrap on
  tabWidth: 2, // Number of spaces per indentation level
  useTabs: false, // Indent with spaces instead of tabs

  // Bracket and spacing options
  bracketSpacing: true, // Print spaces between brackets in object literals
  bracketSameLine: false, // Put the > of a multi-line JSX element at the end of the last line
  arrowParens: 'avoid', // Omit parens when possible in arrow functions

  // Quote and string options
  quoteProps: 'as-needed', // Only add quotes around object properties when needed

  // HTML, CSS, and other file options
  htmlWhitespaceSensitivity: 'css', // Respect the default value of CSS display property

  // End of line options
  endOfLine: 'lf', // Use \n for line endings (Unix style)

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto', // Format embedded code if Prettier can identify it

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.css',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.scss',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
  ],
};
