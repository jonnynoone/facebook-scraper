const mongoose = require('mongoose');

const MarketItem = mongoose.model('MarketItem', mongoose.Schema({
    itemPage: String,
    itemName: String,
    location: String,
    price: String,
    image: String
}));

const UserPost = mongoose.model('UserPost', mongoose.Schema({
    postURL: String,
    textContent: String,
    image: String,
    quote: String,
    comments: String,
    shares: String
}));

module.exports = {
    MarketItem,
    UserPost
};