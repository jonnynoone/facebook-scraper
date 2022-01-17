const fs = require('fs');
const facebook = require('./facebook');

// Get facebook username and password
const CONFIG = JSON.parse(fs.readFileSync('./config.json'));
const EMAIL = CONFIG.email;
const PASSWORD = CONFIG.password;

(async () => {
    await facebook.initialize();
    let loggedIn = await facebook.login(EMAIL, PASSWORD);

    if (loggedIn) {
        console.log('Logged in successfully!');

        // Connect to Mongo DB
        await facebook.connectToMongo();

        // Search for items from FB marketplace
        // let items = await facebook.marketplace('gameboy');
        // console.log(items);

        // Get posts of specific FB user
        let posts = await facebook.getUserPosts(100042185474581);
        console.log(posts);
    }
})();