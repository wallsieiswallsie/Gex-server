export function up(knex) {
  return knex.schema.createTable("finance_deposits", (table) => {
    table.increments("id").primary();
    table.decimal("nominal", 15, 2).notNullable();
    table.timestamp("tanggal_setoran").defaultTo(knex.fn.now());
    table.text("keterangan").nullable();

    table
      .integer("created_by")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("RESTRICT");
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("finance_deposits");
}