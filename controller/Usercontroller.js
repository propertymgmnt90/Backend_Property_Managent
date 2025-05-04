// import express from "express";
// import { Router } from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import validator from "validator";
// import crypto from "crypto";
// import userModel from "../models/Usermodel.js";
// import transporter from "../config/nodemailer.js";
// import { getWelcomeTemplate } from "../email.js";
// import { getPasswordResetTemplate } from "../email.js";

// const backendurl = process.env.BACKEND_URL;

// const createtoken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: "30d",
//   });
// };

// dotenv.config();

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const Registeruser = await userModel.findOne({ email });
//     if (!Registeruser) {
//       return res.json({ message: "Email not found", success: false });
//     }
//     const isMatch = await bcrypt.compare(password, Registeruser.password);
//     if (isMatch) {
//       const token = createtoken(Registeruser._id);
//       return res.json({ token, user: { name: Registeruser.name, email: Registeruser.email }, success: true });
//     } else {
//       return res.json({ message: "Invalid password", success: false });
//     }
//   } catch (error) {
//     console.error(error);
//     res.json({ message: "Server error", success: false });
//   }
// };

// const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     if (!validator.isEmail(email)) {
//       return res.json({ message: "Invalid email", success: false });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new userModel({ name, email, password: hashedPassword });
//     await newUser.save();
//     const token = createtoken(newUser._id);

//     // send email
//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: email,
//       subject: "Welcome to BuildEstate - Your Account Has Been Created",
//       html: getWelcomeTemplate(name)
//     };

//     await transporter.sendMail(mailOptions);

//     return res.json({ token, user: { name: newUser.name, email: newUser.email }, success: true });
//   } catch (error) {
//     console.error(error);
//     return res.json({ message: "Server error", success: false });
//   }
// };

// const forgotpassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await userModel.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "Email not found", success: false });
//     }
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     user.resetToken = resetToken;
//     user.resetTokenExpire = Date.now() + 10 * 60 * 1000; // 1 hour
//     await user.save();
//     const resetUrl = `${process.env.WEBSITE_URL}/reset/${resetToken}`;
//     const mailOptions = {
//       from: process.env.EMAIL,
//       to: email,
//       subject: "Password Reset - BuildEstate Security",
//       html: getPasswordResetTemplate(resetUrl)
//     };

//     await transporter.sendMail(mailOptions);
//     return res.status(200).json({ message: "Email sent", success: true });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// const resetpassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;
//     const user = await userModel.findOne({
//       resetToken: token,
//       resetTokenExpire: { $gt: Date.now() },
//     });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token", success: false });
//     }
//     user.password = await bcrypt.hash(password, 10);
//     user.resetToken = undefined;
//     user.resetTokenExpire = undefined;
//     await user.save();
//     return res.status(200).json({ message: "Password reset successful", success: true });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// const adminlogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
//       const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       return res.json({ token, success: true });
//     } else {
//       return res.status(400).json({ message: "Invalid credentials", success: false });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error", success: false });
//   }
// };

// const logout = async (req, res) => {
//     try {
//         return res.json({ message: "Logged out", success: true });
//     } catch (error) {
//         console.error(error);
//         return res.json({ message: "Server error", success: false });
//     }
// };

// // get name and email

// const getname = async (req, res) => {
//   try {
//     const user = await userModel.findById(req.user.id).select("-password");
//     return res.json(user);
//   }
//   catch (error) {
//     console.error(error);
//     return res.json({ message: "Server error", success: false });
//   }
// }



// export { login, register, forgotpassword, resetpassword, adminlogin, logout, getname };


import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/Usermodel.js';
import { sendSMS } from '../config/twilioConfig.js';
import { getOTPTemplate } from '../config/smsTemplates.js';

const createToken = (id) => {
  console.log('Creating JWT for user ID:', id);
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Send OTP for registration
export const sendRegisterOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    console.log('Received register OTP request for mobile:', mobile);

    if (!validator.isMobilePhone(mobile, 'any', { strictMode: true })) {
      console.log('Invalid mobile number:', mobile);
      return res.json({ message: 'Invalid mobile number', success: false });
    }

    const user = await User.findOne({ mobile });
    if (user) {
      console.log('Mobile already registered:', mobile);
      return res.json({ message: 'Mobile number already registered', success: false });
    }

    const otp = '0000'; // Fixed OTP
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    const tempUser = new User({
      mobile,
      otp,
      otpExpires,
    });
    await tempUser.save();
    console.log('Temporary user saved with OTP:', otp);

    await sendSMS(mobile, getOTPTemplate(otp));
    return res.json({ message: 'OTP sent to mobile', success: true });
  } catch (error) {
    console.error('Error sending register OTP:', error.message, error.stack);
    // Specific error for MongoDB validation
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

// Verify OTP and complete registration
export const verifyRegisterOTP = async (req, res) => {
  try {
    const { mobile, otp, name, latitude, longitude, city } = req.body;
    console.log('Verifying register OTP for mobile:', mobile, 'OTP:', otp);

    // Validate required fields
    if (!name) {
      console.log('Name is missing for mobile:', mobile);
      return res.status(400).json({ message: 'Name is required', success: false });
    }

    const user = await User.findOne({
      mobile,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('Invalid or expired OTP for mobile:', mobile);
      return res.json({ message: 'Invalid or expired OTP', success: false });
    }

    user.name = name;
    user.location = {
      city: city || 'Unknown',
      coordinates: {
        latitude: latitude || null,
        longitude: longitude || null,
      },
    };
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    console.log('User registered successfully:', mobile);

    const token = createToken(user._id);
    return res.json({
      token,
      user: {
        name: user.name,
        mobile: user.mobile,
        location: user.location,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error verifying register OTP:', error.message, error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

// Send OTP for login
export const sendLoginOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    console.log('Received login OTP request for mobile:', mobile);

    if (!validator.isMobilePhone(mobile, 'any', { strictMode: true })) {
      console.log('Invalid mobile number:', mobile);
      return res.json({ message: 'Invalid mobile number', success: false });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      console.log('Mobile not registered:', mobile);
      return res.json({ message: 'Mobile number not registered', success: false });
    }

    const otp = '0000'; // Fixed OTP
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();
    console.log('OTP saved for login:', otp);

    await sendSMS(mobile, getOTPTemplate(otp));
    return res.json({ message: 'OTP sent to mobile', success: true });
  } catch (error) {
    console.error('Error sending login OTP:', error.message, error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

// Verify OTP and login
export const verifyLoginOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    console.log('Verifying login OTP for mobile:', mobile, 'OTP:', otp);

    const user = await User.findOne({
      mobile,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log('Invalid or expired OTP for mobile:', mobile);
      return res.json({ message: 'Invalid or expired OTP', success: false });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    console.log('Login successful for mobile:', mobile);

    const token = createToken(user._id);
    return res.json({
      token,
      user: {
        name: user.name,
        mobile: user.mobile,
        location: user.location,
      },
      success: true,
    });
  } catch (error) {
    console.error('Error verifying login OTP:', error.message, error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, success: false });
    }
    return res.status(500).json({ message: 'Server error', success: false });
  }
};



const adminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, success: true });
    } else {
      return res.status(400).json({ message: "Invalid credentials", success: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt for mobile:', email);

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ mobile }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Admin login successful');
      return res.json({ token, success: true });
    } else {
      console.log('Invalid admin credentials');
      return res.status(400).json({ message: 'Invalid credentials', success: false });
    }
  } catch (error) {
    console.error('Admin login error:', error.message, error.stack);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    console.log('Logout request');
    return res.json({ message: 'Logged out', success: true });
  } catch (error) {
    console.error('Logout error:', error.message, error.stack);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};

// Get user details
export const getName = async (req, res) => {
  try {
    console.log('Fetching user details for ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-otp -otpExpires');
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found', success: false });
    }
    console.log('User details fetched:', user.mobile);
    return res.json({
      name: user.name,
      mobile: user.mobile,
      location: user.location,
      success: true,
    });
  } catch (error) {
    console.error('Get user error:', error.message, error.stack);
    return res.status(500).json({ message: 'Server error', success: false });
  }
};