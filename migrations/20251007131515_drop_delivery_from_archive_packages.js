exports.up = function (knex) {
  return knex.schema.table("archive_packages", function (table) {
    table.dropColumn("delivery");
  });
};

exports.down = function (knex) {
  return knex.schema.table("archive_packages", function (table) {
    table.boolean("delivery").defaultTo(false).notNullable();
  });
};