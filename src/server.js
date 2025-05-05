const express = require("express");
const cors = require("cors");
const http = require("http");

const routes = require("./routes");
const { setupWebsocket } = require("./websocket");
const connection = require("./database/connection");

const app = express();
const server = http.createServer(app);

setupWebsocket(server, connection);

app.use(cors());
app.use(express.json());
app.use(routes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
