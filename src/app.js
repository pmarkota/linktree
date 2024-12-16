const express = require("express");

const extractSubdomain = require("./middleware/extractSubdomain");

const subdomainRoutes = require("./routes/subdomainRoutes");

const authRoutes = require("./routes/auth");

const otpRoutes = require("./routes/otpRoutes");

const app = express();

// Add body-parser middleware

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Add debug middleware to log all requests

app.use((req, res, next) => {
  console.log("Request:", {
    method: req.method,

    url: req.url,

    host: req.headers.host,

    body: req.body,
  });

  next();
});

app.use((req, res, next) => {
  Promise.resolve(extractSubdomain(req, res, next)).catch(next);
});

app.use("/api", authRoutes);

app.use("/api", otpRoutes);

app.use("/", subdomainRoutes);

// Error handling middleware (add this at the end)

app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
