const userRegistry = require("../data/userRegistry");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host;
    console.log("Original host:", host);

    if (host.includes("tamilfreelancer.rest")) {
      const subdomain = host.split(".")[0];
      console.log("Checking subdomain:", subdomain);

      if (subdomain === "www" || subdomain === "tamilfreelancer") {
        req.username = null;
        console.log("Main domain detected");
        return next();
      }

      const user = await userRegistry.findBySubdomain(subdomain);
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
  } catch (error) {
    console.error("Subdomain processing error:", error);
    next(error);
  }
};
