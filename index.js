const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const fs = require("fs");
const { google } = require("googleapis");
const path = require("path");

dotenv.config();

const app = express();

// Use CORS middleware
app.use(cors({
  origin: 'https://social-node1.netlify.app', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB", err));

// Middleware
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan("common"));

// Multer setup for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Google Drive Authentication
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"), // Path to the credentials.json file
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Function to upload file to Google Drive
const uploadFileToDrive = async (file) => {
  const { originalname, buffer } = file;
  const driveResponse = await drive.files.create({
    requestBody: {
      name: originalname,
      mimeType: file.mimetype,
    },
    media: {
      mimeType: file.mimetype,
      body: buffer, // File buffer from multer
    },
  });

  return driveResponse.data.id; // Return file ID
};

// Route for file upload to Google Drive
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const fileId = await uploadFileToDrive(req.file);
    res.status(200).json({ message: "File uploaded successfully", fileId });
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Routes
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);

// Server
const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log("Backend server is running on port", PORT);
});
