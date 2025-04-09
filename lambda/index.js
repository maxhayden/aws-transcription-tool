const { S3Client } = require('@aws-sdk/client-s3');
const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const sql = require("mysql2");

require('dotenv').config();

const s3Client = new S3Client({ region: 'us-east-1' });
const rekClient = new RekognitionClient({ region: 'us-east-1' });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
};

const dbConnection = sql.createPool(dbConfig);

exports.handler = async function (event, context) {
    try {
        // Log the incoming event for debugging
        console.log("Event received:", JSON.stringify(event, null, 2));

        // Extract bucket and object key from the event
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        console.log(`Processing S3 object: ${key} from bucket: ${bucket}`);

        // Set up Rekognition parameters
        const rekTest = {
            Image: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                },
            },
            MaxLabels: 5,
            MinConfidence: 75
        };

        const command = new DetectLabelsCommand(rekTest);

        // Call Rekognition to detect labels
        const response = await rekClient.send(command);
        console.log("Rekognition response:", JSON.stringify(response, null, 2));

        if (response.Labels && response.Labels.length > 0) {
            // Process each label
            for await (const element of response.Labels) {
                console.log('Detected label: ${element.Name}');
                await addTag(element.Name); // Await the async DB insert
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ words: 'Found' }),
            };
        } else {
            console.log("No labels found.");
            return {
                statusCode: 404,
                body: JSON.stringify({ words: 'No labels found' }),
            };
        }
    } catch (error) {
        // Catch and log any errors during the process
        console.error("Error during handler execution:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};

async function addTag(tag) {
    // Log each DB query to help with debugging
    console.log(`Adding tag to DB: ${tag}`);

    try {
        await new Promise((resolve, reject) => {
            dbConnection.query("INSERT INTO tags (tag) VALUES (?)", [tag], function (err, results) {
                if (err) {
                    console.error("DB error:", err);
                    reject(err); // Reject if there's an error
                } else {
                    console.log("DB insert successful:", results);
                    resolve(results); // Resolve if the query was successful
                }
            });
        });
    } catch (error) {
        console.error("Error during DB operation:", error);
    }
}

async function addPhoto(tag) {
    // Log each DB query to help with debugging
    console.log(`Adding tag to DB: ${tag}`);

    try {
        await new Promise((resolve, reject) => {
            dbConnection.query("INSERT INTO tags (tag) VALUES (?)", [tag], function (err, results) {
                if (err) {
                    console.error("DB error:", err);
                    reject(err); // Reject if there's an error
                } else {
                    console.log("DB insert successful:", results);
                    resolve(results); // Resolve if the query was successful
                }
            });
        });
    } catch (error) {
        console.error("Error during DB operation:", error);
    }
}
