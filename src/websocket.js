exports.setupWebsocket = (server, connection) => {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", async (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    try {
      const posts = await connection("posts").orderBy("publishedAt", "desc");

      const formattedPosts = posts.map((row) => ({
        id: row.id,
        author: {
          avatarUrl: row.avatarUrl,
          name: row.authorName,
          role: row.authorRole,
        },
        content: JSON.parse(row.content),
        publishedAt: new Date(row.publishedAt),
      }));

      socket.emit("listaPosts", formattedPosts);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
    }

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
};
