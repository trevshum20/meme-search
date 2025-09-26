const { Pinecone } = require("@pinecone-database/pinecone");
const { generateEmbedding, generateEmbeddingTikTok } = require("./memeProcessor");

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Get Pinecone Index
const index = pc.index(
  process.env.PINECONE_INDEX_NAME,
  process.env.PINECONE_INDEX_HOST
);
const SCORE_THRESHOLD = 0.75;
const SCORE_THRESHOLD_TIKTOK = 0.3;
const NAMESPACE = "meme";

/**
 * **************************** Meme Index **************************************
 */

/**
 * Stores a meme description in Pinecone as a vector embedding.
 * @param {string} imageUrl - URL of the meme stored in S3.
 * @param {string} description - Text description of the meme.
 */
async function storeMemeDescription(imageUrl, description, userEmail) {
  try {
    // Convert the description into a vector
    const vector = await generateEmbedding(description);

    // Store in Pinecone
    await index.namespace(userEmail).upsert([
      {
        id: imageUrl, // Use the image URL as the unique ID
        values: vector,
        metadata: { description, imageUrl, userEmail },
      },
    ]);
  } catch (error) {
    console.error("Error storing meme in Pinecone:", error);
  }
}

/**
 * Searches Pinecone for memes similar to the given query.
 * @param {string} query - User's natural language search query.
 * @returns {Array} - List of matching memes with image URLs and descriptions.
 */
async function searchMemes(query, userEmail) {
  try {
    // Convert search query to embedding
    const queryVector = await generateEmbedding(query);

    // Search Pinecone for similar memes (increase topK temporarily)
    const result = await index.namespace(userEmail).query({
      vector: queryVector,
      topK: 10, // Increase topK to ensure we get enough results
      includeMetadata: true,
    });

    // Filter results based on the threshold
    const filteredResults = result.matches
      .filter((match) => match.score >= SCORE_THRESHOLD) // Keep only relevant memes
      .map((match) => ({
        imageUrl: match.metadata.imageUrl,
        description: match.metadata.description,
        score: match.score,
      }));

    return filteredResults;
  } catch (error) {
    console.error("Error searching memes in Pinecone:", error);
    return [];
  }
}

async function deleteVector(url, userEmail) {
  try {
    await index.namespace(userEmail).deleteOne(url);
  } catch (error) {
    console.error(`Error deleting vector for ${url} from Pinecone: `, error);
  }
}

/**
 * **************************** TikTok Index **************************************
 */

async function searchTikTokIndex(query, userEmail, topK = 10) {
  try {
    const tiktokIndex = pc.index(
      process.env.PINECONE_TIKTOK_INDEX_NAME,
      process.env.PINECONE_TIKTOK_INDEX_HOST
    );

    const queryVector = await generateEmbeddingTikTok(query);

    const result = await tiktokIndex.namespace(userEmail).query({
      vector: queryVector,
      topK: topK,
      includeMetadata: true,
    });

    const filteredResults = result.matches
      .filter((match) => match.score >= SCORE_THRESHOLD_TIKTOK) // Keep only relevant memes
      .map((match) => ({
        date: match.metadata.date,
        originalUrl: match.metadata.original_url,
        uiFriendlyUrl: match.metadata.ui_friendly_url,
        author: match.metadata.author,
        caption: match.metadata.caption,
        keywords: match.metadata.keywords,
        transcript: match.metadata.transcript,
        score: match.score,
      }));

    return filteredResults;
  } catch (error) {
    console.error("Error searching TikTok index:", error);
    throw new Error("Failed to search TikTok index.");
  }
}

async function storeTikTokVector(vector, tiktokUrl, userEmail, meta = {}) {
  try {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error("vector must be a non-empty number array");
    }
    if (!tiktokUrl || typeof tiktokUrl !== "string") {
      throw new Error("tiktokUrl is required");
    }
    if (!userEmail || typeof userEmail !== "string") {
      throw new Error("userEmail is required");
    }

    const tiktokIndex = pc.index(
      process.env.PINECONE_TIKTOK_INDEX_NAME,
      process.env.PINECONE_TIKTOK_INDEX_HOST
    );

    // Upsert into the user's namespace; ID is the TikTok URL
    await tiktokIndex.namespace(userEmail).upsert([
      {
        id: tiktokUrl,
        values: vector,
        // Keep metadata keys consistent with your search mapper
        metadata: {
          original_url: tiktokUrl,
          userContext: meta.userContext || '',
          userEmail,
          author: meta.author || '',
          ogDescription: meta.ogDescription || '',
          keywords: meta.keywords || '',
          date: new Date().toISOString(),
        },
      },
    ]);
  } catch (error) {
    console.error("Error storing TikTok vector in Pinecone:", error);
    throw new Error("Failed to store TikTok vector.");
  }
}


module.exports = { deleteVector, storeMemeDescription, searchMemes, searchTikTokIndex, storeTikTokVector };
