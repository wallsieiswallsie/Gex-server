exports.up = function (knex) {
    return knex.schema.createTable("archive_packages", function(table){
        table.increments("id").primary();
        table
        .integer("package_id")
        .references("id")
        .inTable("packages")
        .notNullable();
        table
        .boolean("delivery")
        .default(false)
        .notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("archive_packages");
};