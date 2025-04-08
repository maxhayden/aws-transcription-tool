require('dotenv').config();
const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');


const multer = require('multer');
const { memoryStorage } = require('multer');
const storage = memoryStorage();
const upload = multer({ storage });

const app = express();
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sql = require("mysql");
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
};
const dbConnection = sql.createConnection(dbConfig);



app.get('/', function (req, res) {
    //home page
    res.render('index');
});

app.get('/home', function (req, res) {
    //home page
    res.render('index');
});

app.get('/signin', function (req, res) {
    //login page
    res.render('signin');
});

app.post('/signin', function (req, res) {
    //write all the functionality to check if a user exists and then log them in

    //connect to the database

    //get the user input
    const username = req.query.username;
    const password = req.query.password;

    //check if username exists in the database


    //check if the username password is right
    if (password == the_actual_password) {
        res.write("You are logged in");
    }
})

app.get('/register', function (req, res) {
    //login page
    res.render('register');
});


app.get('/dashboard', function (req, res) {
    //open form.html from the views directory
    res.render('app');
});

app.get('/debug', function (req, res) {
    // Check if connection is already established

    dbConnection.connect(function (err) {
        if (err) {
            console.error('Database connection failed:', err);
            return res.status(500).send('Database connection failed: ' + err.message);
        }
        runQuery();
    });

    function runQuery() {
        dbConnection.query("SELECT * FROM users", function (err, results) {
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Query failed: ' + err.message);
            }
            console.log('Query results:', results);
            res.json(results); // Send results as JSON response
        });
    }
});



const s3 = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
        sessionToken: process.env.SESSION_TOKEN
    }
})

const uploadImage = async (fileName, bucketName, file) => {

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file,
        ContentType: 'image/png',
    }


    return await s3.send(new PutObjectCommand(params));
}

//post to s3 bucket
app.post('/dashboard', upload.single('image'), async (req, res) => {

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const fileName = req.body.fileName;
    const bucketName = process.env.S3_INPUT;
    const file = req.file.buffer;
    try {
        const result = await uploadImage(fileName, bucketName, file);
        console.log(result);
        res.send("Uploaded successfully");
    } catch (err) {
        console.error("Upload failed:", err);
        res.status(500).send("Failed to upload file");
    }
});

app.use(function (req, res, next) {
    res.status(404).render('404');
});


const port = 80;
console.log(`listening on port ${port}`);
app.listen(port);