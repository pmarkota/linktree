const userRegistry = require("../data/userRegistry");

module.exports = (req, res, next) => {
  const host = req.headers.host;
  console.log("Original host:", host);

  if (host.includes("tamilfreelancer.rest")) {
    const subdomain = host.split(".")[0];
    console.log("Checking subdomain:", subdomain); // Debug log

    // Don't treat www or main domain as a subdomain
    if (subdomain === "www" || subdomain === "tamilfreelancer") {
      req.username = null;
      return next();
    }

    // Find user by exact subdomain match
    const user = Object.values(userRegistry).find(
      userData => userData.subdomain === subdomain
    );
    
    console.log("Found user:", user); // Debug log
    console.log("Current registry:", userRegistry); // Debug log

    if (!user) {
      console.log("No user found for subdomain:", subdomain); // Debug log
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
          userData => userData.subdomain === subdomain
        );
        req.username = user ? user.name : null;
      }
      return next();
    }
  }

  next();
};






