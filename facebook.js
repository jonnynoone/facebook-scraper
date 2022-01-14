const puppeteer = require('puppeteer');

const BASE_URL = 'https://www.facebook.com/';
const LOGIN_URL = 'https://www.facebook.com/login/';
const USER_URL = id => BASE_URL + 'friends/?profile_id=' + id;

let browser = null;
let context = null;
let page = null;

const facebook = {
    initialize: async () => {
        browser = await puppeteer.launch({ headless: false });
        context = browser.defaultBrowserContext();
        context.overridePermissions(BASE_URL, ['notifications']);

        page = await browser.newPage();
        page.setViewport({
            width: 1400,
            height: 1000
        });
    },

    login: async (email, password) => {
        // Navigate to page
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        // Accept cookies
        await page.waitForSelector('[data-testid="cookie-policy-dialog-accept-button"]');
        await page.click('[data-testid="cookie-policy-dialog-accept-button"]');

        //  Input email and password
        await page.waitForSelector('input#email');
        await page.type('input#email', email);
        await page.type('input#pass', password);
        await page.keyboard.press('Enter');

        // Check if logged in 
        await page.waitForSelector('[aria-label="Create a post"]', { timeout: 10000 });
        return await page.evaluate(() => document.querySelector('[aria-label="Create a post"]') ? true : false );
    }
};

module.exports = facebook;