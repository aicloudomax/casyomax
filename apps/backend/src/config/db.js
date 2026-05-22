const { Pool } = require("pg");

// Detect if using Azure-hosted PostgreSQL
const isAzure = process.env.DB_HOST.includes("postgres.database.azure.com");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: isAzure ? { rejectUnauthorized: false } : false, // SSL required on Azure
  options: "-c search_path=caresync"
});

console.log("Database name:", process.env.DB_NAME);
console.log("Database user:", process.env.DB_USER);
console.log("Database host:", process.env.DB_HOST);
console.log("Database port:", process.env.DB_PORT);



module.exports = pool;
