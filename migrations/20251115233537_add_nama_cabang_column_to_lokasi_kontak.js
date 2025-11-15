exports.up = async function (knex) {
  return knex.schema.table("lokasi_kontak", (table) => {
    table.text("nama_cabang").notNullable();
  });
};

exports.down = async function (knex) {
  return knex.schema.table("lokasi_kontak", (table) => {
    table.dropColumn("nama_cabang");
  });
};