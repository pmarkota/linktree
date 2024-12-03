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
    res.send("Welcome to the main site!!!");
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

// Helper function for DNS instructions
const getDNSInstructions = (domain) => ({
  message: "Please configure the following DNS records:",
  records: [
    {
      type: "A",
      name: "@",
      value: "76.76.21.21",
      description: "Root domain record (points to Vercel's servers)",
      ttl: "Auto",
    },
    {
      type: "CNAME",
      name: "www",
      value: "cname.vercel-dns.com",
      description: "WWW subdomain record (for www.yourdomain.com)",
      ttl: "Auto",
    },
  ],
  notes: [
    "DNS changes can take up to 48 hours to propagate",
    "The '@' symbol represents the root domain",
    "After setting up DNS records, verify your domain",
  ],
  next_steps: {
    verify_endpoint: `/api/domains/${domain}/verify`,
    method: "POST",
    description: "Call this endpoint to verify your domain setup",
  },
});

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
      domain: customDomain,
      status: "pending",
      dns_setup: getDNSInstructions(username),
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
    const verificationResult = await userRegistry.verifyDomain(username);

    if (!verificationResult.verified) {
      return res.status(400).json({
        error: "Domain verification failed",
        details: verificationResult.message,
        dns_setup: getDNSInstructions(username),
        troubleshooting: {
          message: "Common issues:",
          checks: [
            "DNS records are correctly configured",
            "Waited for DNS propagation (can take up to 48 hours)",
            "No typos in record values",
            "Using correct record types (A for root, CNAME for www)",
          ],
        },
      });
    }

    res.status(200).json({
      message: verificationResult.message,
      domain: verificationResult.domain,
      status: verificationResult.status,
      next_steps: {
        message: "Your domain is now verified and active",
        note: "Your custom domain should now be working. If not, please wait a few minutes for the changes to take effect.",
      },
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

    const response = {
      username: user.username,
      customDomain: user.custom_domain,
      verificationStatus: user.domain_verification_status,
    };

    // If domain is pending verification, include setup instructions
    if (user.domain_verification_status === "pending") {
      response.dns_setup = getDNSInstructions(username);
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Get custom domain error:", error);
    res.status(500).json({
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.checkDNSPropagation = async (req, res) => {
  try {
    const { domain } = req.query;
    const dns = require("dns").promises;
    const results = {
      a_record: { status: "pending", value: null },
      cname_record: { status: "pending", value: null },
    };

    try {
      const aRecords = await dns.resolve4(domain);
      results.a_record = {
        status: aRecords.includes("76.76.21.21") ? "valid" : "invalid",
        value: aRecords,
        expected: "76.76.21.21",
      };
    } catch (aError) {
      results.a_record.error = aError.code;
    }

    try {
      const cnameRecords = await dns.resolveCname(`www.${domain}`);
      results.cname_record = {
        status: cnameRecords.some((r) => r.endsWith("vercel-dns.com"))
          ? "valid"
          : "invalid",
        value: cnameRecords,
        expected: "cname.vercel-dns.com",
      };
    } catch (cnameError) {
      results.cname_record.error = cnameError.code;
    }

    res.json({
      domain,
      propagation_status: results,
      message:
        "DNS records are still propagating if you see 'ENOTFOUND' errors",
      next_check: "Try verifying again in a few minutes",
    });
  } catch (error) {
    console.error("DNS propagation check error:", error);
    res.status(500).json({ error: "Failed to check DNS propagation" });
  }
};
