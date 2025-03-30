const express = require('express')
const app = express();
const port = 80;


app.get('/', function (req, res) {
    res.send(
        "hello world"
    )
})

app.get('/message', function (req, res) {
    res.send(
        "This is my message"
    )
})

app.listen(port, () => {
    console.log(`Now listening on port ${80}`);
}); 