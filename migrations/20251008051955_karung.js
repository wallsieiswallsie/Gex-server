exports.up = function (knex) {
  return knex.schema.createTable("karung", function (table) {
    table.increments("id").primary();

    table
      .string("id_batch", 50)
      .references("id")
      .inTable("batches_kapal")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.string("no_karung", 50).notNullable();

    table.unique(["id_batch", "no_karung"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("karung");
};