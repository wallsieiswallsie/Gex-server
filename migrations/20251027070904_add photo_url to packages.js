exports.up = function(knex) {
  return knex.schema.table('packages', function(table) {
    table.string('photo_url', 500).nullable()
      .comment('URL foto paket yang disimpan di Google Cloud Storage');
  });
};

exports.down = function(knex) {
  return knex.schema.table('packages', function(table) {
    table.dropColumn('photo_url');
  });
};