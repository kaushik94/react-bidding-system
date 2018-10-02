const mongoose = require('mongoose');

// Define schema
var Schema = mongoose.Schema;

var AssetSchema = new Schema({
    id: String,
    name: String,
    basePrice: Number,
    image: String
});

// Compile model from schema
var AssetModel = mongoose.model('AssetModel', AssetSchema );
module.exports = AssetModel;