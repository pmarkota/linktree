const express = require('express');
const router = express.Router();
const userRegistry = require("../data/userRegistry");

router.post('/register', express.json(), async (req, res) => {
  try {
    const { username, name } = req.body;
    
    // Basic validation
    if (!username || !name) {
      return res.status(400).json({ 
        error: "Username and name are required" 
      });
    }

    // Check if username already exists
    if (userRegistry[username]) {
      return res.status(409).json({ 
        error: "Username already taken" 
      });
    }

    // Add to registry
    userRegistry[username] = name;

    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction 
      ? 'tamilfreelancer.rest'
      : 'mini.local:3000';
    
    const protocol = isProduction ? 'https' : 'http';
    const subdomainUrl = `${protocol}://${username}.${domain}`;

    res.status(201).json({
      message: "Registration successful",
      subdomain: subdomainUrl,
      username,
      name
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

module.exports = router; 