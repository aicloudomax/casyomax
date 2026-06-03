/**
 * Global test setup — runs before every test file.
 *
 * Several modules read process.env at import time (notably src/config/db.js,
 * which calls process.env.DB_HOST.includes(...) and constructs a pg Pool).
 * We seed harmless dummy values so those modules load cleanly. No real
 * connection is ever made: tests stub pool.query (see contactModel.test.js
 * for the pattern), and pg only dials out on the first real query.
 */
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_USER = process.env.DB_USER || "test";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "test";
process.env.DB_NAME = process.env.DB_NAME || "caresync_test";
process.env.DB_PORT = process.env.DB_PORT || "5432";
