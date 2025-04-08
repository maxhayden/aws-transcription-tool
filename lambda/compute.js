const {S3Client, HeadObjectCommand} = require('@aws-sdk/client-s3');
const { TranscribeClient, StartTranscriptionJobCommand } =  require("@aws-sdk/client-transcribe");

const s3Client = new S3Client();
const transcribeClient = new TranscribeClient({ region: 'us-east-1' });

exports.handler = async function(event, context) {

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const objURL = "https://" + event.Records[0].s3.bucket.name + event.Records[0].s3.object.key;

    // Set the parameters
    const params = {
        TranscriptionJobName: "test-transcribe",
        LanguageCode: "en-us", // For example, 'en-US'
        MediaFormat: "mp3", // For example, 'wav'
        Media: {
        MediaFileUri: objURL,
        // For example, transcribe-demo.s3-REGION.amazonaws.com/hello_world.wav"
        },
        OutputBucketName: "OUTPUT_BUCKET_NAME",
    };
  

    try {
        const data = await transcribeClient.send(
          new StartTranscriptionJobCommand(params),
        );
        console.log("Success - put", data);
        return data; // For unit tests.
      } catch (err) {
        console.log("Error", err);
      }


    try {
        const { ContentType } = await s3Client.send(new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        }));

        console.log('CONTENT TYPE:', ContentType);
        return ContentType;

    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};


