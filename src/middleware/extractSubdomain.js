const userRegistry = require("../data/userRegistry");

module.exports = async (req, res, next) => {
  try {
    const host = req.headers.host;
    console.log("Original host:", host);

    if (host.includes("tamilfreelancer.rest")) {
      const subdomain = host.split(".")[0];

      if (subdomain === "www" || subdomain === "tamilfreelancer") {
        req.username = null;
        return next();
      }

      const user = await userRegistry.getBySubdomain(subdomain);
      
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
          const user = await userRegistry.getBySubdomain(subdomain);
          req.username = user ? user.name : null;
        }
        return next();
      }
    }

    next();
  } catch (error) {
    console.error('Subdomain processing error:', error);
    next(error);
  }
};
