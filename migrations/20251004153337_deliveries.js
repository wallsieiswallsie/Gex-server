exports.up = function (knex) {
  return knex.schema.createTable("deliveries", (table) => {
    table.increments("id").primary();
    table
      .string("invoice_id")
      .notNullable()
      .references("id")
      .inTable("invoices")
      .onDelete("CASCADE");
    table
      .integer("package_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("packages")
      .onDelete("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // supaya satu paket tidak bisa masuk dua kali ke delivery invoice yang sama
    table.unique(["invoice_id", "package_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("deliveries");
};