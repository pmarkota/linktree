const crypto = require("crypto");

// Store OTP data temporarily (in production, use Redis or a database)
const otpStore = new Map();

const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate a unique userId
    const userId = crypto.randomBytes(8).toString("hex");

    // Store OTP data (in production, use Redis or a database with expiration)
    otpStore.set(userId, {
      phoneNumber,
      otp,
      createdAt: new Date(),
    });

    // In production, integrate with SMS service provider here
    console.log(`OTP for ${phoneNumber}: ${otp}`); // For testing purposes

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      userId: userId,
    });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { userId, secret } = req.body;

    if (!userId || !secret) {
      return res
        .status(400)
        .json({ success: false, message: "userId and secret are required" });
    }

    const otpData = otpStore.get(userId);

    if (!otpData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    // Check if OTP matches
    if (otpData.otp !== secret) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check if OTP is expired (5 minutes validity)
    const now = new Date();
    const otpAge = now - otpData.createdAt;
    if (otpAge > 5 * 60 * 1000) {
      // 5 minutes in milliseconds
      otpStore.delete(userId);
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    // Generate sessionId
    const sessionId = crypto.randomBytes(8).toString("hex");

    // Clear the OTP data
    otpStore.delete(userId);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
