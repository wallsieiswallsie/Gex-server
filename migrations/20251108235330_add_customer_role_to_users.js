exports.up = async function (knex) {
  // 1. Drop constraint lama
  await knex.raw(`
    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check";
  `);

  // 2. Tambahkan constraint baru dengan nilai Customer
  await knex.raw(`
    ALTER TABLE "users"
    ADD CONSTRAINT "users_role_check"
    CHECK (role IN (
      'Manager Main Warehouse',
      'Manager Destination Warehouse',
      'Staff Main Warehouse',
      'Staff Destination Warehouse',
      'Courier',
      'Customer'
    ));
  `);
};

exports.down = async function (knex) {
  // Kembalikan constraint lama (opsional)
  await knex.raw(`
    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check";
  `);

  await knex.raw(`
    ALTER TABLE "users"
    ADD CONSTRAINT "users_role_check"
    CHECK (role IN (
      'Manager Main Warehouse',
      'Manager Destination Warehouse',
      'Staff Main Warehouse',
      'Staff Destination Warehouse',
      'Courier'
    ));
  `);
};