const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // ✅ Import express-rate-limit
const {
  deleteVector,
  storeMemeDescription,
  searchMemes,
} = require("./services/vectorStore");
const {
  uploadMiddleware,
  listAllMemes,
  deleteFromS3,
} = require("./services/s3Helper");
const { getMemeDescriptionFromOpenAI } = require("./services/memeProcessor");
const { verifyAuth, verifyToken } = require("./services/authService");
const {
  addMemeOwnershipRecord,
  deleteMemeOwnershipRecord,
  getUserOwnedMemes,
} = require("./services/dynamoService");

const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
const NUMBER_OF_RECENT_MEMES = 12;

// ✅ API Rate Limiter: Limit each IP to 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per IP per window
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Enable CORS
app.use(
  cors({
    origin: allowedOrigin,
    methods: "GET,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
    credentials: true,
  })
);
app.use(express.json());
app.disable("x-powered-by"); // Hide Express version

/**
 *******************************************************************************
 ********************************* ROUTES **************************************
 *******************************************************************************
 */

/**
 * *************************** Publicly Accessible *****************************
 */

// Home
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Health
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * ********************** Protected Behind Firebase Auth  **********************
 */

// ✅ Apply rate limiting to all API routes
app.use("/api", apiLimiter);
app.use("/auth/check", apiLimiter);

// Protect all API routes with Firebase authentication
app.use("/api", verifyAuth);

app.post("/auth/check", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No authentication token provided." });
  }

  try {
    const decodedToken = await verifyToken(token); // ✅ Call authService.verifyToken()
    const userEmail = decodedToken.email.toLowerCase();

    const isWhitelisted = process.env.WHITELISTED_EMAILS.split(",")
      .map(email => email.trim().toLowerCase())
      .includes(userEmail);

    return res.json({ isWhitelisted });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});

// Test authentication route
app.get("/api/protected-route", (req, res) => {
  res.json({ message: `Hello, ${req.user.email}! You are authenticated.` });
});

/**
 * ************* Upload Images
 */
app.post("/api/upload", uploadMiddleware.array("memes", 10), async (req, res) => {
  const { userEmail, context } = req.body;

  if (!userEmail) {
    return res.status(400).json({ error: "Missing user email" }); // Ensure email is provided
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const contextArray = JSON.parse(context || "[]");

  try {
    const uploadPromises = req.files.map(async (file, index) => {
      const imageUrl = file.location;
      let fileContext = contextArray[index] || {};

      // Truncate user context to a max length of 30 characters per field
      fileContext = {
        popCulture: fileContext.popCulture ? fileContext.popCulture.substring(0, 30) : "",
        characters: fileContext.characters ? fileContext.characters.substring(0, 30) : "",
        notes: fileContext.notes ? fileContext.notes.substring(0, 30) : ""
      };

      const description = await getMemeDescriptionFromOpenAI(
        imageUrl,
        fileContext
      );
      if (!description) {
        throw new Error("Failed to get meme description from OpenAI");
      }

      await storeMemeDescription(imageUrl, description, userEmail);
      await addMemeOwnershipRecord(userEmail, imageUrl);

      return { imageUrl, description };
    });

    const uploadResults = await Promise.all(uploadPromises);
    res.json({
      message: "All files uploaded successfully.",
      results: uploadResults,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed." });
  }
});

/**
 * ************* Search
 */
app.get("/api/search", async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).json({ error: "Missing user email" }); // Ensure email is provided
  }

  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const results = await searchMemes(query, userEmail);
  res.json(results);
});

/**
 * ************* Get all meme URLs
 */
app.get("/api/all-memes", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: "Missing user email" }); // Ensure email is provided
    }

    const memeUrls = await getUserOwnedMemes(userEmail);
    memeUrls.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // Sort newest first
    res.json(memeUrls);
  } catch (error) {
    console.error("Error fetching memes:", error);
    res.status(500).json({ error: "Failed to fetch memes" });
  }
});

/**
 * ************* Get Recent memes
 */
app.get("/api/recent-memes", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: "Missing user email" }); // Ensure email is provided
    }

    const memeUrls = await getUserOwnedMemes(userEmail);
    res.json(memeUrls.slice(-NUMBER_OF_RECENT_MEMES));
  } catch (error) {
    console.error("Error fetching recent memes:", error);
    res.status(500).json({ error: "Failed to fetch recent memes" });
  }
});

/**
 * ************* Delete Image
 */
app.delete("/api/delete-image", async (req, res) => {
  const { userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({ error: "Missing user email" }); // Ensure email is provided
  }

  const { imageUrl } = req.body;
  if (!imageUrl)
    return res.status(400).json({ error: "Image URL is required" });

  try {
    await deleteFromS3(imageUrl);
    await deleteVector(imageUrl, userEmail);
    await deleteMemeOwnershipRecord(userEmail, imageUrl);
    res.json({ message: "Image and vector deleted successfully", imageUrl });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image or vector" });
  }
});

module.exports = app;
