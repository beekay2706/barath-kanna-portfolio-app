var database_uri = "mongodb+srv://Beekay2706:12345@cluster0.zlnnw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// server.js
// where your node app starts

// init project
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
const dns = require('dns');
const moment = require('moment');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const urlparser = require('url');
var cors = require('cors');
var app = express();
var port = process.env.PORT || 3000;

// mongoose.connect(process.env.DB_URI;)
mongoose.connect(database_uri,{useNewUrlParser: true, 
  useUnifiedTopology: true
});

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
const res = require('express/lib/response');
const { url } = require('inspector');
// Schema
const schema = new mongoose.Schema({url: 'string'});
const excersizeSchema = new mongoose.Schema({
	description: {type: String, required: true},
	duration: {type: Number, required: true},
	date: {type: String}
});

const userSchema = new mongoose.Schema({
	username: {type: String, required: true},
	log: [excersizeSchema]
});
// Models
const Url = mongoose.model('Url', schema);
const User = mongoose.model("User", userSchema);
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
app.get("/excercisetracker", function (req, res) {
  res.sendFile(__dirname + '/views/excercisetracker.html');
});
app.get("/filemetadata", function (req, res) {
	res.sendFile(__dirname + '/views/filemetadata.html');
  });
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
  console.log("Hi Barath");
});
// File meta data microservice
app.post("/api/fileanalyse", upload.single('upfile'), (req, res) => {
res.json({  "name": req.file.originalname,
            "type":req.file.mimetype,
            "size": req.file.size })

});

// Excercise Tracker
app.post('/api/users', (req, res)=>{
	const userName = req.body.username;

	User.findOne({username: userName}, (err, result) => {
		if (err) throw err;
		if(!result) {
			const user = new User({
				username: userName
			});
			user.save();
			res.json(user);
		} else {
			// Message for user is already saved
			res.json("Username already taken");
		}
	});
});

app.post('/api/users/:_id/exercises', (req, res)=>{
	let date = req.body.date ? moment(req.body.date).format("ddd MMM DD YYYY") : moment().format("ddd MMM DD YYYY");
	//let date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toISOString().substring(0,10);;

	const user_id = req.params._id;
	const user_desc = req.body.description;
	const user_dura = parseInt(req.body.duration);

	User.findOne({_id: user_id}, (err,result)=>{
		if (err) throw err;
		if(!result) {
			res.json("The user you were looking for was not found, check your user ID");
		} else {
			result.log.push({
				description: user_desc,
				duration: user_dura,
				date: date,
			});
			result.save();
			res.json(
				{
					username: result.username,
					description: user_desc,
					duration: user_dura,
					date: date,
					_id: result._id
				}
			);
		}
	});

});
app.get('/api/users/:_id/logs', (req,res)=>{

	const user_id = req.params._id;

	const from_date = req.query.from;
	const to_date = req.query.to;
	const limit = req.query.limit;

	User.findOne({_id: user_id}, (err,result)=>{
		if(!result) {
			res.json("The user you were looking for was not found, check your user ID");
		} else {
			if(limit) {
				//result.log = result.log.slice(0, limit);
				result.log = result.log.splice(limit,result.log.length);
			}

			// from / to date
			if(from_date || to_date) {
				let start_date = from_date ? new Date(from_date) : new Date(0);
				let end_date = to_date ? new Date(to_date) : new Date();

				result.log = result.log.filter((item) => {
					let exerciseDate = new Date(item.date);

					return exerciseDate.getTime() >= start_date.getTime() && exerciseDate.getTime() <= end_date.getTime();
				});
			}

			res.json({
				username: result.username,
				count: result.log.length,
				log: result.log
			});
		};
	});
});
app.get('/api/users', (req, res) => {
	User.find({}, (err,users)=>{
		if (err) throw err;
		res.json(users);
	});
});
// Url shortener microservice 

app.post('/api/shorturl/',async function(req, res) {
  console.log(req.body);
  const bodyurl = req.body.url;
  const something = dns.lookup(urlparser.parse(bodyurl).hostname,
     (error, address)  => {
       if(!address){
         res.json({error: "invalid url"})
       } else{
         const url = new Url({url: bodyurl})
         url.save((err, data) => {
           res.json({
             original_url: data.url,
             short_url: data.id
           })
         })
       }
       console.log("dns", error);
       console.log("address", address);
     })
     console.log("something", something);
});

app.get("/api/shorturl/:id", (req, res)=> {
  const id = req.params.id;
  Url.findById(id, (err, data)=> {
    if(!data){
      res.json({error: "invalid url"})
    }else{
      res.redirect(data.url)
    }
  })
})

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
