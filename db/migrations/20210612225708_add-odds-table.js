export function up(knex) {
  return knex.schema.createTable("odds", function (table) {
    table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
    table.float("home_win").notNullable();
    table.float("draw").notNullable();
    table.float("away_win").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTable("odds");
}
