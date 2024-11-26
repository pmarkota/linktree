const userRegistry = require("../data/userRegistry");

module.exports = (req, res, next) => {
  const host = req.headers.host;
  console.log("Original host:", host);

  // Special handling for development environment
  if (process.env.NODE_ENV === "development") {
    // Handle localhost testing
    if (host.includes("localhost") || host.includes("ngrok")) {
      // For both localhost and ngrok, use path-based routing
      const subdomain = req.path.split("/")[1];
      req.username = subdomain ? userRegistry[subdomain] : null;
      return next();
    }
  }

  // Production subdomain handling
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");
  const subdomain = parts[0];

  if (subdomain === "mini") {
    req.username = null;
  } else {
    req.username = userRegistry[subdomain];
  }

  next();
};
