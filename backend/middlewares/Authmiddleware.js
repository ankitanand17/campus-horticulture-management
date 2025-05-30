const { verify } = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const accessToken = req.header("accessToken");

  if (!accessToken) {
    return res.status(401).json({ error: "User not logged in" });
  }

  try {
    const validToken = verify(accessToken, process.env.JWT_SECRET);
    req.user = validToken; // includes id, name, role
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token is not valid" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: Insufficient permissions" });
    }
    next();
  };
};

module.exports = { validateToken, authorizeRoles };
