const axios = require('axios');

/**
 * Service to fetch news using Bing News Search API (v7)
 * Requires: AZURE_AI_SERVICES_KEY (or BING_SEARCH_KEY)
 */
const fetchNews = async (query) => {
    const apiKey = process.env.AZURE_AI_SERVICES_KEY || process.env.BING_SEARCH_KEY;

    if (!apiKey) {
        console.warn("⚠️ Missing AZURE_AI_SERVICES_KEY or BING_SEARCH_KEY in .env");
        return null;
    }

    try {
        console.log(`🔎 Fetching News for: "${query}"`);
        const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=5&mkt=en-US&sortBy=Date`;

        const response = await axios.get(url, {
            headers: { 'Ocp-Apim-Subscription-Key': apiKey }
        });

        if (response.data && response.data.value && response.data.value.length > 0) {
            console.log(`✅ Found ${response.data.value.length} articles.`);
            return response.data.value.map(article => ({
                name: article.name,
                description: article.description,
                provider: article.provider?.[0]?.name || 'Unknown',
                date: article.datePublished,
                url: article.url
            }));
        }

        console.log("⚠️ No news found.");
        return [];
    } catch (error) {
        console.error("❌ Bing News API Error:", error.response ? error.response.data : error.message);
        return null; // Return null to indicate failure
    }
};

module.exports = { fetchNews };
