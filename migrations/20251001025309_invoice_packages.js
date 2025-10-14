exports.up = function (knex) {
  return knex.schema.createTable("invoice_packages", (table) => {
    table.increments("id").primary();
    table
      .string("invoice_id")
      .references("id")
      .inTable("invoices")
      .onDelete("CASCADE");
    table
      .integer("package_id")
      .unsigned()
      .references("id")
      .inTable("packages")
      .onDelete("CASCADE")
      .unique();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("invoice_packages");
};