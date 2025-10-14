exports.up = function (knex) {
    return knex.schema.alterTable("users", (table) => {
        table.string("cabang")
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("cabang")
    });
};