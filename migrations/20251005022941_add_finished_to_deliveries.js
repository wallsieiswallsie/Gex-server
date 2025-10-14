exports.up = function (knex) {
    return knex.schema.alterTable("deliveries", function(table) {
        table
        .boolean("finished")
        .notNullable()
        .defaultTo(false)
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("deliveries", function(table){
        table.dropColumn("finished");
    });
};