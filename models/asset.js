const mongoose = require('mongoose');

// Define schema
var Schema = mongoose.Schema;

var AssetSchema = new Schema({
    id: String,
    name: String,
    basePrice: Number,
    bidTime: { type: Number, default: 3600 },
    image: String
});

// Compile model from schema
var AssetModel = mongoose.model('AssetModel', AssetSchema );

AssetSchema.post('save', function(doc) {
    console.log('%s has been saved', doc._id);
});

module.exports = AssetModel;