const userRegistry = require("../data/userRegistry");

module.exports = (req, res, next) => {
  const host = req.headers.host;
  console.log("Original host:", host);

  if (host.includes("tamilfreelancer.rest")) {
    const subdomain = host.split(".")[0];

    // Don't treat www or main domain as a subdomain
    if (subdomain === "www" || subdomain === "tamilfreelancer") {
      req.username = null;
      return next();
    }

    // Find user by subdomain
    const user = Object.values(userRegistry).find(
      userData => userData.subdomain === subdomain
    );

    if (!user) {
      return res.redirect("https://tamilfreelancer.rest");
    }

    req.username = user.name;
    return next();
  }

  // Development environment handling
  if (process.env.NODE_ENV === "development") {
    if (host.includes("localhost") || host.includes("ngrok")) {
      const subdomain = req.path.split("/")[1];
      if (subdomain) {
        const user = Object.values(userRegistry).find(
          userData => userData.subdomain.split('-')[0] === subdomain
        );
        req.username = user ? user.name : null;
      }
      return next();
    }
  }

  next();
};


