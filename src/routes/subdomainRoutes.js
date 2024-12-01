const express = require("express");

const router = express.Router();

const subdomainController = require("../controllers/subdomainController");

// Route for handling subdomains

router.get("/", subdomainController.handleSubdomain);

// Route for registering a user and creating subdomains

router.post("/register", express.json(), subdomainController.registerUser);

// New route to get user's subdomain

router.get("/user/:username/subdomain", subdomainController.getUserSubdomain);

// New custom domain routes

router.post(
  "/api/domains",
  express.json(),
  subdomainController.addCustomDomain
);
router.get("/api/domains/:username", subdomainController.getCustomDomain);
router.post("/api/domains/:username/verify", subdomainController.verifyDomain);

module.exports = router;
