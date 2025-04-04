require('dotenv').config();

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false});

// Set EJS View Engine**
app.set('view engine','ejs');
// Set HTML engine**
app.engine('html', require('ejs').renderFile);
//set directory
app.set('views', __dirname + '/views');
//static folder
app.use(express.static('public'));

app.get('/', function(req, res) {
    //open form.html from the views directory
    res.render('index',{api_gateway: process.env.API_GATEWAY, cognito: process.env.COGNITO});
});

app.get('/home', function(req, res) {
    //open form.html from the views directory
    res.render('index',{api_gateway: process.env.API_GATEWAY, cognito: process.env.COGNITO});
});

app.get('/dashboard', function(req, res) {
    //open form.html from the views directory
    res.render('app');
});

app.post('/dashboard', urlencodedParser, function(req, res) {
    //listen for post requests when processing files
});

app.use(function(req,res,next){ 
    res.status(404).render('404'); 
}); 

app.listen(80);