const userRegistry = require("../data/userRegistry");
const crypto = require("crypto");

exports.handleSubdomain = (req, res) => {
  if (req.username) {
    const username = req.userData?.username || "user";
    if (req.isCustomDomain) {
      res.send(`Hey ${username}! This is your custom domain site.`);
    } else {
      res.send(`Hey ${username}! This is your subdomain site.`);
    }
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
    try {
      const existingUser = await userRegistry.findByUsername(username);
      if (existingUser) {
        console.log("Username already exists:", username);
        return res.status(409).json({
          error: "Username already taken",
          existingSubdomain: `https://${existingUser.subdomain}.tamilfreelancer.rest`,
        });
      }
    } catch (error) {
      if (error.code !== "PGRST116") {
        // Not found error is okay here
        throw error;
      }
    }

    // Generate random subdomain suffix
    const randomSuffix = crypto
      .randomBytes(7)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 7)
      .toLowerCase();

    const subdomain = `${username.toLowerCase()}-${randomSuffix}`;

    // Create user in database
    const user = await userRegistry.create(username, name, subdomain);
    console.log("Created user:", user);

    // Verify the user was created by fetching it back
    const verifyUser = await userRegistry.findBySubdomain(subdomain);
    console.log("Verification of created user:", verifyUser);

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
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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

exports.addCustomDomain = async (req, res) => {
  try {
    const { username, customDomain } = req.body;
    console.log("Adding custom domain:", { username, customDomain });

    if (!username || !customDomain) {
      return res.status(400).json({
        error: "Username and custom domain are required",
      });
    }

    // First check if user exists
    const existingUser = await userRegistry.findByUsername(username);
    if (!existingUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check if domain is already in use
    const existingDomain = await userRegistry.findByCustomDomain(customDomain);
    if (existingDomain) {
      return res.status(409).json({
        error: "Domain is already in use",
      });
    }

    console.log("Adding domain for user:", existingUser);
    const user = await userRegistry.addCustomDomain(username, customDomain);
    console.log("Domain added successfully:", user);

    res.status(200).json({
      message: "Custom domain added successfully",
      verificationInstructions: {
        token: user.domain_verification_token,
        dnsRecord: {
          type: "TXT",
          name: `_verify.${customDomain}`,
          value: user.domain_verification_token,
        },
        cnameRecord: {
          type: "CNAME",
          name: customDomain,
          value: "cname.vercel-dns.com",
        },
      },
    });
  } catch (error) {
    console.error("Add custom domain error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.verifyDomain = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userRegistry.verifyDomain(username);

    res.status(200).json({
      message: "Domain verified successfully",
      domain: user.custom_domain,
      status: user.domain_verification_status,
    });
  } catch (error) {
    console.error("Verify domain error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getCustomDomain = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userRegistry.findByUsername(username);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({
      username: user.username,
      customDomain: user.custom_domain,
      verificationStatus: user.domain_verification_status,
    });
  } catch (error) {
    console.error("Get custom domain error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
