exports.up = async function (knex) {
  // PostgreSQL: menambahkan nilai baru ke enum role
  await knex.raw(`ALTER TYPE "users_role_enum" ADD VALUE 'Customer'`);
};

exports.down = async function (knex) {
  // PostgreSQL tidak mendukung DROP VALUE untuk enum.
  // Bisa dikosongkan atau ditinggalkan komentar.
  // Jika ingin revert, perlu membuat enum baru dan migrasi ulang (complex).
};