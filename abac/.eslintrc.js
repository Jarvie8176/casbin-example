module.exports = {
  extends: ["standard", "prettier", "prettier/standard", "plugin:jest/recommended", "typescript"],
  plugins: ["import", "prettier", "standard", "jest", "@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
    es6: true,
    jest: true,
    "jest/globals": true
  },
  rules: {
    "@typescript-eslint/rule-name": "error",
    "@typescript-eslint/indent": 0,
    "space-before-function-paren": 0,
    "new-cap": 0,
    "prettier/prettier": 2,
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error"
  }
};
