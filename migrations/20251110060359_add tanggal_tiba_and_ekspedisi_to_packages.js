exports.up = function (knex) {
  return knex.schema.alterTable("packages", function (table) {
    table.date("tanggal_tiba").nullable();
    table.string("ekspedisi").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("packages", function (table) {
    table.dropColumn("tanggal_tiba");
    table.dropColumn("ekspedisi");
  });
};