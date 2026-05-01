const { verifyToken } = require('../utils/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// authorizeMember is available for future routes that need Member OR Admin access
const authorizeMember = (req, res, next) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Member') {
    return res.status(403).json({ message: 'Member or Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorizeMember,
};
