exports.up = function(knex) {
  return knex.schema.table('packages', function(table) {
    table.text('photo_url').nullable()
      .comment('URL foto paket yang disimpan di Google Cloud Storage');
  });
};

exports.down = function(knex) {
  return knex.schema.table('packages', function(table) {
    table.dropColumn('photo_url');
  });
};