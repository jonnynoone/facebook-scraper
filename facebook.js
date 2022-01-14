const puppeteer = require('puppeteer');

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
            results.push(await item.evaluate((node, BASE_URL) => {
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
            }, BASE_URL));
        }
        
        return results;
    }
};

module.exports = facebook;