const http = require("http");

const app = require("./app");



const PORT = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === 'production';

const domain = isProduction ? 'tamilfreelancer.rest' : 'mini.local';



// Create and start the server

const server = http.createServer(app);



server.listen(PORT, () => {

  console.log(`Server running on ${isProduction ? 'https' : 'http'}://${domain}:${PORT}`);

});



module.exports = app;


