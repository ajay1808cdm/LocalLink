module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended-legacy'
  ],
  plugins: [
    'security'
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-child-process': 'warn'
  },
};
