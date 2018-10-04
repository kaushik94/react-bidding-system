

const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const Pusher = require('pusher');


const app = express();
const port = process.env.PORT || 5000;
const server = app.listen(port);
const http = require('http').Server(app);
const bidDuration = 3600;
const startTime = process.hrtime();
const Bid = require('./models/bid');
const Asset = require('./models/asset');
const logger = require('./logger');


// var COW_DETAILS_FILE = path.join(__dirname, 'assets.json');
// var BID_HISTORY_FILE = path.join(__dirname, 'bid_history.json');

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

var pusher = new Pusher({
	appId: '614453',
	key: '4bfc58dae07dbdd74555',
	secret: '76398d5d4599089d9ba8',
	cluster: 'ap2',
	encrypted: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const getAllBids = (cb) => {
	let response = {};
	Bid.find({}, (err, docs) => {
		if (err) throw err;
		for (var each in docs) {
			response[docs[each].id] = docs[each].history;
		}
		logger.debug("all bids", response)
		cb(response)
	})
}

const getAllAssets = (cb) => {
	let response = [];
	Asset.find({}, (err, docs) => {
		if (err) throw err;
		for(var each in docs) {
			response.push(docs[each])
		}
		logger.debug("all assets", response);
		cb(response)
	})
}

const getTimes = (cb) => {
	let response = {};
	Asset.find({}, (err, docs) => {
		if (err) throw err;
		for(var each in docs) {
			response[docs[each].id] = docs[each].bidTime - process.hrtime(startTime)[0]
		}
		logger.debug("all times", response);
		cb(response)
	})	
}

app.get('/api/time', (req, res) => {
	getTimes((times) => {
		res.setHeader('Cache-Control', 'no-cache');
		res.json(times);		
	})
})
// Put all API endpoints under '/api'
//End point to get the auction details
app.get('/api/details', (req, res) => {
	getAllAssets((assets) => {
		res.setHeader('Cache-Control', 'no-cache');
		res.json(assets);
	})
});

//End point to get the bidHistory
app.get('/api/bidhistory', (req, res) => {
	getAllBids((bids) => {
		res.setHeader('Cache-Control', 'no-cache');
		res.json(bids);
	})
});

//End point to save the updated Bid History
app.post('/api/bidhistory', (req, res) => {
	const [allBids, newBid] = req.body;
	Bid.findOne({ id: newBid.id }, (err, doc) => {
		if (err) throw err;
		if (doc) {
			doc['history'][newBid.user] = newBid.bid;
			doc.markModified('history');
			doc.save((err, saved) => {
				if (err) throw err;
				getAllBids((bids) => {
					// Emit update bid to channel
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
	var query = req.body;
	Asset.count({}, (err, count) => {
		if (err) throw err;
		var initAuction = new Asset({
			"id": count+1,
			"bidTime":3600,
			"name": query.name,
			"basePrice": query.basePrice,
			"image": query.image || "https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
		})
		initAuction.save((err, saved) => {
			if (err) throw err;
			var initBid = new Bid({
				id: count + 1,
				history: {}
			})
			initBid.save((err, saved) => {
				if (err) throw err;    
				res.setHeader('Cache-Control', 'no-cache');
				getAllAssets((assets) => {
					logger.debug("all assets", assets)
					pusher.trigger('bidding-channel', 'newAuction', {
						"auctions": assets
					});	
					res.json(assets);
				})
			})
		})
	})
	// fs.readFile(COW_DETAILS_FILE, function(err, data) {
	// 	if (err) {
	// 		console.error(err);
	// 		process.exit(1);
	// 	}
	// 	data = JSON.parse(data);
	// 	const nextId = data.length+1;
	// 	req.body['id'] = nextId;
	// 	if (req.body.image == "") {
	// 		req.body.image = "https://imgflip.com/s/meme/Officer-Cartman.jpg";
	// 	}
	// 	data.push(req.body);
	// 	console.log(data)
	// 	fs.writeFile(COW_DETAILS_FILE, JSON.stringify(data), function(err) {
	// 		if (err) {
	// 			console.error(err);
	// 			process.exit(1);
	// 		}

	// 		fs.readFile(BID_HISTORY_FILE, function(err, bidData) {
	// 			if (err) {
	// 				console.error(err);
	// 				process.exit(1);
	// 			}
	// 			bidData = JSON.parse(bidData);
	// 			bidData[nextId] = {};
	// 			console.log(bidData)
	// 			fs.writeFile(BID_HISTORY_FILE, JSON.stringify(bidData), function(err) {
	// 				if (err) {
	// 					console.error(err);
	// 					process.exit(1);
	// 				}
	// 				// Emits updated bid to all sockets upon successful save
	// 				io.emit('newAuction', bidData);	    
	// 				res.setHeader('Cache-Control', 'no-cache');
	// 				res.json(data);
	// 			});
	// 		});

	// 	});
	// });
});


// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

// const port = process.env.PORT || 5000;
// app.listen(port);

console.log(`Auction Man Server listening on ${port}`);