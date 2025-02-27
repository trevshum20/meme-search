import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });
const TABLE_NAME = "MemeStorage";

/**
 * Add meme metadata to DynamoDB
 */
const addMemeRecord = async (userEmail, s3Url, description) => {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            userEmail,   // Partition Key
            s3Url,       // Unique S3 URL
            description, // Optional field
            uploadedAt: new Date().toISOString(),
        },
    };

    await dynamoDB.put(params).promise();
    console.log(`Added meme for ${userEmail}`);
};

/**
 * Delete meme metadata from DynamoDB
 */
const deleteMemeRecord = async (userEmail, s3Url) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, s3Url },
    };

    await dynamoDB.delete(params).promise();
    console.log(`Deleted meme for ${userEmail}`);
};

/**
 * Get all memes for a specific user
 */
const getUserMemes = async (userEmail) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userEmail = :email",
        ExpressionAttributeValues: { ":email": userEmail },
    };

    const result = await dynamoDB.query(params).promise();
    return result.Items; // Returns an array of memes for the user
};

module.exports = { addMemeRecord, deleteMemeRecord, getUserMemes};