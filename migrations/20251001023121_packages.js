exports.up = function (knex) {
  return knex.schema.createTable("packages", (table) => {
    table.increments("id").primary();
    table.string("nama").notNullable();
    table.string("resi").notNullable().unique();
    table.decimal("panjang").notNullable();
    table.decimal("lebar").notNullable();
    table.decimal("tinggi").notNullable();
    table.decimal("berat").notNullable();
    table
      .decimal("berat_dipakai", 10, 2)
      .notNullable()
      .defaultTo(0);
    table.string("kode").notNullable();
    table
      .enum("via", ["Kapal", "Pesawat"], {
        useNative: true,
        enumName: "via_enum",
      })
      .notNullable();
    table.decimal("harga").notNullable().defaultTo(0);
    table.boolean("invoiced").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("packages");
};