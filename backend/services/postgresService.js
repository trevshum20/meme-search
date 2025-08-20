// backend/src/services/postgresService.js
const { Pool } = require('pg');
const path = require('path');
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.PG_DB_URL,
  // If you later need SSL in prod:
  // ssl: { rejectUnauthorized: false }
});

/**
 * Add meme metadata to Postgres
 * Equivalent to DynamoDB Put on (userEmail, s3Url)
 */
const addMemeOwnershipRecord = async (userEmail, s3Url) => {
  const sql = `
    INSERT INTO meme_ownership (user_email, s3_url)
    VALUES ($1, $2)
    ON CONFLICT (user_email, s3_url) DO NOTHING
    RETURNING user_email, s3_url, uploaded_at;
  `;
  const { rows } = await pool.query(sql, [userEmail, s3Url]);
  return rows[0] || null; // null if it already existed
};

/**
 * Delete meme metadata from Postgres
 * Equivalent to DynamoDB Delete on (userEmail, s3Url)
 */
const deleteMemeOwnershipRecord = async (userEmail, s3Url) => {
  const sql = `
    DELETE FROM meme_ownership
    WHERE user_email = $1 AND s3_url = $2
    RETURNING user_email, s3_url, uploaded_at;
  `;
  const { rows } = await pool.query(sql, [userEmail, s3Url]);
  return rows[0] || null; // null if nothing was deleted
};

/**
 * Get all memes for a specific user
 * Equivalent to DynamoDB Query by partition key
 */
const getUserOwnedMemes = async (userEmail) => {
  const sql = `
    SELECT user_email AS "userEmail",
           s3_url     AS "s3Url",
           uploaded_at AS "uploadedAt"
    FROM meme_ownership
    WHERE user_email = $1
    ORDER BY uploaded_at DESC;
  `;
  const { rows } = await pool.query(sql, [userEmail]);
  return rows; // [{ userEmail, s3Url, uploadedAt }, ...]
};

module.exports = {
  addMemeOwnershipRecord,
  deleteMemeOwnershipRecord,
  getUserOwnedMemes
};
