/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Tabel syarat_ketentuan
  await knex.schema.createTable('syarat_ketentuan', table => {
    table.increments('id').primary();
    table.text('list').notNullable();
    table.timestamps(true, true);
  });

  // Tabel jadwal_kirim
  await knex.schema.createTable('jadwal_kirim', table => {
    table.increments('id').primary();
    table.text('nama_kapal').notNullable();
    table.date('tanggal_closing').notNullable();
    table.date('tanggal_berangkat').notNullable();
    table.date('estimasi_tiba').notNullable();
    table.timestamps(true, true);
  });

  // Tabel lokasi_kontak
  await knex.schema.createTable('lokasi_kontak', table => {
    table.increments('id').primary();
    table.text('link_map').notNullable();
    table.text('alamat_cabang').notNullable();
    table.text('no_hp').notNullable(); // simpan sebagai text agar bisa diawali 0
    table.text('link_whatsapp').notNullable();
    table.timestamps(true, true);
  });

  // Tabel cara_kirim
  await knex.schema.createTable('cara_kirim', table => {
    table.increments('id').primary();
    table.text('photo_url').notNullable();
    table.text('caption').notNullable();
    table.string('kode').notNullable();
    table.timestamps(true, true);
  });

  // Tabel daftar_ongkir
  await knex.schema.createTable('daftar_ongkir', table => {
    table.increments('id').primary();
    table.decimal('ongkir', 15, 2).notNullable(); // max 15 digit, 2 desimal
    table.timestamps(true, true);
  });

  // Tabel sering_ditanyakan
  await knex.schema.createTable('sering_ditanyakan', table => {
    table.increments('id').primary();
    table.text('pertanyaan').notNullable();
    table.text('jawaban').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sering_ditanyakan');
  await knex.schema.dropTableIfExists('daftar_ongkir');
  await knex.schema.dropTableIfExists('cara_kirim');
  await knex.schema.dropTableIfExists('lokasi_kontak');
  await knex.schema.dropTableIfExists('jadwal_kirim');
  await knex.schema.dropTableIfExists('syarat_ketentuan');
};