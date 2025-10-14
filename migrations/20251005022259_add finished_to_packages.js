exports.up = function (knex) {
    return knex.schema.alterTable("packages", function (table) {
        table.boolean("finished").notNullable().defaultTo(false);
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable("packages", function (table) {
        table.dropColumn("finished");
    });
};