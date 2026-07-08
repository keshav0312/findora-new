import { Response } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service.js";

function sanitizeUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    city: user.city,
    phone: user.phone,
    isVerified: user.isVerified,
    trustPoints: user.trustPoints,
    badge: user.badge,
    createdAt: user.createdAt,
  };
}

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password, city });

    // Issue an email verification token (24h) and fire off the email via
    // Brevo. This never blocks/fails registration — if BREVO_API_KEY isn't
    // configured, email.service just logs and moves on.
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    sendVerificationEmail(user.email, user.name, verificationToken).catch(() => {});

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: "Account created — check your email to verify your account",
      data: { user: sanitizeUser(user), accessToken, refreshToken },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body.token ? req.body : req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required" });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification link" });
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const resendVerification = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isVerified) {
      return res.status(200).json({ success: true, message: "Email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: "Logged in",
      data: { user: sanitizeUser(user), accessToken, refreshToken },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, city, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: { name, city, phone, avatar } },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "Profile updated", data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    const genericResponse = {
      success: true,
      message: "If an account exists for this email, a reset link has been sent",
    };

    if (!email) return res.status(200).json(genericResponse);

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond the same way whether or not the email exists, so we
    // don't leak which addresses are registered.
    if (!user) return res.status(200).json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    sendPasswordResetEmail(user.email, user.name, resetToken).catch(() => {});

    res.status(200).json(genericResponse);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset — you can now log in" });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};
