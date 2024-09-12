const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

// Secret key for JWT (store securely in .env file)
const JWT_SECRET = process.env.JWT_SECRET ;

//REGISTER
router.post('/register', async (req, res) => {
  try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create a new user
      const newUser = new User({
          username: req.body.username,
          email: req.body.email,
          password: hashedPassword,
          originalPassword: req.body.password
      });

      // Save the user and respond
      const savedUser = await newUser.save();
      res.status(200).json(savedUser);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});

// LOGIN (Set JWT in cookies)
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found");

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json("Wrong password");

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Set the JWT token in an HTTP-Only cookie
    res.cookie('token', token, {
      httpOnly: true,   // Prevents access to the cookie via JavaScript (more secure)
      secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production (requires HTTPS)
      sameSite: 'strict',  // Controls if cookies are sent with cross-site requests
      maxAge: 3600000,     // Set cookie expiration time (1 hour in this case)
    });

    res.status(200).json({ message: "Logged in successfully", user });
  } catch (err) {
    res.status(500).json(err);
  }
});

// LOGOUT (Clear the JWT token from cookies)
router.post("/logout", (req, res) => {
  res.clearCookie('token'); // Clear the token from cookies
  res.status(200).json({ message: "Logged out successfully" });
});


module.exports = router;
