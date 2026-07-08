const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/* Attaches user if token present, but never blocks the request */
const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET); } catch { /* ignore */ }
  }
  next();
};

const requireOrganizer = (req, res, next) => {
  if (req.user?.role !== 'organizer') {
    return res.status(403).json({ message: 'Organizer role required' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireOrganizer };
