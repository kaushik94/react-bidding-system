const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const Bid = require('./models/Bid');

var COW_DETAILS_FILE = path.join(__dirname, 'assets.json');

mongoose.connect("mongodb://user:user94@ds121593.mlab.com:21593/moneysaveio-staging");

fs.readFile(COW_DETAILS_FILE, function(err, data) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    data = JSON.parse(data);
    for(var bid in data) {
        const bidObj = new Bid({
            id: data[bid].id,
            history: {}
        });
        Bid.find({ id: data[bid].id }, (err, doc) => {
            if (err) throw err;
            if (!doc.length) {
                console.log(bidObj);
                bidObj.save();
            }
        })
    }
});