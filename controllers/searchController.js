// controllers/searchController.js
const puppeteerService = require('../services/puppeteerService');

exports.search = async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required.' });
    }

    try {
        const results = await puppeteerService.searchGoogle(query);
        res.json({ results });
    } catch (error) {
        console.error('Error in searchController:', error);
        res.status(500).json({ error: error.message });
    }
};
