/**
 * Jest config for the Casyomax backend.
 *
 * The backend is plain CommonJS (no JSX / TS / ESM), so we disable Jest's
 * default babel transform entirely — Node's own require handles the files.
 * This keeps the toolchain light (no @babel/core dependency to manage).
 */
module.exports = {
  testEnvironment: "node",

  // Plain CommonJS — run files as-is, no transpilation.
  transform: {},

  // Only pick up files under __tests__/ named *.test.js. This deliberately
  // ignores the legacy ad-hoc probes at the app root (test_*.js / test-*.js),
  // which are run-by-hand scripts, not Jest specs.
  testMatch: ["**/__tests__/**/*.test.js"],

  testPathIgnorePatterns: ["/node_modules/", "/temp_uploads/"],

  // Runs before each test file: seeds dummy env so modules that read
  // process.env at import time (e.g. src/config/db.js) load without a real DB.
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Reset mock state between tests so specs stay independent.
  clearMocks: true,
};
