const db = require("../config/database");

function createPost(post, callback) {
  db.run(
    `INSERT INTO posts (avatarUrl, authorName, authorRole, content, publishedAt) VALUES (?, ?, ?, ?, ?)`,
    [
      post.author.avatarUrl,
      post.author.name,
      post.author.role,
      JSON.stringify(post.content),
      new Date(post.publishedAt).toISOString(),
    ],
    function (err) {
      callback(err, this?.lastID);
    }
  );
}

function getPostById(id, callback) {
  db.get("SELECT * FROM posts WHERE id = ?", [id], callback);
}

function deletePost(id, callback) {
  db.run("DELETE FROM posts WHERE id = ?", [id], function (err) {
    callback(err, this?.changes);
  });
}

function getAllPosts(callback) {
  db.all("SELECT * FROM posts ORDER BY publishedAt DESC", callback);
}

module.exports = { createPost, getPostById, deletePost, getAllPosts };
