const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Load environment variables

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
const rawEmails = process.env.WHITELISTED_EMAILS || "";
const WHITELISTED_EMAILS = new Set(rawEmails.split(",").map(email => email.trim().toLowerCase()));

// Debugging: Warn if the whitelist is empty
if (!rawEmails.trim()) {
    console.warn("⚠️ Warning: No whitelisted emails found. The app will deny all users!");
}

/**
 * Middleware to verify Firebase ID tokens and enforce email whitelisting.
 */
async function verifyAuth(req, res, next) {
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) {
        return res.status(401).json({ error: "Unauthorized: No authentication token provided." });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = decodedToken.email.toLowerCase(); // Normalize email case

        if (!WHITELISTED_EMAILS.has(userEmail)) {
            return res.status(403).json({
                error: "Forbidden: Your Google account is not authorized. Contact the app owner to request access."
            });
        }

        req.user = decodedToken; // Attach user data to request
        next();
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({
            error: "Unauthorized: Invalid or expired token. Please log in again."
        });
    }
}

async function verifyToken(idToken) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error("🚨 Token verification failed:", error);
        throw new Error("Unauthorized: Invalid or expired token");
    }
}

module.exports = { verifyAuth, verifyToken };
