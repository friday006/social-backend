const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config(); // Load environment variables from .env
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer storage configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'public/images/profile_pictures', // Store images in 'public/images' folder
    format: async (req, file) => {
      const format = file.mimetype.split('/')[1];
      return ['jpeg', 'png', 'jpg'].includes(format) ? format : 'jpeg'; // Default to 'jpeg' if unsupported
    },
    public_id: (req, file) => {
      const currentDate = Date.now();
      const originalFileName = file.originalname.split('.').slice(0, -1).join('.'); // Remove the extension
      return `${currentDate}${originalFileName}`;
    },
  },
});

const upload = multer({ storage });

// Middleware to authenticate JWT and attach user data
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json("Access denied");

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json("Invalid token");
    req.user = user;
    next();
  });
};

// Update profile picture route
router.put("/:id/updateProfilePicture", authenticateToken, upload.single("profilePicture"), async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json("No file uploaded.");
      }

      const uploadedFileName = "profile_pictures/" + file.filename.split('/').pop();
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json("User not found.");
      }

      user.profilePicture = uploadedFileName;
      const updatedUser = await user.save();

      res.status(200).json({
        message: "Profile picture uploaded successfully",
        fileName: uploadedFileName,
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ error: "Upload failed", details: error.message });
    }
  } else {
    res.status(403).json("You can update only your account or you must be an admin!");
  }
});

// Update user details
router.put("/:id", authenticateToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can update only your account or you must be an admin!");
  }
});

// Delete user
router.delete("/:id", authenticateToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can delete only your account or you must be an admin!");
  }
});

// Get user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;

  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });

    if (!user) {
      return res.status(404).json("User not found");
    }

    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = await Promise.all(
      user.followings.map((friendId) => User.findById(friendId))
    );

    let friendList = [];
    friends.map((friend) => {
      if (friend) {
        const { _id, username, profilePicture } = friend;
        friendList.push({ _id, username, profilePicture });
      }
    });

    res.status(200).json(friendList);
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
});

// Follow a user
router.put("/:id/follow", authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user.id);
      if (!user.followers.includes(req.user.id)) {
        await user.updateOne({ $push: { followers: req.user.id } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("User has been followed");
      } else {
        res.status(403).json("You already followed this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You cannot follow yourself");
  }
});

// Unfollow a user
router.put("/:id/unfollow", authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.user.id);
      if (user.followers.includes(req.user.id)) {
        await user.updateOne({ $pull: { followers: req.user.id } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("User has been unfollowed");
      } else {
        res.status(403).json("You don't follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("You cannot unfollow yourself");
  }
});

module.exports = router;
