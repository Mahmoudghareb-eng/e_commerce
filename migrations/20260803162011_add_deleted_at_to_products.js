exports.up = function (knex) {
  return knex.schema.alterTable("products", (table) => {
    table.timestamp("deleted_at").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("products", (table) => {
    table.dropColumn("deleted_at");
  });
};
