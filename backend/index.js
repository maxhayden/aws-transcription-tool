const express = require('express')
const app = express();
const port = 8000;


app.get('/', function (req, res) {
    res.send('Backend Reached')
  })

  app.listen(8000, () => {
    console.log(`Now listening on port ${8000}`);
}); 