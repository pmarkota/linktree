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

      console.log("Searching for subdomain in database:", subdomain);
      const user = await userRegistry.findBySubdomain(subdomain);
      console.log("Database response for subdomain:", user);

      if (!user) {
        console.log("No user found for subdomain, redirecting to main site");
        return res.redirect("https://tamilfreelancer.rest");
      }

      req.username = user.name;
      console.log("Setting username:", req.username);
      next();
      return;
    }

    next();
  } catch (error) {
    console.error("Subdomain processing error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    next(error);
  }
};
