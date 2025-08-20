const { OpenAI } = require("openai");
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_NAME = "gpt-4o-mini";

/**
 * Describe a meme from raw bytes (preferred) or a URL.
 * If you pass {buffer, mimeType}, we'll send a data URL. Otherwise we fall back to imageUrl.
 */
async function getMemeDescriptionFromOpenAI({ buffer, mimeType, imageUrl, context = {} }) {
  try {
    const parts = [];

    // Optional context first
    const ctx = `Additional context: Pop Culture - ${context.popCulture || "None"}, Characters - ${context.characters || "None"}, Notes - ${context.notes || "None"}`;
    parts.push({ type: "text", text: ctx });

    // Core instruction
    parts.push({ type: "text", text: "Please analyze the following meme and describe its content including any raw text in the image." });

    // Image payload — prefer bytes
    if (buffer && mimeType) {
      parts.push({ type: "image_url", image_url: { url: bufferToDataUrl(buffer, mimeType) } });
    } else if (imageUrl) {
      parts.push({ type: "image_url", image_url: { url: imageUrl } });
    } else {
      throw new Error("No image provided (need {buffer,mimeType} or imageUrl).");
    }

    const resp = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are an AI that describes memes concisely, including any raw text in the image. Consider user-provided context when relevant." },
        { role: "user", content: parts },
      ],
      max_tokens: 300,
    });

    return resp.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("Error fetching meme description:", err);
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

/**
 * Turn a query parameter into a vector using open AI's text-embedding-3-small model, use for tiktok search
 * @param {*} text 
 * @returns 
 */
async function generateEmbeddingTikTok(text) {
  try {
      const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
      });

      return embeddingResponse.data[0].embedding;
  } catch (error) {
      console.error("Error generating TikTok embedding:", error);
      throw new Error("Failed to generate TikTok embedding.");
  }
}

function bufferToDataUrl(buf, mime) {
  const b64 = Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64");
  return `data:${mime};base64,${b64}`;
}

module.exports = { getMemeDescriptionFromOpenAI, generateEmbedding, generateEmbeddingTikTok };
