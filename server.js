var database_uri = "mongodb+srv://Beekay2706:Maggibeekay2706@cluster0.zlnnw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// server.js
// where your node app starts

// init project
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var shortid = require('shortid');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
var cors = require('cors');
var app = express();
var port = process.env.PORT || 3000;

// mongoose.connect(process.env.DB_URI;)
mongoose.connect(database_uri,{useNewUrlParser: true, 
  useUnifiedTopology: true
});
var ShortURL = mongoose.model("shortUrl", 
  new mongoose.Schema({
    short_url: String,
    original_url: String,
    suffix: String
}));
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const res = require('express/lib/response');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});
app.get("/requestheaderparser", function (req, res) {
  res.sendFile(__dirname + '/views/requestheaderparser.html');
});
app.get("/urlshortner", function (req, res) {
  res.sendFile(__dirname + '/views/urlshortner.html');
});
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
  console.log("Hi Barath");
});
// Url shortener microservice 



app.post("/api/shorturl/", (req, res) => {
  let client_requested_url = req.body.url
  var url =  client_requested_url;
if (validUrl.isUri(url)){
    console.log('Looks like an URI');
} 
else {
    res.json({
      "error": 'invalid url'
    })
}

  let suffix = shortid.generate();
  let newShortURL = suffix

  let newURL = new ShortURL({
    short_url: __dirname + "/api/shorturl/" + suffix,
    original_url: client_requested_url,
    suffix: suffix
  })

  newURL.save((err, doc) => {
    if (err) return console.error(err);
    res.json({
      "saved": true,
      "short_url": newURL.short_url,
      "orignal_url": newURL.original_url,
      "suffix": newURL.suffix
    });
  });
});

app.get("/api/shorturl/:suffix", (req, res) => {
  let userGeneratedSuffix = req.params.suffix;
  ShortURL.find({suffix: userGeneratedSuffix}).then(foundUrls => {
    let urlForRedirect = foundUrls[0];
    res.redirect(urlForRedirect.original_url);
  });
});


// time stamp microservice - 1
app.get("/api/", function(req,res){
  let then = new Date();
 res.json({
   "unix": then.getTime(),
   "utc": then.toUTCString()
  });

});

// Header parser microservice
app.get("/api/whoami", function(req, res){
  res.json(
    {
      "ipaddress": req.ip,
      "language": req.headers["accept-language"],
      "software": req.headers["user-agent"]
    });

});
// time stamp microservice - 2
app.get("/api/:date_string", function(req, res){
       let dateString = req.params.date_string;

       if (parseInt(dateString) > 10000) {
        let unixTime = new Date(parseInt(dateString));
        res.json({
          "unix": unixTime.getTime(),
          "utc": unixTime.toUTCString()
        });

       }

       let passedInValue = new Date(dateString);

       if (passedInValue == "Invalid Date"){
        res.json({"error":"Invalid Date"});
       }
       else{
         res.json({
                    "unix": passedInValue.getTime(),
                    "utc": passedInValue.toUTCString()
        });
       }

      //  {"unix": <date.getTime()>, "utc": <date.toUTCString()> }
      
});



// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
