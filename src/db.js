require("dotenv").config();
const knex = require("knex");

const db = knex({
  client: "pg",
  connection: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = db;
