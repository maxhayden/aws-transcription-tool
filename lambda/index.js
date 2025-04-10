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
    // Log the incoming event for debugging
    console.log("Event received:", JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        try {
            // Log the incoming event for debugging
            const s3Event = JSON.parse(record.body);
            const s3Record = s3Event.Records[0];
            console.log("Record parsed:", JSON.stringify(s3Record, null, 2));

            const bucket = s3Record.s3.bucket.name;
            const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, " "));
            console.log(`Processing file ${key} from bucket ${bucket}`);

            const user_id = key.split('/')[0];
            const image_name = key.split('/')[1];

            // Set up Rekognition parameters
            const rekTest = {
                Image: {
                    S3Object: {
                        Bucket: bucket,
                        Name: key
                    },
                },
                MaxLabels: 10,
                MinConfidence: 50
            };

            const command = new DetectLabelsCommand(rekTest);

            // Call Rekognition to detect labels
            const response = await rekClient.send(command);
            console.log("Rekognition response:", JSON.stringify(response, null, 2));

            const photoResult = await addPhoto(user_id, image_name);
            const image_id = photoResult.insertId;

            if (response.Labels && response.Labels.length > 0) {
                // Process each label
                for await (const element of response.Labels) {
                    console.log(`Detected label: ${element.Name}`);
                    const tagResult = await addTag(element.Name);
                    const tag_id = tagResult.insertId;
                    await addTagPhotoConnection(tag_id, image_id);
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
    }
};

async function addTag(tag) {
    // Log each DB query to help with debugging
    console.log(`Adding tag to DB: ${tag}`);

    try {
        // Check if the tag already exists
        const existingTag = await new Promise((resolve, reject) => {
            dbConnection.query("SELECT tag_id FROM tags WHERE name = ?", [tag], function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        // If the tag exists, return the tag_id
        if (existingTag.length > 0) {
            console.log(`Tag '${tag}' already exists with ID: ${existingTag[0].tag_id}`);
            return { insertId: existingTag[0].tag_id };
        }

        // If the tag does not exist, insert it
        return await new Promise((resolve, reject) => {
            dbConnection.query("INSERT INTO tags (name) VALUES (?)", [tag], function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    console.log("DB insert successful:", results);
                    resolve(results);
                }
            });
        });

    } catch (error) {
        console.error("Error during DB Tag operation:", error);
    }
}

async function addPhoto(user_id, image_key) {
    // Log each DB query to help with debugging
    console.log(`Adding photo to DB: ${image_key}`);

    try {
        return await new Promise((resolve, reject) => {
            dbConnection.query("INSERT INTO photos (user_id, url) VALUES (?, ?)", [user_id, image_key], function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    console.log("DB insert successful:", results);
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error("Error during DB Photo operation:", error);
    }
}


async function addTagPhotoConnection(tag_id, photo_id) {
    console.log(`connecting tag to photo to DB: ${photo_id}`);

    try {
        await new Promise((resolve, reject) => {
            dbConnection.query("INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)", [photo_id, tag_id], function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    console.log("DB insert successful:", results);
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error("Error during DB photo_tags operation:", error);
    }
}


