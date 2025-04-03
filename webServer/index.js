var express = require('express');
var bodyParser = require('body-parser');
var app = express();
require('dotenv').config()

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
    res.render('index',{lambda: process.env.LAMBDA});
});

app.get('/home', function(req, res) {
    //open form.html from the views directory
    res.render('index');
});

app.get('/dashboard', function(req, res) {
    //open form.html from the views directory
    res.render('app');
});

app.post('/', urlencodedParser, function(req, res) {
    //retrieve first and lastname
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    //open submitted.html after the user has submitted the form
    res.render('submitted', {output: req.body.firstName});
});

app.listen(80);