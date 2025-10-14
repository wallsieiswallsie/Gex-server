exports.up = function (knex) {
  return knex.schema.createTable("invoices", (table) => {
    table.string("id").primary();
    table.decimal("total_price").notNullable().defaultTo(0);

    table
      .integer("created_by")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("invoices");
};