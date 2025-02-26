require("dotenv").config();
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");
const { deleteVector, storeMemeDescription, searchMemes } = require("./vectorStore");

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS
app.use(cors({
  origin: "http://localhost:3000", // Allow frontend requests
  methods: "GET,POST,DELETE", // Allow these methods
  allowedHeaders: "Content-Type"
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;


const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `memes/${Date.now()}-${file.originalname}`);
    },
  }),
});

/**
 *********************** ROUTES **************************
 */

/**
 * ************* Upload Image
 */
app.post("/api/upload", upload.single("meme"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = req.file.location;
  const description = await getMemeDescription(imageUrl);

  if (!description) return res.status(500).json({error: "Failed to get meme description from open ai"});

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
    const params = { Bucket: BUCKET_NAME };
    const command = new ListObjectsV2Command(params);

    const data = await s3.send(command);

    // Generate public URLs
    const memeUrls = (data.Contents || []).map((file) => ({
      imageUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
      uploadedAt: file.LastModified,
    }));

    // Sort by upload date (newest first)
    memeUrls.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json(memeUrls);
  } catch (error) {
    console.error("Error fetching meme URLs:", error);
    res.status(500).json({ error: "Failed to fetch memes" });
  }
});
/**
 * ************* Get Recent memes (last 10)
 */
app.get("/api/recent-memes", async (req, res) => {
  try {
    const response = await fetch(`http://localhost:${PORT}/api/all-memes`);
    const allMemes = await response.json();
    res.json(allMemes.slice(0, 10)); // Return last 10
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
  
  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  const bucketName = process.env.S3_BUCKET_NAME;
  const objectKey = getObjectKeyFromUrl(imageUrl);

  if (!objectKey) {
    return res.status(400).json({ error: "Invalid image URL" });
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    await s3.send(command);
    await deleteVector(imageUrl);
    res.json({ message: "Image and vector deleted successfully", objectKey });
  } catch (error) {
    console.error("Error deleting image or vector:", error);
    res.status(500).json({ error: "Failed to delete image or vector" });
  }
});

/**
 * ************* Home
 */
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/**
 *********************** HELPER FUNCTIONS **************************
 */

/**
 * Sends an image URL to GPT-4o and gets a description.
 * @param {string} imageUrl - The S3 image URL.
 * @returns {string} - The generated description.
 */
async function getMemeDescription(imageUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI that describes memes concisely, including any raw text in the image.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please analyze the following meme and describe its content." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 300, // Adjust if needed
    });

    return response.choices[0].message.content; // Extract the description
  } catch (error) {
    console.error("Error fetching meme description:", error);
    return null;
  }
}

// Extract object key from the URL
const getObjectKeyFromUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    return url.pathname.substring(1); // Removes leading '/'
  } catch (error) {
    return null;
  }
};
