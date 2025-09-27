require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  console.log("✅ verifyToken middleware running");

  const authHeader = req.headers.authorization;
  console.log('📩 Auth Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("⚠️ Missing or malformed token");
    return res.status(401).json({ error: 'Unauthorized: No or malformed token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    console.log("✅ Token verified:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

const isSales = (req, res, next) => {
  
  if (!req.user || req.user.role !== "Sale") {
    return res.status(403).json({ message: "Access denied. Sales role required." });
  }
  next();
};

const isAccount = (req, res, next) => {
  
  if (!req.user || req.user.role !== "Accounts") {
    return res.status(403).json({ message: "Access denied. Account role required." });
  }
  next();
};

const isOperation = (req, res, next) => {
  
  if (!req.user || req.user.role !== "Operation") {
    return res.status(403).json({ message: "Access denied. Operation role required." });
  }
  next();
};

const isAdmin = (req, res, next) => {

  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
  next();
};

module.exports = { verifyToken, isSales, isAccount, isOperation, isAdmin };
