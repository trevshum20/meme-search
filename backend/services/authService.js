const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Load env variables

// Resolve absolute path dynamically
const serviceAccountPath = path.join(__dirname, "../config/firebase-adminsdk.json");

// Debugging: Check if the file exists before reading
if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Firebase credentials file not found at: ${serviceAccountPath}`);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Convert the comma-separated env variable into a Set
const WHITELISTED_EMAILS = new Set(
    (process.env.WHITELISTED_EMAILS || "").split(",").map(email => email.trim())
);

/**
 * Middleware to verify Firebase ID tokens and enforce email whitelisting.
 */
async function verifyAuth(req, res, next) {
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = decodedToken.email;

        if (!WHITELISTED_EMAILS.has(userEmail)) {
            return res.status(403).json({ error: "Forbidden: Access denied" });
        }

        req.user = decodedToken; // Attach user data to request
        next(); // Allow request to continue
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
}

module.exports = { verifyAuth };
