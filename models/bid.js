const mongoose = require('mongoose');

// Define schema
var Schema = mongoose.Schema;

var BidSchema = new Schema({
    id: String,
    history: { type: Object, default: {}}
});

// Compile model from schema
var BidModel = mongoose.model('BidModel', BidSchema );
module.exports  = BidModel;