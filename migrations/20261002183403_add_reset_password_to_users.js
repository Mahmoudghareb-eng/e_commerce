exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.string("reset_code");
    table.timestamp("reset_code_expires_at");
    table.integer("reset_attempts").defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("reset_code");
    table.dropColumn("reset_code_expires_at");
    table.dropColumn("reset_attempts");
  });
};