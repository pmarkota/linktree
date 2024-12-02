const userRegistry = require("../data/userRegistry");
const crypto = require("crypto");

exports.handleSubdomain = (req, res) => {
  if (req.username) {
    res.send(`Welcome to the site for user: ${req.username}`);
  } else {
    res.send("Welcome to the main site!");
  }
};

exports.registerUser = async (req, res) => {
  try {
    console.log("Registration request body:", req.body);
    const { username, name } = req.body;

    if (!username || !name) {
      return res.status(400).json({
        error: "Username and name are required",
      });
    }

    // Check if username already exists
    const existingUser = await userRegistry.findByUsername(username);
    if (existingUser) {
      console.log("Username already exists:", username);
      return res.status(409).json({
        error: "Username already taken",
        existingSubdomain: `https://${existingUser.subdomain}.tamilfreelancer.rest`,
      });
    }

    // Generate random subdomain suffix
    const randomSuffix = crypto
      .randomBytes(7)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 7);

    const subdomain = `${username}-${randomSuffix}`;

    // Create user in database
    const user = await userRegistry.create(username, name, subdomain);

    const isProduction = process.env.NODE_ENV === "production";
    const domain = isProduction ? "tamilfreelancer.rest" : "mini.local:3000";
    const protocol = isProduction ? "https" : "http";
    const subdomainUrl = `${protocol}://${subdomain}.${domain}`;

    res.status(201).json({
      message: "Registration successful",
      subdomain: subdomainUrl,
      username,
      name,
      subdomainId: subdomain,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to get user's subdomain

exports.getUserSubdomain = (req, res) => {
  const { username } = req.params;

  if (!userRegistry[username]) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  const isProduction = process.env.NODE_ENV === "production";

  const domain = isProduction ? "tamilfreelancer.rest" : "mini.local:3000";

  const protocol = isProduction ? "https" : "http";

  const subdomainUrl = `${protocol}://${userRegistry[username].subdomain}.${domain}`;

  res.json({
    username,

    name: userRegistry[username].name,

    subdomain: subdomainUrl,

    subdomainId: userRegistry[username].subdomain,
  });
};
