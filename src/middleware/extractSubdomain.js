const userRegistry = require("../data/userRegistry");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host.toLowerCase();
    console.log("Original host:", host);

    // Check for custom domain first
    const customDomainUser = await userRegistry.findByCustomDomain(host);
    if (customDomainUser) {
      console.log("Found user by custom domain:", customDomainUser);
      req.username = customDomainUser.name;
      req.isCustomDomain = true;
      req.userData = customDomainUser;
      return next();
    }

    // Then check for subdomains on main domain
    if (host.includes("tamilfreelancer.rest")) {
      const subdomain = host.split(".")[0].toLowerCase();
      console.log("Checking subdomain:", subdomain);

      if (subdomain === "www" || subdomain === "tamilfreelancer") {
        req.username = null;
        console.log("Main domain detected");
        return next();
      }

      const user = await userRegistry.findBySubdomain(subdomain);
      console.log("Database response for subdomain:", user);

      if (!user) {
        console.log("No user found for subdomain, redirecting to main site");
        return res.redirect("https://tamilfreelancer.rest");
      }

      req.username = user.name;
      req.userData = user;
      console.log("Setting username:", req.username);
      next();
      return;
    }

    next();
  } catch (error) {
    console.error("Domain processing error:", error);
    next(error);
  }
};
