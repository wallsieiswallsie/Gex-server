exports.up = function(knex) {
  return knex.schema.createTable('batches_pesawat', (table) => {
    table.string('id').primary();

    table.string('pic').notNullable();

    // Di client, kirim dalam format ISO string 'YYYY-MM-DD' agar kompatibel
    table.date('tanggal_kirim').notNullable();

    // 'via' diambil otomatis dari paket-paket, simpan sebagai string
    table.string('via').notNullable();

    table.string('vendor').notNullable();

    // Total berat dan value dihitung di server sebelum insert
    table.decimal('total_berat', 12, 2).notNullable();
    table.decimal('total_value', 14, 2).notNullable();

    // Audit fields
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('created_by').notNullable();
    table.integer('updated_by').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('batches_pesawat');
};