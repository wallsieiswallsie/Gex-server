exports.up = function(knex) {
  return knex.schema.createTable("batch_packages", table => {
    table.increments("id").primary(); // auto-increment
    table.string("id_batch").notNullable(); // bisa FK ke batches_kapal / batches_pesawat
    table.integer("package_id").unsigned().notNullable();
    table.string("via").notNullable(); // "Kapal" atau "Pesawat"

    table.foreign("package_id").references("id").inTable("packages").onDelete("CASCADE");

    // optional: index untuk pencarian cepat
    table.index(["id_batch", "via"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("batch_packages");
};