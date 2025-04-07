const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");

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
const db = new sqlite3.Database("alunos.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    sobrenome TEXT,
    turma TEXT NOT NULL
  )`);
});

// Função auxiliar para validação
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Rota para inserir alunos
app.post("/aluno", (req, res) => {
  if (!req.body) {
    return res.status(400).json({ erro: "A requisição não possui corpo" });
  }

  const { nome, sobrenome, turma } = req.body;

  // Validações de tipo e obrigatoriedade
  if (!isNonEmptyString(nome)) {
    return res
      .status(400)
      .json({ erro: '"nome" é obrigatório e deve ser uma string não vazia.' });
  }

  if (!isNonEmptyString(turma)) {
    return res
      .status(400)
      .json({ erro: '"turma" é obrigatória e deve ser uma string não vazia.' });
  }

  if (sobrenome !== undefined && typeof sobrenome !== "string") {
    return res
      .status(400)
      .json({ erro: '"sobrenome", se fornecido, deve ser uma string.' });
  }

  db.run(
    "INSERT INTO alunos (nome, sobrenome, turma) VALUES (?, ?, ?)",
    [nome.trim(), sobrenome?.trim() || null, turma.trim()],
    function (err) {
      if (err) return res.status(500).json({ erro: err.message });

      const novoAluno = {
        id: this.lastID,
        nome: nome.trim(),
        sobrenome: sobrenome?.trim() || null,
        turma: turma.trim(),
      };
      io.emit("novoAluno", novoAluno);

      return res.status(201).json(novoAluno);
    }
  );
});

// Rota para buscar aluno por ID
app.get("/aluno/:id", (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).json({ erro: "O ID deve ser um número válido." });
  }

  db.get("SELECT * FROM alunos WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ erro: err.message });
    if (!row) return res.status(404).json({ erro: "Aluno não encontrado" });

    return res.status(200).json(row);
  });
});

// Evento socket
io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  // Envia lista atual de alunos no momento da conexão
  db.all("SELECT * FROM alunos", (err, rows) => {
    if (!err) {
      socket.emit("listaAlunos", rows);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
