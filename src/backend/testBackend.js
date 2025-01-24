const { fetchPumpFunTokens } = require("./pumpTokens");

(async () => {
    try {
        const tokens = await fetchPumpFunTokens();
        console.log("Recent Tokens:", tokens);
    } catch (error) {
        console.error("Error fetching tokens:", error);
    }
})();
