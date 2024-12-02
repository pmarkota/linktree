const supabase = require("../config/supabase");

const userRegistry = {
  async findByUsername(username) {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("username", username)
      .single();

    if (error) throw error;
    return data;
  },

  async findBySubdomain(subdomain) {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("subdomain", subdomain)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async create(username, name, subdomain) {
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, name, subdomain }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

module.exports = userRegistry;
