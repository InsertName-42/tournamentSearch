const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SCRYFALL_BULK_URL = "https://api.scryfall.com/bulk-data";
const OUTPUT_PATH = path.resolve('./assets/mtg-cards.json');

async function fetchAndMinifyCards() {
    try {
        console.log("Locating bulk data download URI...");
        const { data: bulkMetadata } = await axios.get(SCRYFALL_BULK_URL);

        const oracleDataInfo = bulkMetadata.data.find(d => d.type === 'oracle_cards');

        console.log(`Downloading ${oracleDataInfo.name}... this may take a minute.`);
        const { data: allCards } = await axios.get(oracleDataInfo.download_uri);

        console.log(`Processing ${allCards.length} cards...`);

        //MINIFICATION: Keep only what we need
        const minifiedCards = allCards.map(card => ({
            id: card.id,
            name: card.name,
            mana_cost: card.mana_cost,
            cmc: card.cmc,
            type_line: card.type_line || "",
            oracle_text: card.oracle_text || "",
            colors: card.colors || [],
            image_uri: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "",
            rarity: card.rarity,
            legalities: {
                standard: card.legalities.standard,
                modern: card.legalities.modern,
                pauper: card.legalities.pauper,
                vintage: card.legalities.vintage
            }
        }));

        //Ensure the assets folder exists before writing
        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        //Saves to the json file asset
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(minifiedCards, null, 2), 'utf8');
        console.log(`Success! Saved ${minifiedCards.length} minified cards to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error("Failed to fetch or process Scryfall data:", error.message);
    }
}

//Execute the function
fetchAndMinifyCards();