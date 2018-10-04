

const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');



const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port);
const http = require('http').Server(app);
const io = require('socket.io').listen(server);
const bidDuration = 3600;
const startTime = process.hrtime();
const Bid = require('./models/bid');
// const Asset = require('./models/Asset');


var COW_DETAILS_FILE = path.join(__dirname, 'assets.json');
var BID_HISTORY_FILE = path.join(__dirname, 'bid_history.json');
var mongoDB = 'mongodb://127.0.0.1/bidding_app';
mongoose.connect("mongodb://user:user94@ds121593.mlab.com:21593/moneysaveio-staging");
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(morgan('combined'));


//handle for client connection
io.on('connection', function(socket){
	console.log('a user connected');
    
	socket.on('getTime', function(msg){
			console.log(msg);
			io.emit('remainingTime',(bidDuration-process.hrtime(startTime)[0]));
		});
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
});


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const getAllBids = (cb) => {
	Bid.find({}, (err, docs) => {
		const response = {};
		if (err) throw err;
		for (var each in docs) {
			response[docs[each].id] = docs[each].history;
		}
		console.log(response)
		cb(response)
	})
}
// Put all API endpoints under '/api'
//End point to get the livestock details
app.get('/api/details', (req, res) => {

		// Asset.find({}, (err, docs) => {
		// 	if (err) throw err;
		// 	console.log("all assets", docs);
		// 	res.json(docs);
		// })
	fs.readFile(COW_DETAILS_FILE, function(err, data) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log("got auction data from file", data)	    
	res.setHeader('Cache-Control', 'no-cache');
	//Return them as json
	res.json(JSON.parse(data));
	});
});

//End point to get the bidHistory
app.get('/api/bidhistory', (req, res) => {
	getAllBids((bids) => {
		res.setHeader('Cache-Control', 'no-cache');
		res.json(bids);
	})
	// fs.readFile(BID_HISTORY_FILE, function(err, data) {
	//     if (err) {
	//       console.error(err);
	//       process.exit(1);
	//     }	   
	    
	//     res.setHeader('Cache-Control', 'no-cache');
	//     //Return them as json
	//     res.json(JSON.parse(data));
	//   });
});

//End point to save the updated Bid History
app.post('/api/bidhistory', (req, res) => {
	// var singleBid = 
	// fs.writeFile(BID_HISTORY_FILE, JSON.stringify(req.body), function(err) {
	// 	if (err) {
	// 		console.error(err);
	// 		process.exit(1);
	// 	}
	// 	// Emits updated bid to all sockets upon successful save
	// 	io.emit('updateBid', req.body);	    
	// 	res.setHeader('Cache-Control', 'no-cache');
	// 	res.json(req.body);
	// });
	const [allBids, newBid] = req.body;
	Bid.findOne({ id: newBid.id }, (err, doc) => {
		if (err) throw err;
		if (doc) {
			console.log(doc);
			doc['history'][newBid.user] = newBid.bid;
			doc.markModified('history');
			doc.save((err, saved) => {
				if (err) throw err;
				console.log("bid saved", doc);
				getAllBids((bids) => {
					io.emit('updateBid', bids);
					console.log("bids before pusher", bids)
					pusher.trigger('bidding-channel', 'updateBid', {
						"bids": bids
					});
					res.json(bids);
				})
			})
		}
	})
});

//End point to save the updated Bid History
app.post('/api/auction', (req, res) => {
	// var query = req.body;
	// Asset.count({}, (err, count) => {
	// 	if (err) throw err;
	// 	var initAuction = new Asset({
	// 		"id": ,
	// 		"bidTime":3600,
	// 		"name": query.name,
	// 		"basePrice": query.basePrice,
	// 		"image": query.image
	// 	})
	// 	initAuction.save((err, saved) => {
	// 		if (err) throw err;
	// 		// console.log("saved");
	// 		// Emits updated bid to all sockets upon successful save
	// 		var initBid = new Bid({
	// 			id: count + 1,
	// 			history = {}
	// 		})
	// 		initBid.save((err, saved) => {
	// 			if (err) throw err;
	// 			io.emit('newAuction', query);	    
	// 			res.setHeader('Cache-Control', 'no-cache');
	// 			Asset.find({}, (err, docs) => {
	// 				if (err) throw err;
	// 				res.json(docs);
	// 			})
	// 		})
	// 	})
	// })
	fs.readFile(COW_DETAILS_FILE, function(err, data) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		data = JSON.parse(data);
		const nextId = data.length+1;
		req.body['id'] = nextId;
		if (req.body.image == "") {
			req.body.image = "https://imgflip.com/s/meme/Officer-Cartman.jpg";
		}
		data.push(req.body);
		console.log(data)
		fs.writeFile(COW_DETAILS_FILE, JSON.stringify(data), function(err) {
			if (err) {
				console.error(err);
				process.exit(1);
			}

			fs.readFile(BID_HISTORY_FILE, function(err, bidData) {
				if (err) {
					console.error(err);
					process.exit(1);
				}
				bidData = JSON.parse(bidData);
				bidData[nextId] = {};
				console.log(bidData)
				fs.writeFile(BID_HISTORY_FILE, JSON.stringify(bidData), function(err) {
					if (err) {
						console.error(err);
						process.exit(1);
					}
					// Emits updated bid to all sockets upon successful save
					io.emit('newAuction', bidData);	    
					res.setHeader('Cache-Control', 'no-cache');
					res.json(data);
				});
			});

		});
	});
});


// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

// const port = process.env.PORT || 5000;
// app.listen(port);

console.log(`Auction Man Server listening on ${port}`);

// init db
// var initAuction = new Asset({
// 	"id":1,
// 	"bidTime":3600,
// 	"name":"Test",
// 	"basePrice":200,
// 	"image":"image1.jpg"
// })
// initAuction.save((err, saved) => {
// 	if (err) throw err;
// 	console.log("saved");
// })

const bid = new Bid({
	id: 1,
	history: {}
})
bid.save((err, saved) => {
	if (err) throw err;
})

// testing pusher
var Pusher = require('pusher');

var pusher = new Pusher({
  appId: '614453',
  key: '4bfc58dae07dbdd74555',
  secret: '76398d5d4599089d9ba8',
  cluster: 'ap2',
  encrypted: true
});

pusher.trigger('my-channel', 'my-event', {
  "message": "hello world"
});