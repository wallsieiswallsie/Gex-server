exports.up = function (knex) {
  return knex.schema.createTable("package_karung", function (table) {
    table.increments("id").primary();
    
    table
      .integer("karung_id")
      .unsigned()
      .references("id")
      .inTable("karung")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .integer("package_id")
      .references("id")
      .inTable("packages")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.unique(["package_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("package_karung");
};