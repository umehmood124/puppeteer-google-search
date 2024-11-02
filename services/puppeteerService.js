// services/puppeteerService.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

exports.searchGoogle = async (searchQuery) => {
    let browser;
    try {
        browser = await initializeBrowser();
        const page = await browser.newPage();

        await setUserAgent(page);
        await navigateToGoogle(page);
        await handleConsentForm(page);
        await takeScreenshot(page, 'after_consent.png');
        await performSearch(page, searchQuery);
        const results = await extractResults(page);

        return results;
    } catch (error) {
        console.error('Error in puppeteerService:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// Initializes the Puppeteer browser instance
async function initializeBrowser() {
    return await puppeteer.launch({
        headless: false, // Set to true in production
        slowMo: 50,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
    });
}

// Sets a realistic User-Agent to mimic a real browser
async function setUserAgent(page) {
    const userAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/89.0.4389.82 Safari/537.36';
    await page.setUserAgent(userAgent);
}

// Navigates to Google's homepage
async function navigateToGoogle(page) {
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
}

// Handles Google's consent form if it appears
async function handleConsentForm(page) {
    const agreeButtonSelectors = [
        'button#L2AGLb',
        'button[aria-label="Accept all"]',
        'button[aria-label*="consent"]',
        'div[role="none"] button + button',
    ];
    try {
        for (const selector of agreeButtonSelectors) {
            const agreeButton = await page.$(selector);
            if (agreeButton) {
                await agreeButton.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
                break;
            }
        }
    } catch (err) {
        console.log('No consent form found or error in handling consent:', err);
    }
}

// Performs the search with the given query
async function performSearch(page, searchQuery) {
    try {
        await page.waitForSelector('textarea[name="q"]', { visible: true, timeout: 10000 });
        await page.type('textarea[name="q"]', searchQuery, { delay: 100 });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } catch (err) {
        await takeScreenshot(page, 'error_input_not_found.png');
        throw new Error('Search input not found on the page.');
    }
}

// Extracts the titles of the first 10 search results
async function extractResults(page) {
    try {
        await page.waitForSelector('h3', { visible: true, timeout: 10000 });
        const results = await page.evaluate(() => {
            const titles = [];
            const elements = document.querySelectorAll('h3');
            for (let i = 0; i < elements.length && titles.length < 10; i++) {
                const title = elements[i].innerText;
                if (title) {
                    titles.push(title);
                }
            }
            return titles;
        });
        return results;
    } catch (err) {
        console.log(err)
        await takeScreenshot(page, 'error_results_not_found.png');
        throw new Error('Search results not found on the page.');
    }
}

// Takes a screenshot of the current page
async function takeScreenshot(page, filename) {
    await page.screenshot({ path: filename, fullPage: true });
}
