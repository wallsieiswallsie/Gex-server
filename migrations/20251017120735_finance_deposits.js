export function up(knex) {
  return knex.schema.createTable("finance_deposits", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));

    table.decimal("nominal", 15, 2).notNullable();
    table.timestamp("tanggal_setoran").defaultTo(knex.fn.now());
    table.text("keterangan").nullable();

    table
      .uuid("created_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.index("created_by");
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("finance_deposits");
}