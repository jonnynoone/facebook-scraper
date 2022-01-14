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
    }
})();