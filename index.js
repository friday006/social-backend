const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require('fs');
const { uploadFile } = require('./upload');
const { downloadFile } = require('./download');

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

// Route to upload a file
app.post("/api/upload", (req, res) => {
  const file = req.files.file; // Use file upload middleware such as multer
  const filePath = path.join(__dirname, 'uploads', file.name);

  // Save file locally before uploading to Drive
  file.mv(filePath, (err) => {
    if (err) return res.status(500).send(err);

    // Upload to Google Drive
    uploadFile(filePath);
    res.status(200).json("File uploaded successfully");
  });
});

// Route to serve files
app.get("/images/:fileId", (req, res) => {
  const fileId = req.params.fileId;
  const dest = path.join(__dirname, 'public/images', fileId);

  // Download file from Google Drive
  downloadFile(fileId, dest);
  res.sendFile(dest, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error sending file');
    }
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log("Backend server is running on port", PORT);
});
