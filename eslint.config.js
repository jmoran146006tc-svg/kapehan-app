// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Expo resolves .native/.web modules at bundle time; the generic ESLint
      // resolver cannot follow this platform split or the tsconfig @ alias.
      'import/no-unresolved': 'off',
    },
  }
]);
