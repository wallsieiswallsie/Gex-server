exports.up = function (knex) {
    return knex.schema.alterTable("invoices", (table) => {
        table.string("payment_method")
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("invoices", (table) => {
        table.dropColumn("payment_method")
    });
};