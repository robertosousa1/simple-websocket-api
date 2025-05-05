const connection = require("../database/connection");
const { postSchema } = require("../validators/postValidator");

const index = async (req, res) => {
  const posts = await connection("posts").orderBy("publishedAt", "desc");

  const formattedPosts = posts.map((post) => ({
    id: post.id,
    author: {
      avatarUrl: post.avatarUrl,
      name: post.authorName,
      role: post.authorRole,
    },
    content: JSON.parse(post.content),
    publishedAt: new Date(post.publishedAt),
  }));

  return res.json(formattedPosts);
};

const show = async (req, res) => {
  const { id } = req.params;

  const post = await connection("posts").where({ id }).first();

  if (!post) return res.status(404).json({ erro: "Post not found" });

  const formattedPost = {
    id: post.id,
    author: {
      avatarUrl: post.avatarUrl,
      name: post.authorName,
      role: post.authorRole,
    },
    content: JSON.parse(post.content),
    publishedAt: new Date(post.publishedAt),
  };

  return res.json(formattedPost);
};

const create = async (req, res) => {
  const postInValidation = postSchema.safeParse(req.body);

  if (!postInValidation.success) {
    return res.status(400).json(postInValidation.error.errors);
  }

  const { author, content, publishedAt } = postInValidation.data;

  const [createdId] = await connection("posts").insert({
    avatarUrl: author.avatarUrl,
    authorName: author.name,
    authorRole: author.role,
    content: JSON.stringify(content),
    publishedAt: new Date(publishedAt).toISOString(),
  });

  const postCreated = { id: createdId, author, content, publishedAt };
  return res.status(201).json(postCreated);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const postDeleted = await connection("posts").where({ id }).del();

  if (!postDeleted) return res.status(404).json({ erro: "Post not found" });

  return res.status(204).send();
};

module.exports = { index, show, create, remove };
