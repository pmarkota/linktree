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
      return next();
    }

    // Check if user exists in registry
    const userExists = Object.entries(userRegistry).some(([_, data]) => data.subdomain === subdomain);
    
    if (!userExists) {
      // Redirect to main domain if user doesn't exist
      return res.redirect('https://tamilfreelancer.rest');
    }

    // Set username if subdomain matches a user's subdomain
    for (const [username, data] of Object.entries(userRegistry)) {
      if (data.subdomain === subdomain) {
        req.username = data.name;
        break;
      }
    }
    return next();
  }

  // Development environment handling
  if (process.env.NODE_ENV === "development") {
    if (host.includes("localhost") || host.includes("ngrok")) {
      const subdomain = req.path.split("/")[1];
      const userEntry = Object.entries(userRegistry).find(([_, data]) => data.subdomain.split('-')[0] === subdomain);
      req.username = userEntry ? userEntry[1].name : null;
      return next();
    }
  }

  next();
};
