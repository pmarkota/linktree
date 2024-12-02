const supabase = require("../config/supabase");

const userRegistry = {
  async findByUsername(username) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("username", username)
        .single();

      if (error) {
        console.error("findByUsername error:", error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error("findByUsername catch:", error);
      throw error;
    }
  },

  async findBySubdomain(subdomain) {
    try {
      console.log("Finding subdomain in database:", subdomain);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      console.log("Supabase response:", { data, error });

      if (error) {
        if (error.code === "PGRST116") {
          // No data found
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
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username,
            name,
            subdomain,
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
};

module.exports = userRegistry;
