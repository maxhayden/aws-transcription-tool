require('dotenv').config();

const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const multer = require('multer');
const { memoryStorage } = require('multer');
const storage = memoryStorage();
const upload = multer({ storage });


const sql = require("mysql2");
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
};
const dbConnection = sql.createPool(dbConfig);

const session = require('express-session');
const MySQLStore = require("express-mysql-session")(session);
const sessionStore = new MySQLStore(dbConfig);

app.use(
    session({
        secret:"secret",
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            maxAge: 60000 * 60 * 24
        }
    })
)

app.use(function(req, res, next) {
    res.locals.user = req.session.authenticated ? req.session.user : null;
    next();
  });


function isAuthenticated(req,res,next){
    if(req.session.authenticated == true){ 
        next();
    } else{
        res.redirect("/login?accessDenied");
    }
}

app.get('/', function (req, res) {
    //home page
    res.render('index');
});

app.get('/home', function (req, res) {
    //home page
    res.render('index');
});

app.get('/login', function (req, res) {
    //login page
    res.render('login');
});

app.post('/login', function (req, res) {
    console.log("signing in...");
    //get the user input
    const {email, password} = req.body;

    dbConnection.getConnection(function (err, connection) {
        if (err) {
            console.error('Database connection failed:', err);
            return res.status(500).send('Database connection failed: ' + err.message);
        }
        connection.query(`SELECT * FROM users WHERE email = "${email}"`, function (err, result, fields) {
            connection.release();
            if (err) {
                console.error('Query error:', err);
                res.status(500).render('login');
            }

            console.log(result);

            if (result.length == 1) {
                bcrypt.compare(password, result[0].password_hash, function (err, isMatch) {
                    if (isMatch == true) {
                        console.log("logged in");

                        //start session
                        req.session.authenticated = true;
                        req.session.user = email;
                        req.session.user_id = result[0].id;
                        console.log(req.session);


                        return res.redirect('/home?loggedin'); 
                    }  else {
                        console.log("wrong password");
                        return res.redirect('/login?error'); 
                    }
                });
            } else {
                console.log("account doesn't exist");
                return res.redirect('/login?error'); 
            }   
        }
        );
    });
})

app.get('/register', function (req, res) {
    //login page
    res.render('register');
});

app.post('/register', function (req, res) {
    //register process page
    //get the user input
    const {email, password} = req.body;

    bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
            console.error('Hash failed:', err);
            return res.status(500).send('Hash failed: ' + err.message);
        }
        dbConnection.getConnection(function (err, connection) {
            if (err) {
                console.error('Database connection failed:', err);
                return res.status(500).send('Database connection failed: ' + err.message);
            }
            connection.query(`INSERT INTO users (email, password_hash) VALUES ("${email}", "${hash}")`, function (err, result, fields) {
                connection.release();
                if (err) {
                    console.error('Query error:', err);
                    return res.redirect('/register?error'); 
                }
                console.log("User Registered");
                return res.redirect('/login'); 
            }
            );
        });
    });
});

app.get('/logout', function (req, res){
    req.session.destroy(function(err) {
        // cannot access session here
    })
    res.locals.user = null;
    res.render('logout');
})

app.get('/dashboard', isAuthenticated, function (req, res) {
    //open form.html from the views directory
    console.log("Inside /dashboard route");
    res.render('app');
});

app.get('/debug', function (req, res) {
    dbConnection.getConnection(function (err, connection) {
        if (err) {
            console.error('Database connection failed:', err);
            return res.status(500).send('Database connection failed: ' + err.message);
        }

        connection.query("SELECT * FROM users", function (err, results) {
            connection.release(); // release the connection back to the pool

            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Query failed: ' + err.message);
            }

            console.log('Query results:', results);
            res.json(results);
        });
    });
});

app.get('/session', function(req, res){
    res.json(req.session);
})

//////////////////////////////
///// POST TO BUCKET /////////
//////////////////////////////

const s3 = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
        sessionToken: process.env.SESSION_TOKEN
    }
})
const uploadImage = async (id, fileName, bucketName, file) => {

    const params = {
        Bucket: bucketName,
        Key: id + "/" + fileName,
        Body: file,
        ContentType: 'image/png'
    }


    return await s3.send(new PutObjectCommand(params));
}
//post to s3 bucket
app.post('/dashboard', upload.single('image'), async (req, res) => {
    console.log("Received request for /dashboard");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const id = req.session.user_id;
    const fileName = req.file.originalname;
    const bucketName = process.env.S3_INPUT;
    const file = req.file.buffer;
    try {
        const result = await uploadImage(id, fileName, bucketName, file);
        console.log(result);
        return res.redirect('/dashboard?success'); 
    } catch (err) {
        console.error("Upload failed:", err);
        return res.redirect('/dashboard?fail'); 
    }
});


//404 not found page
app.use(function (req, res, next) {
    res.status(404).render('404');
});

const port = 80;
console.log(`listening on port ${port}`);
app.listen(port);