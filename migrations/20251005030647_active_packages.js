exports.up = function (knex) {
    return knex.schema.createTable("active_packages", function(table) {
        table.increments("id").primary();
        table
        .integer("package_id")
        .notNullable()
        .references("id")
        .inTable("packages");
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("active_packages");
};