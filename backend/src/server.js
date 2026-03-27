require("dotenv").config();
const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");
const { initSocket } = require("./config/socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🛡️  SecureDash backend running on port ${PORT}`);
    console.log(`📖  API docs: http://localhost:${PORT}/api-docs`);
  });
});
