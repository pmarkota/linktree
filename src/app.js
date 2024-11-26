const express = require("express");
const extractSubdomain = require("./middleware/extractSubdomain");
const subdomainRoutes = require("./routes/subdomainRoutes");

const app = express();

app.use(extractSubdomain);
app.use("/", subdomainRoutes);

module.exports = app;
