const mongoose = require('mongoose');

// Define schema
var Schema = mongoose.Schema;

var BidQueueSchema = new Schema({
    user: String,
    count: { type: Number, default: 0}
});

// Compile model from schema
var BidQueue = mongoose.model('BidQueue', BidQueueSchema );
module.exports  = BidQueue;