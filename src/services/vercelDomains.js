const vercelService = {
  async addDomain(domain) {
    try {
      console.log("Adding domain to Vercel:", domain);

      // Add the domain to project
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: domain }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to add domain: ${error.message}`);
      }

      // Add www subdomain
      const wwwResponse = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: `www.${domain}` }),
        }
      );

      if (!wwwResponse.ok) {
        const error = await wwwResponse.json();
        throw new Error(`Failed to add www subdomain: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Vercel domain addition error:", error);
      throw error;
    }
  },

  async removeDomain(domain) {
    try {
      console.log("Removing domain from Vercel:", domain);

      // Remove main domain
      const response = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to remove domain: ${error.message}`);
      }

      // Remove www subdomain
      const wwwResponse = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/www.${domain}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          },
        }
      );

      if (!wwwResponse.ok) {
        const error = await wwwResponse.json();
        throw new Error(`Failed to remove www subdomain: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Vercel domain removal error:", error);
      throw error;
    }
  },
};

module.exports = vercelService;
