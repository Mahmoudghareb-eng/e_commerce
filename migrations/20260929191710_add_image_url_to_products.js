exports.up = function (knex) {
    return knex.schema.table("products", function (table) {
        table.string("image_url").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("products", function (table) {
        table.dropColumn("image_url");
    });
};