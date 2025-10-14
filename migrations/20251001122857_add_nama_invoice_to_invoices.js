exports.up = async function(knex) {
  return knex.schema.alterTable('invoices', (table) => {
    table.string('nama_invoice').notNullable().defaultTo('');
  });
};


exports.down = async function(knex) {
  return knex.schema.alterTable('invoices', (table) => {
    table.dropColumn('nama_invoice');
  });
};
