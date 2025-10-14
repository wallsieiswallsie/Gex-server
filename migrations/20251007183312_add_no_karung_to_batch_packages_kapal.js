exports.up = function (knex) {
    return knex.schema.alterTable("batch_packages", (table) => {
        table.string("no_karung").nullable()
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("batch_packages", (table) => {
        table.dropColumn("no_karung")
    });
};