module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Handle unused variables with warnings instead of errors
    '@typescript-eslint/no-unused-vars': 'warn',
    // Allow JSX elements without definitions (for custom components)
    'react/jsx-no-undef': 'warn',
    // Allow img elements without alt text (from .eslintrc.json)
    '@next/next/no-img-element': 'off',
    // Allow comments in JSX (from .eslintrc.json)
    'react/jsx-no-comment-textnodes': 'off'
  }
};