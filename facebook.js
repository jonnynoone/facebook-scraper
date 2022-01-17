const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Models = require('./Models.js');

const BASE_URL = 'https://www.facebook.com';
const LOGIN_URL = 'https://www.facebook.com/login/';
const USER_URL = id => BASE_URL + '/friends/?profile_id=' + id;

let browser = null;
let context = null;
let page = null;

const facebook = {
    initialize: async () => {
        // Start puppeteer
        browser = await puppeteer.launch({ headless: false });

        // Deal with notifications prompt
        context = browser.defaultBrowserContext();
        await context.overridePermissions(BASE_URL, ['notifications']);

        // Open a new page
        page = await browser.newPage();
        await page.setViewport({
            width: 1400,
            height: 1000
        });

        // Display puppeteer browser console logs
        // page.on('console', (message) => {
        //     console.log('Log from puppeteer browser:', message.text());
        // });
    },

    login: async (email, password) => {
        // Navigate to page
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

        // Accept cookies
        await page.waitForSelector('[data-testid="cookie-policy-dialog-accept-button"]');
        await page.click('[data-testid="cookie-policy-dialog-accept-button"]');

        //  Input email and password
        await page.waitForSelector('input#email');
        await page.type('input#email', email, { delay: 50 });
        await page.type('input#pass', password, { delay: 50 });
        await page.keyboard.press('Enter');

        // Check if logged in 
        await page.waitForSelector('[aria-label="Create a post"]', { timeout: 10000 });
        return await page.evaluate(() => document.querySelector('[aria-label="Create a post"]') ? true : false );
    },

    connectToMongo: async () => {
        await mongoose.connect('mongodb+srv://fbdb:fbdb@cluster0.uamuu.mongodb.net/marketItems?retryWrites=true&w=majority');
        console.log('Connected to Mongo...');
    },

    marketplace: async (query) => {
        // Navigate to page
        let url = await page.url()
        if (url.indexOf(BASE_URL + '/marketplace') === -1) {
            await page.goto(BASE_URL + '/marketplace', { waitUntil: 'networkidle2' });
        }
        
        // Wait for page load
        await page.waitForSelector('input[aria-label="Search Marketplace"]');

        // Search for query
        await page.type('input[aria-label="Search Marketplace"]', query, { delay: 100 });
        await page.keyboard.press('Enter');

        // Grab search results
        await page.waitForTimeout(3000);
        let items = await page.$$('.kbiprv82');

        let results = [];
        for (item of items) {
            let result = await item.evaluate((node, BASE_URL) => {
                const elementExists = (selector, getAttr = false, attribute) => {
                    if (getAttr) {
                        return node.querySelector(selector) ? node.querySelector(selector).getAttribute(attribute) : false;
                    } else {
                        return node.querySelector(selector) ? node.querySelector(selector).textContent.trim() : false;
                    }
                };

                // Get item details
                let itemPage = BASE_URL + elementExists('[role="link"]', true, 'href');
                let itemName = elementExists('.linoseic');
                let location = elementExists('.g0qnabr5.ojkyduve');
                let price = elementExists('.j83agx80 > span');
                let image = elementExists('img.stjgntxs.k4urcfbm', true, 'src');

                return { itemPage, itemName, location, price, image };
            }, BASE_URL);
                
            // Save entry to MongoDB
            const marketItem = new Models.MarketItem(result);
            marketItem.save();

            // Push entry to results array
            results.push(result);
        }
        
        return results;
    },

    getUserPosts: async (id) => {
        // Navigate to page
        await page.goto(USER_URL(id), { waitUntil: 'networkidle2' });

        // Wait for page load and grab posts
        await page.waitForSelector('.gile2uim.qmfd67dx');
        let posts = await page.$$('.gile2uim.qmfd67dx .k4urcfbm.l9j0dhe7.sjgh65i0');

        let results = [];
        // Iterate through each post in posts array
        for (let i = 0; i < posts.length; i++) {
            let result = await posts[i].evaluate((post) => {
                const elementExists = (selector, getAttr = false, attribute) => {
                    if (getAttr) {
                        return post.querySelector(selector) ? post.querySelector(selector).getAttribute(attribute) : false;
                    } else {
                        return post.querySelector(selector) ? post.querySelector(selector).textContent.trim() : false;
                    }
                };

                // Scrape post details
                // let date = elementExists('a.gmql0nx0.gpro0wi8.b1v8xokw');
                let postURL = elementExists('.dp1hu0rb.dhp61c6y.iyyx5f41 > a', true, 'href');
                let textContent = elementExists('[data-ad-preview="message"]');
                let image = elementExists('img.k4urcfbm.bixrwtb6', true, 'src');
                let quote = elementExists('.kr520xx4.k4urcfbm .hcukyx3x.c1et5uql');
                let comments = elementExists('.p1ueia1e div:nth-child(2)');
                console.log(comments);
                comments = comments ? comments.replace(' Comments', '') : false;
                let shares = elementExists('.p1ueia1e div:nth-child(3)');
                console.log(shares);
                shares = shares ? shares.replace(' Comments', '') : false;

                return { postURL, textContent, image, quote, comments, shares };
            });

            // Save post to MongoDB
            const userPost = new Models.UserPost(result);
            userPost.save();

            // Push post to results array
            results.push(result);
        }

        return results;
    }
};

module.exports = facebook;