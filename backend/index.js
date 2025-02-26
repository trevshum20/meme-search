require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");
const { storeMemeDescription, searchMemes } = require("./vectorStore");

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS
app.use(cors({
  origin: "http://localhost:3000", // Allow frontend requests
  methods: "GET,POST", // Allow these methods
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
 * getMemeDescription
 * @param {*} imageUrl 
 * @returns 
 */
async function getMemeDescription(imageUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI that describes memes concisely." },
        { role: "user", content: `Describe this meme based on its image: ${imageUrl}. Your description should also include any raw text you can parse out of the image.` }
      ]
    });

    console.log("Meme description response:", response); // Debugging
    return response.choices[0].message.content; // Extract the description
  } catch (error) {
    console.error("Error fetching meme description:", error);
    return null;
  }
}
