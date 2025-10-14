exports.up = function (knex) {
    return knex.schema.alterTable("deliveries", function(table) {
        table
        .boolean("active")
        .defaultTo("false")
        .notNullable()
    });
};

exports.down = function (knex) {
    return knex.shema.alterTable("active", function(table) {
        table.dropColumn("active")
    });
};