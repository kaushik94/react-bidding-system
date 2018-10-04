const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const Asset = require('./models/Asset');

var COW_DETAILS_FILE = path.join(__dirname, 'assets.json');

mongoose.connect("mongodb://user:user94@ds121593.mlab.com:21593/moneysaveio-staging");

fs.readFile(COW_DETAILS_FILE, function(err, data) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    data = JSON.parse(data);
    console.log(data)
    for(var asset in data) {
        const assetObj = new Asset(data[asset]);
        assetObj.save();
    }
});