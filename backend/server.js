const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // ✅ Import express-rate-limit
const {
  deleteVector,
  storeMemeDescription,
  searchMemes,
  searchTikTokIndex,
  storeTikTokVector
} = require("./services/vectorStore");
const { getMemeDescriptionFromOpenAI, generateEmbedding } = require("./services/memeProcessor");
const { verifyAuth, verifyToken } = require("./services/authService");
const {
  addMemeOwnershipRecord,
  deleteMemeOwnershipRecord,
  getUserOwnedMemes
} = require("./services/postgresService");
const {
  extractHeadMetadata
} = require("./services/tikTokService")
const path = require('path');
const {
  LocalImageStore,
  uploadMiddleware
} = require("./storage/localImageStore")
const { v4: uuid } = require('uuid');
const { Readable } = require('stream');
const fs = require('fs');

const app = express();
const NUMBER_OF_RECENT_MEMES = 12;
const IMAGES_ROOT = path.resolve(process.env.IMAGES_ROOT || path.join(process.cwd(), 'var/images'));

// Static fallback for clean URLs (/images/2025/08/uuid.png)
app.use('/images', express.static(IMAGES_ROOT, {
  fallthrough: false,
  etag: true,
  maxAge: '1y',
  immutable: true,
}));

const store = new LocalImageStore();

// ✅ API Rate Limiter: Limit each IP to 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max requests per IP per window
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: function (origin, cb) {
    // Allow same-origin (no Origin header) and any in the allowlist
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS not allowed for origin: ' + origin));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // request headers
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.disable("x-powered-by");

const WHITELISTED_EMAILS_TIKTOK = process.env.WHITELISTED_EMAILS_TIKTOK ? process.env.WHITELISTED_EMAILS_TIKTOK.split(",") : [];

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
 * **************************************************************************************************************************
 * ************************************ Protected Behind Firebase Auth  *****************************************************
 * **************************************************************************************************************************
 */

// ✅ Apply rate limiting to all API routes
app.use("/api", apiLimiter);
app.use("/auth/check", apiLimiter);

// Protect all API routes with Firebase authentication
app.use("/api", verifyAuth);

// Authcheck + email whitelist check
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

// Check tiktok whitelist
app.post("/api/auth/tiktok-access", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No authentication token provided." });
  }

  try {
    const decodedToken = await verifyToken(token);
    const userEmail = decodedToken.email.toLowerCase();

    const hasAccess = WHITELISTED_EMAILS_TIKTOK.includes(userEmail);
    return res.json({ tiktokAccess: hasAccess });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
});

/**
 * ************* Upload Images
 */
app.post(
  '/api/upload',
  (req, res, next) => {
    uploadMiddleware.array('memes', 10)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File size exceeds 10MB limit. Please upload a smaller image.' });
        }
        console.error('Multer error:', err);
        return res.status(500).json({ error: 'File upload failed due to server error.' });
      }
      next();
    });
  },
  async (req, res) => {
    const { userEmail, context } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'Missing user email' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let contextArray = [];
    try {
      contextArray = JSON.parse(context || '[]');
    } catch {
      return res.status(400).json({ error: 'Invalid context format. Must be valid JSON.' });
    }

    try {
      const results = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const ext = store.pickExt(file);
        const key = `${new Date().getFullYear()}/${(new Date().getMonth()+1)
          .toString()
          .padStart(2,'0')}/${uuid()}${ext}`;

        // Turn buffer into a readable stream and save to disk
        const stream = Readable.from(file.buffer);
        const saved = await store.save(stream, key);
        const imageUrl = store.url(saved.key); // e.g. http://localhost:3000/images/YYYY/MM/uuid.jpg

        // Per-file context (truncate to 30 chars like before)
        let fileContext = contextArray[i] || {};
        fileContext = {
          popCulture: fileContext.popCulture ? fileContext.popCulture.substring(0, 30) : '',
          characters: fileContext.characters ? fileContext.characters.substring(0, 30) : '',
          notes: fileContext.notes ? fileContext.notes.substring(0, 30) : '',
        };

        // Describe meme and store metadata just like before
        // inside your /api/upload loop, after saving to disk and building imageUrl
        const description = await getMemeDescriptionFromOpenAI({
          buffer: file.buffer,              // raw bytes from multer
          mimeType: file.mimetype,          // e.g., "image/jpeg"
          // imageUrl,                      // optional fallback if you later host public URLs
          context: fileContext
        });
        if (!description) throw new Error('Failed to get meme description from OpenAI');

        await storeMemeDescription(imageUrl, description, userEmail);
        await addMemeOwnershipRecord(userEmail, imageUrl);

        results.push({ imageUrl, description });
      }

      return res.json({
        message: 'All files uploaded successfully.',
        results,
      });
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'File upload failed. Please try again later.' });
    }
  }
);

/**
 * ************* Search
 */
// image search
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

// tiktok search
app.get("/api/search/tiktok", async (req, res) => {
  const { userEmail, query, topK } = req.query;
  
  if (!userEmail) {
    return res.status(400).json({ error: "Missing user email" });
  }
  if (!WHITELISTED_EMAILS_TIKTOK.includes(userEmail)) {
    return res.status(403).json({ error: "Access denied. User not whitelisted for TikTok search." });
  }
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const parsedTopK = topK ? parseInt(topK, 10) : 10; // Default topK to 10
  if (isNaN(parsedTopK) || parsedTopK < 2 || parsedTopK > 20) {
    return res.status(400).json({ error: "topK must be between 2 and 20" });
  }

  try {
    const results = await searchTikTokIndex(query, userEmail, parsedTopK);
    res.json(results);
  } catch (error) {
    console.error("Error searching TikTok index:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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
    res.json(memeUrls.slice(0,NUMBER_OF_RECENT_MEMES));
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
    await store.delete(imageUrl);
    await deleteVector(imageUrl, userEmail);
    await deleteMemeOwnershipRecord(userEmail, imageUrl);
    res.json({ message: "Image and vector deleted successfully", imageUrl });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image or vector" });
  }
});

/**
 * ************* Ingest TikTok URL
 */
app.post('/api/ingest', async (req, res) => {
  // TODO: protect against prompt injection for user inputs that get sent to the AI
  const safe = (v) => (typeof v === "string" ? v.trim().slice(0, 200) : "");
  try {
    let {url, context, userEmail } = req.body || {};
    if (!userEmail) {
      userEmail = 'trevshum20@gmail.com';
    }

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    // 1) Fetch page metadata (wait ~5s for client JS to settle)
    const meta = await extractHeadMetadata(url, { waitMs: 5000 });

    let userContextString = "";

    if (context?.popCulture) {
      userContextString += `Pop Culture References: ${safe(context.popCulture)}. `;
    }
    if (context?.characters) {
      userContextString += `Characters: ${safe(context.characters)}. `;
    }
    if (context?.notes) {
      userContextString += `Other Notes: ${safe(context.notes)}.`;
    }

    meta["userContext"] = userContextString;

    // 2) Concatenate text fields for embedding
    const pieces = [
      meta.title,
      meta.description,
      meta.ogDescription,
      meta.keywords,
      meta.author
    ].filter(Boolean);

    if (meta.context) {
      pieces.unshift(meta.userContext);
    }

    const textForEmbedding = pieces.join('\n\n');

    if (!textForEmbedding) {
      return res.status(422).json({ error: 'No content found to embed from the provided URL.' });
    }

    // 3) Vectorize
    const vector = await generateEmbedding(textForEmbedding);

    // 4) Store in Pinecone (with metadata from TikTokService)
    await storeTikTokVector(vector, url, userEmail, meta);

    // 5) Respond
    return res.status(201).json({
      ok: true,
      message: 'TikTok URL processed and stored',
      userEmail,
      vectorLength: Array.isArray(vector) ? vector.length : undefined,
      meta: {
        original_url: meta.pageUrl || url,
        userContext: meta.userContext || '',
        userEmail,
        author: meta.author,
        ogDescription: meta.ogDescription,
        keywords: meta.keywords,
        date: new Date().toISOString(),
      }
    });
  } catch (err) {
    console.error('Error in /ingest:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
})
module.exports = app;
