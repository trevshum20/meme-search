const express = require("express");
const cors = require("cors");
const { deleteVector, storeMemeDescription, searchMemes } = require("./services/vectorStore");
const { uploadMiddleware, listAllMemes, deleteFromS3 } = require("./services/s3Helper");
const { getMemeDescriptionFromOpenAI } = require("./services/memeProcessor");
const { verifyAuth } = require("./services/authService");

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS
app.use(cors({
  origin: "http://localhost:3000",
  methods: "GET,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

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

// Protect all API routes with Firebase authentication
app.use("/api", verifyAuth);

// Test authentication route
app.get("/api/protected-route", (req, res) => {
    res.json({ message: `Hello, ${req.user.email}! You are authenticated.` });
});

/**
 * ************* Upload Image
 */
app.post("/api/upload", uploadMiddleware.single("meme"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = req.file.location;
  const description = await getMemeDescriptionFromOpenAI(imageUrl);

  if (!description) return res.status(500).json({ error: "Failed to get meme description from OpenAI" });

  console.log(">>> Description: ", description);

  await storeMemeDescription(imageUrl, description);

  res.json({ imageUrl, description });
});

/**
 * ************* Search
 */
app.get("/api/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  const results = await searchMemes(query);
  res.json(results);
});

/**
 * ************* Get all meme URLs
 */
app.get("/api/all-memes", async (req, res) => {
  try {
    const memeUrls = await listAllMemes();
    memeUrls.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // Sort newest first
    res.json(memeUrls);
  } catch (error) {
    console.error("Error fetching memes:", error);
    res.status(500).json({ error: "Failed to fetch memes" });
  }
});

/**
 * ************* Get Recent memes (last 10)
 */
app.get("/api/recent-memes", async (req, res) => {
  try {
    const memeUrls = await listAllMemes();
    res.json(memeUrls.slice(0, 10)); // Return last 10
  } catch (error) {
    console.error("Error fetching recent memes:", error);
    res.status(500).json({ error: "Failed to fetch recent memes" });
  }
});

/**
 * ************* Delete Image
 */
app.delete("/api/delete-image", async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "Image URL is required" });

  try {
    await deleteFromS3(imageUrl);
    await deleteVector(imageUrl);
    res.json({ message: "Image and vector deleted successfully", imageUrl });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image or vector" });
  }
});

module.exports = app;
