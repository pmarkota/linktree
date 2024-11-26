const userRegistry = require("../data/userRegistry");

exports.handleSubdomain = (req, res) => {
  if (req.username) {
    res.send(`Welcome to the site for user: ${req.username}`);
  } else {
    res.send("Welcome to the main site!");
  }
};

exports.registerUser = (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).send("Username is required");
  }

  // Generate a subdomain
  const subdomain = username.toLowerCase().replace(/\s+/g, "");

  // Save the mapping
  userRegistry[subdomain] = username;
  console.log(userRegistry);

  res.send(`Subdomain created: http://${subdomain}.mini.local:3000`);
};
