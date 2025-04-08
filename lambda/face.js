const {S3Client} = require('@aws-sdk/client-s3');
const {RekognitionClient,DetectFacesCommand} = require("@aws-sdk/client-rekognition");

const s3Client = new S3Client({ region: 'us-east-1' });
const rekClient = new RekognitionClient({ region: 'us-east-1' });

exports.handler = async function(event, context) {
    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    const rekTest = {
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: key
        },
      },
    }

    const command = new DetectFacesCommand(rekTest);

    try {
      const response = await rekClient.send(command);
      console.log("number of Faces: " + response.FaceDetails.length);


      return {
        statusCode: 200,
        body: JSON.stringify({ words: 'Found' }),
      };

    } catch (error) {
      console.log("error: " + error);
    } 
};
