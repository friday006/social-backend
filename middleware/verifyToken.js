const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Get token from "Bearer <token>"
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json("Token is invalid or expired");
      req.user = user; // Pass user information to the next middleware
      next();
    });
  } else {
    res.status(401).json("Authorization token is missing");
  }
};

module.exports = verifyToken;