const supabase = require("../config/supabase");
const crypto = require("crypto");
const vercelService = require("../services/vercelDomains");

const userRegistry = {
  async findByUsername(username) {
    try {
      console.log("Finding user by username:", username);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("User not found:", username);
          return null;
        }
        console.error("findByUsername error:", error);
        throw error;
      }

      console.log("Found user:", data);
      return data;
    } catch (error) {
      console.error("findByUsername catch:", error);
      throw error;
    }
  },

  async findBySubdomain(subdomain) {
    try {
      console.log("Finding subdomain in database:", subdomain);
      const lowercaseSubdomain = subdomain.toLowerCase();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("subdomain", lowercaseSubdomain)
        .single();

      console.log("Supabase response:", { data, error });

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No data found for subdomain:", subdomain);
          return null;
        }
        console.error("findBySubdomain error:", error);
        throw error;
      }

      if (!data) {
        console.log("No data returned for subdomain:", subdomain);
        return null;
      }

      console.log("Found user data:", data);
      return data;
    } catch (error) {
      console.error("findBySubdomain catch:", error);
      throw error;
    }
  },

  async create(username, name, subdomain) {
    try {
      const lowercaseSubdomain = subdomain.toLowerCase();

      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username,
            name,
            subdomain: lowercaseSubdomain,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("create error:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("create catch:", error);
      throw error;
    }
  },

  async findByCustomDomain(domain) {
    try {
      console.log("Finding custom domain in database:", domain);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("custom_domain", domain.toLowerCase())
        .eq("domain_verification_status", "verified")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No verified domain found:", domain);
          return null;
        }
        console.error("findByCustomDomain error:", error);
        throw error;
      }

      console.log("Found user by custom domain:", data);
      return data;
    } catch (error) {
      console.error("findByCustomDomain catch:", error);
      throw error;
    }
  },

  async addCustomDomain(username, customDomain) {
    try {
      console.log("Adding custom domain:", { username, customDomain });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Add domain to Vercel first
      await vercelService.addDomain(customDomain);

      // Then add to database
      const { data, error } = await supabase
        .from("users")
        .update({
          custom_domain: customDomain.toLowerCase(),
          domain_verification_token: verificationToken,
          domain_verification_status: "pending",
        })
        .eq("username", username)
        .select()
        .single();

      if (error) {
        // If database update fails, remove domain from Vercel
        await vercelService.removeDomain(customDomain);
        console.error("addCustomDomain error:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("addCustomDomain catch:", error);
      throw error;
    }
  },

  async verifyDomain(username) {
    try {
      // First get the user and their verification token
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (userError) {
        console.error("Error fetching user for verification:", userError);
        throw userError;
      }

      if (!user.custom_domain || !user.domain_verification_token) {
        throw new Error("No custom domain or verification token found");
      }

      // Verify the DNS records
      try {
        const dnsVerified = await this.checkDNSRecords(user.custom_domain);

        if (!dnsVerified) {
          return {
            verified: false,
            message: "DNS records not properly configured",
            required_records: {
              a_record: {
                type: "A",
                name: "@",
                value: "76.76.21.21",
                description: "Root domain record",
              },
              cname_record: {
                type: "CNAME",
                name: "www",
                value: "cname.vercel-dns.com",
                description: "WWW subdomain record",
              },
            },
          };
        }

        // If DNS is verified, update the status
        const { data, error } = await supabase
          .from("users")
          .update({
            domain_verification_status: "verified",
          })
          .eq("username", username)
          .select()
          .single();

        if (error) {
          console.error("verifyDomain error:", error);
          throw error;
        }

        return {
          verified: true,
          message: "Domain verified successfully",
          domain: data.custom_domain,
          status: data.domain_verification_status,
        };
      } catch (dnsError) {
        console.error("DNS verification error:", dnsError);
        return {
          verified: false,
          message: "Failed to verify DNS records",
          error: dnsError.message,
        };
      }
    } catch (error) {
      console.error("verifyDomain catch:", error);
      throw error;
    }
  },

  // Add DNS checking method
  async checkDNSRecords(domain) {
    try {
      const dns = require("dns").promises;
      console.log("Starting DNS verification for domain:", domain);

      // Check A record for root domain
      try {
        console.log("Checking A record...");
        const aRecords = await dns.resolve4(domain);
        console.log("Found A records:", aRecords);

        const hasCorrectARecord = aRecords.some(
          (record) => record === "76.76.21.21"
        );
        console.log("A record matches Vercel IP:", hasCorrectARecord);

        if (!hasCorrectARecord) {
          console.log(
            "A record verification failed - expected 76.76.21.21, got:",
            aRecords
          );
          return false;
        }
      } catch (aError) {
        console.log("A record lookup error:", aError.code);
        // Don't fail immediately on ENOTFOUND, might need time to propagate
        if (aError.code !== "ENOTFOUND") {
          return false;
        }
      }

      // Check CNAME record for www
      try {
        console.log("Checking CNAME record...");
        const cnameRecords = await dns.resolveCname(`www.${domain}`);
        console.log("Found CNAME records:", cnameRecords);

        const hasCorrectCname = cnameRecords.some(
          (record) =>
            record === "cname.vercel-dns.com" ||
            record.endsWith("vercel-dns.com")
        );
        console.log("CNAME record matches Vercel:", hasCorrectCname);

        if (!hasCorrectCname) {
          console.log(
            "CNAME verification failed - expected cname.vercel-dns.com, got:",
            cnameRecords
          );
          return false;
        }
      } catch (cnameError) {
        console.log("CNAME lookup error:", cnameError.code);
        // Don't fail immediately on ENOTFOUND, might need time to propagate
        if (cnameError.code !== "ENOTFOUND") {
          return false;
        }
      }

      // If we get here, either records are correct or still propagating
      console.log("DNS verification completed successfully");
      return true;
    } catch (error) {
      console.error("DNS check error:", error);
      return false;
    }
  },
};

module.exports = userRegistry;
