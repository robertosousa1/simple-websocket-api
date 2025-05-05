exports.up = async function (knex) {
  await knex.schema.createTable("posts", (table) => {
    table.increments("id").primary();
    table.string("avatarUrl").notNullable();
    table.string("authorName").notNullable();
    table.string("authorRole").notNullable();
    table.text("content").notNullable();
    table.string("publishedAt").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("posts");
};
