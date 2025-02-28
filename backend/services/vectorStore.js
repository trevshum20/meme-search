const { Pinecone } = require("@pinecone-database/pinecone");
const { generateEmbedding } = require("./memeProcessor");

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

// Get Pinecone Index
const index = pc.index(process.env.PINECONE_INDEX_NAME, process.env.PINECONE_INDEX_HOST)

const NAMESPACE = "meme";

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

    console.log(`Stored in Pinecone: ${imageUrl}`);
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

      // Set a similarity score threshold (adjust as needed)
      const SCORE_THRESHOLD = 0.8; // Only return memes with a score ≥ 0.75

      // Filter results based on the threshold
      const filteredResults = result.matches
          .filter(match => match.score >= SCORE_THRESHOLD) // Keep only relevant memes
          .map(match => ({
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
  };

module.exports = { deleteVector, storeMemeDescription, searchMemes };
