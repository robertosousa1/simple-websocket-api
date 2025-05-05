const { faker } = require("@faker-js/faker");

exports.seed = async function (knex) {
  await knex("posts").del();

  const fixedPost = {
    avatarUrl: "https://github.com/FIAP.png",
    authorName: "FIAP",
    authorRole: "Faculdade de Informática e Administração Paulista",
    content: JSON.stringify([
      {
        type: "paragraph",
        content:
          "Na aula de hoje falaremos sobre a evolução da Web e o ecossistema Front-end.",
      },
      {
        type: "link",
        content: "https://github.com/FIAP",
      },
    ]),
    publishedAt: new Date("2025-04-07T22:10:00.000Z").toISOString(),
  };

  const fakePosts = Array.from({ length: 9 }).map(() => ({
    avatarUrl: `https://github.com/${faker.internet.username()}.png`,
    authorName: faker.person.fullName(),
    authorRole: faker.person.jobTitle(),
    content: JSON.stringify([
      { type: "paragraph", content: faker.lorem.paragraph() },
      { type: "link", content: faker.internet.url() },
    ]),
    publishedAt: faker.date.recent({ days: 30 }).toISOString(),
  }));

  await knex("posts").insert([fixedPost, ...fakePosts]);
};
