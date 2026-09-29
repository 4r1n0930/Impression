import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Generate a JWT for a user-like payload
export const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify a JWT and return decoded payload (throws on invalid)
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Express middleware factory: attach decoded token or resolved user
// Options:
// - fetchUser: async function(decoded) => user (optional)
// - headerPrefix: string default 'Bearer'
export const createAuthMiddleware = ({ fetchUser, headerPrefix = "Bearer" } = {}) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith(`${headerPrefix} `)) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (fetchUser && typeof fetchUser === "function") {
        const user = await fetchUser(decoded);
        if (!user) return res.status(404).json({ message: "User not found" });
        req.user = user;
      } else {
        req.user = decoded;
      }

      return next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

// Convenience password helpers
export const hashPassword = async (plain) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export const comparePassword = async (candidate, hashed) => {
  return bcrypt.compare(candidate, hashed);
};

export default {
  generateToken,
  verifyToken,
  createAuthMiddleware,
  hashPassword,
  comparePassword,
};
