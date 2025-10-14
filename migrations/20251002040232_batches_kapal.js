exports.up = function(knex) {
  return knex.schema.createTable('batches_kapal', (table) => {
    table.string('id').primary();

    table.string('nama_kapal').notNullable();

    // Tanggal closing dan berangkat
    // Gunakan tipe DATE di PostgreSQL
    // Di client, kirim dalam format ISO string 'YYYY-MM-DD' agar kompatibel
    table.date('tanggal_closing').notNullable();
    table.date('tanggal_berangkat').notNullable();

    // 'via' diambil otomatis dari paket-paket, simpan sebagai string
    table.string('via').notNullable();

    table.string('vendor').notNullable();

    // Total berat dan value dihitung di server sebelum insert
    table.decimal('total_berat', 12, 2).nullable();
    table.decimal('total_value', 14, 2).nullable();

    // Audit fields
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('created_by').nullable();
    table.integer('updated_by').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('batches_kapal');
};