const userRegistry = require("../data/userRegistry");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host.toLowerCase();
    console.log("\n=== Domain Processing Start ===");
    console.log("Original host:", host);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));

    // Check for custom domain first
    console.log("Checking for custom domain...");
    const customDomainUser = await userRegistry.findByCustomDomain(host);
    console.log("Custom domain lookup result:", customDomainUser);

    if (customDomainUser) {
      console.log("Found user by custom domain:", {
        username: customDomainUser.username,
        name: customDomainUser.name,
        custom_domain: customDomainUser.custom_domain,
      });
      req.username = customDomainUser.username;
      req.isCustomDomain = true;
      req.userData = customDomainUser;
      console.log("Set request properties:", {
        username: req.username,
        isCustomDomain: req.isCustomDomain,
        userData: req.userData,
      });
      return next();
    }

    // Then check for subdomains on main domain
    if (host.includes("tamilfreelancer.rest")) {
      const subdomain = host.split(".")[0].toLowerCase();
      console.log("Checking subdomain:", subdomain);

      if (subdomain === "www" || subdomain === "tamilfreelancer") {
        req.username = null;
        console.log("Main domain detected, setting username to null");
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

    console.log("No domain matches found, proceeding with next middleware");
    console.log("=== Domain Processing End ===\n");
    next();
  } catch (error) {
    console.error("=== Domain Processing Error ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error.stack);
    console.error("=== Error End ===\n");
    next(error);
  }
};
