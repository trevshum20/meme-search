const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Multer middleware for handling file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `memes/${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // Set limit to 20MB
});

/**
 * Uploads a file to S3 manually (used if not using Multer-S3)
 */
async function uploadToS3(file) {
    if (!file) throw new Error("No file provided for upload.");

    const fileKey = `memes/${Date.now()}-${file.originalname}`;

    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
}

/**
 * Fetches all objects in the S3 bucket.
 */
async function listAllMemes() {
    try {
        const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
        const data = await s3.send(command);

        return (data.Contents || []).map((file) => ({
            imageUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
            uploadedAt: file.LastModified,
        }));
    } catch (error) {
        console.error("Error fetching meme URLs from S3:", error);
        throw new Error("Failed to fetch memes.");
    }
}

/**
 * Deletes an object from S3.
 */
async function deleteFromS3(imageUrl) {
    const objectKey = getObjectKeyFromUrl(imageUrl);
    if (!objectKey) throw new Error("Invalid image URL");

    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey,
        });
        await s3.send(command);
    } catch (error) {
        console.error(`Error deleting from S3: ${imageUrl}`, error);
        throw new Error("Failed to delete image.");
    }
}

// Helper function to extract S3 object key from URL
const getObjectKeyFromUrl = (imageUrl) => {
    try {
        const url = new URL(imageUrl);
        return url.pathname.substring(1); // Removes leading '/'
    } catch (error) {
        return null;
    }
};

module.exports = { uploadMiddleware: upload, uploadToS3, listAllMemes, deleteFromS3 };
