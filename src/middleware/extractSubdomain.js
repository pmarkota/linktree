const userRegistry = require("../data/userRegistry");

module.exports = (req, res, next) => {
  const host = req.headers.host;
  console.log("Original host:", host);
  console.log("Current userRegistry:", JSON.stringify(userRegistry, null, 2));

  if (host.includes("tamilfreelancer.rest")) {
    const subdomain = host.split(".")[0];
    console.log("Checking subdomain:", subdomain);

    // Don't treat www or main domain as a subdomain
    if (subdomain === "www" || subdomain === "tamilfreelancer") {
      req.username = null;
      console.log("Main domain detected");
      return next();
    }

    // Find user by exact subdomain match
    const user = Object.values(userRegistry).find(
      userData => userData.subdomain === subdomain
    );
    
    console.log("Found user for subdomain:", user);

    if (!user) {
      console.log("No user found for subdomain, redirecting to main site");
      return res.redirect("https://tamilfreelancer.rest");
    }

    req.username = user.name;
    console.log("Setting username:", req.username);
    return next();
  }

  next();
};
