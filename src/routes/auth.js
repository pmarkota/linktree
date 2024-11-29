const express = require("express");
const router = express.Router();
const subdomainController = require("../controllers/subdomainController");

// Use the registration handler from subdomainController
router.post("/register", express.json(), subdomainController.registerUser);

module.exports = router;
