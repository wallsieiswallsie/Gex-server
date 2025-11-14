exports.up = async function (knex) {
  await knex.raw(`ALTER TYPE via_enum ADD VALUE IF NOT EXISTS 'Bermasalah';`);
};

exports.down = async function () {
  // PostgreSQL tidak mendukung DROP VALUE pada ENUM.
  console.warn("Rollback ENUM tidak didukung. Jika butuh rollback, harus recreate enum.");
};