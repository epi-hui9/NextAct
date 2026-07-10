import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

/**
 * Flat ESLint config. `eslint-config-next` v16 ships a ready flat config array
 * (core-web-vitals + typescript + import/jsx-a11y). We append Prettier last to
 * disable stylistic rules that conflict with the formatter.
 */
const eslintConfig = [
  ...next,
  prettier,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
