const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP } = require("../controllers/otpController");

router.post("/SendOTP", sendOTP);
router.post("/VerifyOTP", verifyOTP);

module.exports = router;
