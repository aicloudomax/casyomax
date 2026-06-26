const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const verifyToken = async (req, res, next) => {
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

        // Verify session ID in database to enforce single-device login
        if (decoded.id && decoded.sessionId) {
            const userRes = await pool.query("SELECT session_id FROM users WHERE id = $1", [decoded.id]);
            const currentSessionId = userRes.rows[0]?.session_id;

            if (!currentSessionId || currentSessionId !== decoded.sessionId) {
                return res.status(401).json({ msg: "Session expired: logged in on another device" });
            }
        } else if (decoded.id) {
            // Legacy token without sessionId - force relogin
            return res.status(401).json({ msg: "Session expired: please log in again" });
        }

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
