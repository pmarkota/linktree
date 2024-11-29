const express = require("express");
const extractSubdomain = require("./middleware/extractSubdomain");
const subdomainRoutes = require("./routes/subdomainRoutes");
const authRoutes = require("./routes/auth");

const app = express();

app.use(extractSubdomain);
app.use("/api", authRoutes);
app.use("/", subdomainRoutes);

module.exports = app;
