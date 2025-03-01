const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.DYNAMO_DB_ACCESS_KEY,
        secretAccessKey: process.env.DYNAMO_DB_SECRET_ACCESS_KEY,
    },
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "MemeStorage";

/**
 * Add meme metadata to DynamoDB
 */
const addMemeOwnershipRecord = async (userEmail, s3Url) => {
    const params = new PutCommand({
        TableName: process.env.DYNAMO_TABLE_NAME,
        Item: {
            userEmail, // Partition Key
            s3Url, // Sort Key
            uploadedAt: new Date().toISOString(),
        },
    });

    await dynamoDB.send(params);
};

/**
 * Delete meme metadata from DynamoDB
 */
const deleteMemeOwnershipRecord = async (userEmail, s3Url) => {
    const params = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userEmail, s3Url },
    });

    await dynamoDB.send(params);
};

/**
 * Get all memes for a specific user
 */
const getUserOwnedMemes = async (userEmail) => {
    const params = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userEmail = :email",
        ExpressionAttributeValues: { ":email": userEmail },
    });

    const result = await dynamoDB.send(params);
    return result.Items || []; // Returns an array of memes for the user
};

module.exports = { addMemeOwnershipRecord, deleteMemeOwnershipRecord, getUserOwnedMemes };
