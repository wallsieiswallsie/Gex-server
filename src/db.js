require("dotenv").config();
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  pool: { min: 0, max: 5 },
});

db.raw("SELECT 1")
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection failed:", err));

module.exports = db;