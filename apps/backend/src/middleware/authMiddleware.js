const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Get token from header
    const token = req.header("Authorization");

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    try {
        // Verify token
        // Remove "Bearer " if present
        const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length) : token;

        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET || "MY_SECRET_KEY");

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "Admin")) {
        next();
    } else {
        res.status(403).json({ msg: "Access denied: Admins only" });
    }
};

module.exports = { verifyToken, isAdmin };
