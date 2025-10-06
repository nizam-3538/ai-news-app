const globals = require("globals");
const js = require("@eslint/js");
const security = require("eslint-plugin-security");

module.exports = [
  {
    ignores: ["eslint.config.js", "jest.config.js"],
  },
  // Config for source files
  {
    files: ["*.js", "!(tests)/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        "Auth": "readonly",
        "Favorites": "readonly",
        "Search": "readonly",
        "Fuse": "readonly",
        "module": "readonly", // To allow module.exports in browser scripts
      }
    },
    rules: {
        "no-unused-vars": "warn"
    }
  },
  // Config for test files
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      }
    }
  },
  js.configs.recommended,
  security.configs.recommended,
];