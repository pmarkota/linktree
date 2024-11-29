const express = require('express');
const router = express.Router();
const userRegistry = require("../data/userRegistry");
const crypto = require('crypto');

// Function to generate random string
const generateRandomString = (length = 7) => {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, length);
};

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

    // Generate random subdomain suffix
    const randomSuffix = generateRandomString();
    const subdomain = `${username}-${randomSuffix}`;

    // Add to registry with new structure
    userRegistry[username] = {
      name: name,
      subdomain: subdomain
    };

    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction 
      ? 'tamilfreelancer.rest'
      : 'mini.local:3000';
    
    const protocol = isProduction ? 'https' : 'http';
    const subdomainUrl = `${protocol}://${subdomain}.${domain}`;

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