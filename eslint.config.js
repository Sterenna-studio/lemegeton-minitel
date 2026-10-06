import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import globals from "globals";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      // Pipeline personnage et versions archivées : hors du code de l'application.
      "lemegeton/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": hooks },
    // Seules les deux règles historiques des hooks. Le preset `recommended`
    // de la v7 ajoute les règles du React Compiler (immutability, use-memo…),
    // que le projet n'utilise pas : les textures et matériaux Three.js y sont
    // modifiés impérativement par conception (needsUpdate, uniforms).
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
);
