exports.up = function (knex) {
  return knex.schema.createTable("package_status", (table) => {
    table.increments("id").primary(); // auto increment PK

    table
      .integer("package_id")
      .unsigned()
      .references("id")
      .inTable("packages")
      .onDelete("CASCADE"); // FK ke packages.id

    table.integer("status").notNullable(); // status 1 - 8

    // gunakan timestamp agar menyimpan tanggal + waktu
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    // tambahkan constraint unik agar .onConflict('package_id') valid
    table.unique(["package_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("package_status");
};