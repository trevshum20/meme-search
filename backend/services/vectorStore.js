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
async function storeMemeDescription(imageUrl, description) {
  try {
    // Convert the description into a vector
    const vector = await generateEmbedding(description);
    
    // Store in Pinecone
    await index.namespace(NAMESPACE).upsert([
      {
        id: imageUrl, // Use the image URL as the unique ID
        values: vector,
        metadata: { description, imageUrl },
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
async function searchMemes(query) {
    try {
      // Convert search query to embedding
      const queryVector = await generateEmbedding(query);
  
      // Search Pinecone for similar memes
      const result = await index.namespace(NAMESPACE).query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
      });
  
      return result.matches.map(match => ({
        imageUrl: match.metadata.imageUrl,
        description: match.metadata.description,
        score: match.score,
      }));
    } catch (error) {
      console.error("Error searching memes in Pinecone:", error);
      return [];
    }
  }

  async function deleteVector(url) {
    try {
      await index.namespace(NAMESPACE).deleteOne(url);
    } catch (error) {
      console.error(`Error deleting vector for ${url} from Pinecone: `, error);
    }
  };

module.exports = { deleteVector, storeMemeDescription, searchMemes };
