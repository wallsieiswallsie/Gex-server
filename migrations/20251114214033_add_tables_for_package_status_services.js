/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Tambah kolom ke tabel packages
  await knex.schema.alterTable("packages", (table) => {
    table.integer("review");             
    table.boolean("is_failed_xray");     
  });

  // 2. Buat tabel confirmed_packages
  await knex.schema.createTable("confirmed_packages", (table) => {
    table.increments("id").primary();
    table
      .integer("package_id")
      .unsigned()
      .references("id")
      .inTable("packages")
      .onDelete("CASCADE");
    table.boolean("is_moved").defaultTo(false);
  });

  // 3. Buat tabel failed_xray
  await knex.schema.createTable("failed_xray", (table) => {
    table.increments("id").primary();
    table
      .integer("package_id")
      .unsigned()
      .references("id")
      .inTable("packages")
      .onDelete("CASCADE");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {

  await knex.schema.dropTableIfExists("failed_xray");
  await knex.schema.dropTableIfExists("confirmed_packages");

  await knex.schema.alterTable("packages", (table) => {
    table.dropColumn("review");
    table.dropColumn("is_failed_xray");
  });
};