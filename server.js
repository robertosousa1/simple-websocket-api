const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const { z } = require("zod");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(bodyParser.json());

// Banco de dados SQLite
const db = new sqlite3.Database("posts.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    avatarUrl TEXT NOT NULL,
    authorName TEXT NOT NULL,
    authorRole TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON string
    publishedAt TEXT NOT NULL
  )`);
});

// 📌 Esquema de validação com Zod
const contentSchema = z.array(
  z.object({
    type: z.enum(["paragraph", "link"]),
    content: z.string().min(1, "O conteúdo do item não pode ser vazio"),
  })
);

const postSchema = z.object({
  author: z.object({
    name: z.string().min(1, "Nome do autor é obrigatório"),
    role: z.string().min(1, "Função do autor é obrigatória"),
    avatarUrl: z.string().url("Avatar precisa ser uma URL válida"),
  }),
  content: contentSchema.min(1, "O post precisa ter conteúdo"),
  publishedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data inválida",
  }),
});

// Criar novo post
app.post("/post", (req, res) => {
  const parseResult = postSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: "Erro de validação",
      detalhes: parseResult.error.errors,
    });
  }

  const { author, content, publishedAt } = parseResult.data;

  db.run(
    `INSERT INTO posts (avatarUrl, authorName, authorRole, content, publishedAt) VALUES (?, ?, ?, ?, ?)`,
    [
      author.avatarUrl,
      author.name,
      author.role,
      JSON.stringify(content),
      new Date(publishedAt).toISOString(),
    ],
    function (err) {
      if (err) return res.status(500).json({ erro: err.message });

      const novoPost = {
        id: this.lastID,
        author,
        content,
        publishedAt,
      };

      io.emit("novoPost", novoPost);
      return res.status(201).json(novoPost);
    }
  );
});

// Buscar post por ID
app.get("/post/:id", (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).json({ erro: "O ID deve ser um número válido." });
  }

  db.get("SELECT * FROM posts WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!row) return res.status(404).json({ erro: "Post não encontrado" });

    const post = {
      id: row.id,
      author: {
        avatarUrl: row.avatarUrl,
        name: row.authorName,
        role: row.authorRole,
      },
      content: JSON.parse(row.content),
      publishedAt: new Date(row.publishedAt),
    };

    return res.status(200).json(post);
  });
});

// 🚨 Nova rota DELETE
app.delete("/post/:id", (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).json({ erro: "O ID deve ser um número válido." });
  }

  db.run("DELETE FROM posts WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ erro: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ erro: "Post não encontrado" });
    }

    io.emit("postRemovido", parseInt(id));
    return res.status(200).json({ mensagem: "Post removido com sucesso" });
  });
});

// Evento Socket.IO
io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  db.all("SELECT * FROM posts ORDER BY publishedAt DESC", (err, rows) => {
    if (!err) {
      const posts = rows.map((row) => ({
        id: row.id,
        author: {
          avatarUrl: row.avatarUrl,
          name: row.authorName,
          role: row.authorRole,
        },
        content: JSON.parse(row.content),
        publishedAt: new Date(row.publishedAt),
      }));

      socket.emit("listaPosts", posts);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
