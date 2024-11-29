const express = require("express");

const extractSubdomain = require("./middleware/extractSubdomain");

const subdomainRoutes = require("./routes/subdomainRoutes");

const authRoutes = require("./routes/auth");



const app = express();



app.use(extractSubdomain);

app.use("/api", authRoutes);

app.use("/", subdomainRoutes);



// Error handling middleware (add this at the end)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});



module.exports = app;


