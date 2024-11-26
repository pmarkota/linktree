const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// Create and start the server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://mini.local:${PORT}`);
});
