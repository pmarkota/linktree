const supabase = require("../config/supabase");
const crypto = require("crypto");

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
      console.log("Generated verification token");

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
        console.error("addCustomDomain error:", error);
        throw error;
      }

      console.log("Custom domain added successfully:", data);
      return data;
    } catch (error) {
      console.error("addCustomDomain catch:", error);
      throw error;
    }
  },

  async verifyDomain(username) {
    try {
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
      return data;
    } catch (error) {
      console.error("verifyDomain catch:", error);
      throw error;
    }
  },
};

module.exports = userRegistry;
