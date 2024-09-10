const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require('multer');
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

// Multer setup
const storage = multer.memoryStorage(); // Use memory storage to avoid saving files locally
const upload = multer({ storage: storage });

// Routes
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const fileName = req.body.name || Date.now() + path.extname(req.file.originalname);
    const filePath = path.join(__dirname, 'uploads', fileName);

    // Save file temporarily
    fs.writeFileSync(filePath, req.file.buffer);

    // Upload file to Google Drive
    const fileId = await uploadFile(filePath, fileName);
    fs.unlinkSync(filePath); // Clean up temporary file

    res.status(200).json({ message: "File uploaded successfully", fileId: fileId });
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log("Backend server is running on port", PORT);
});
