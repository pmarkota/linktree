const userRegistry = require("../data/userRegistry");

module.exports = (req, res, next) => {
  const host = req.headers.host;
  console.log("Original host:", host);

  // Handle production domain
  if (host.includes('tamilfreelancer.rest')) {
    const subdomain = host.split('.')[0];
    // Don't treat www or main domain as a subdomain
    if (subdomain === 'www' || subdomain === 'tamilfreelancer') {
      req.username = null;
    } else {
      req.username = userRegistry[subdomain];
    }
    return next();
  }

  // Development environment handling
  if (process.env.NODE_ENV === "development") {
    if (host.includes("localhost") || host.includes("ngrok")) {
      const subdomain = req.path.split("/")[1];
      req.username = subdomain ? userRegistry[subdomain] : null;
      return next();
    }
  }

  // Default handling
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");
  const subdomain = parts[0];

  req.username = userRegistry[subdomain] || null;
  next();
};
