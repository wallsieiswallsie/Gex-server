exports.up = function (knex) {
  return knex.schema.alterTable("packages", (table) => {
    table.decimal("harga", 14, 2).alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("packages", (table) => {
    table.decimal("harga", 8, 2).alter();
  });
};