require('dotenv').config();
const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

console.log("ACCESS_KEY:", process.env.ACCESS_KEY);
console.log("SECRET_KEY:", process.env.SECRET_KEY);
console.log("REGION:", process.env.REGION);

const multer = require('multer');
const {memoryStorage} = require('multer');
const storage = memoryStorage();
const upload = multer({storage});


const app = express();
app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));



app.get('/', function(req, res) {
    //home page
    res.render('index');
});

app.get('/home', function(req, res) {
    //home page
    res.render('index');
});

app.get('/login', function(req, res) {
    //login page
    res.render('login');
    //write all the functionality to check if a user exists and then log them in

    //connect to the database

    //get the user input
    const username = req.query.username;
    const password = req.query.password;
    
    //check if username exists in the database


    //check if the username password is right
    if (password == the_actual_password){
        res.write("You are logged in");
    }
});


app.get('/dashboard', function(req, res) {
    //open form.html from the views directory
    res.render('app');
});



const s3 = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId:process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
        sessionToken: process.env.SESSION_TOKEN
    } 
})

const uploadAudio = async (fileName, bucketName, file) => {

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file,
        ContentType: 'audio/mpeg',
    }


    return await s3.send(new PutObjectCommand(params));
}

//post to s3 bucket
app.post('/dashboard/process', upload.single('audiofile'), async (req, res) =>{

    const fileName = 'my first upload';
    const bucketName = process.env.S3_INPUT;
    const file = req.file.buffer;
    try {
        const result = await uploadAudio(fileName, bucketName, file);
        console.log(result);
        res.send("Uploaded successfully");
    } catch (err) {
        console.error("Upload failed:", err);
        res.status(500).send("Failed to upload file");
    }
});

app.use(function(req,res,next){ 
    res.status(404).render('404'); 
}); 

console.log("listening on port 3000");
app.listen(3000);