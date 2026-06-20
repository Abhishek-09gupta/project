import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'online_judge_super_secret_key';

export const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  // Token is usually in format "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

export const adminMiddleware = (req, res, next) => {
  // Basic admin check - for simple local setup we can set an environment admin flag
  // or check if username is 'admin'. For a placement portfolio, checking if username is 'admin'
  // or email ends with '@admin.com' is dynamic and works out of the box!
  // Let's check if user object hasisAdmin flag or username is 'admin'.
  if (req.user && (req.user.username.toLowerCase() === 'admin' || req.user.email === 'admin@codejudge.com')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};
