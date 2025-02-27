const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Sends an image URL to GPT-4o and gets a description.
 */
async function getMemeDescriptionFromOpenAI(imageUrl) {
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
        max_tokens: 300,
      });
  
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error fetching meme description:", error);
      return null;
    }
  }

/**
 * Generates an OpenAI embedding vector for a given text.
 * @param {string} text - The input text to vectorize.
 * @returns {Promise<number[]>} - The embedding vector.
 */
async function generateEmbedding(text) {
    try {
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text,
        });

        return embeddingResponse.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error("Failed to generate embedding.");
    }
}

module.exports = { getMemeDescriptionFromOpenAI, generateEmbedding };
