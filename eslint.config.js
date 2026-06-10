import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";

export default [
  {
    ignores: ["lib/**/*"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  eslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "import-x": importPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      quotes: ["error", "double"],
      "import-x/no-unresolved": 0,
    },
  },
  prettier,
];
