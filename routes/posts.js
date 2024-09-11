const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const multer = require("multer");
require('dotenv').config();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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
    folder: 'public/images', // Store images in 'public/images' folder
    format: async (req, file) => {
      // Ensure only supported formats are used
      const format = file.mimetype.split('/')[1];
      return ['jpeg', 'png', 'jpg'].includes(format) ? format : 'jpeg'; // Default to 'jpeg' if unsupported
    },
    public_id: (req, file) => {
      // Format: currentDate_originalFileName
      const currentDate = Date.now();
      const originalFileName = file.originalname.split('.').slice(0, -1).join('.'); // Remove the extension
      return `${currentDate}${originalFileName}`;
    },
  },
});

const upload = multer({ storage });

// Route to handle file upload to Cloudinary
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json("No file uploaded.");
    }

    // Get file details
    const fileName = file.filename.split('/').pop();
    const fileUrl = file.path; // URL to the uploaded image

    // Example data to save in MongoDB (adjust according to your schema)
    const post = new Post({
      userId: req.body.userId,
      desc: req.body.desc,
      img: fileName, // Save the file name or URL
    });

    // Save post to MongoDB
    const savedPost = await post.save();

    res.status(200).json({
      message: 'File uploaded and post saved successfully',
      fileName: fileName,
      url: fileUrl,
      post: savedPost // Return the saved post details if needed
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});



// Route to fetch timeline posts (current user + friends' posts)
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});

// Route to fetch a user's posts by their username
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await Post.find({ userId: user._id });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Update a Post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("the post has been updated");
    } else {
      res.status(403).json("you can update only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//delete a post: 
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("the post has been deleted");
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});


//like/dislike a post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//get a single post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});




module.exports = router;
