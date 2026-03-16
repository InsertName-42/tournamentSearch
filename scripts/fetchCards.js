const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SCRYFALL_BULK_URL = "https://api.scryfall.com/bulk-data";
const OUTPUT_PATH = path.resolve('./assets/mtg-cards.json');

async function fetchAndMinifyCards() {
  try {
    console.log("Locating bulk data download URI...");
    const { data: bulkMetadata } = await axios.get(SCRYFALL_BULK_URL);
    
    //We want 'oracle_cards' to avoid duplicates of the same card with different art
    const oracleDataInfo = bulkMetadata.data.find(d => d.type === 'oracle_cards');
    
    console.log(`Downloading ${oracleDataInfo.name}... this may take a minute.`);
    const { data: allCards } = await axios.get(oracleDataInfo.download_uri);

    console.log(`Processing ${allCards.length} cards...`);

    //MINIFICATION: Keep only what we need for the Results Tool
    const minifiedCards = allCards.map(card => ({
      id: card.id,
      name: card.name,
      mana_cost: card.mana_cost,
      cmc: card.cmc,
      type_line: card.type_line,
      colors: card.colors || [],
      image_uri: card.image_uris?.normal || "", 
      rarity: card.rarity,
      legalities: {
        standard: card.legalities.standard,
        modern: card.legalities.modern,
        pauper: card.legalities.pauper,
        vintage: card.legalities.vintage
      }
    }));

    //Saves to a file the rest of our code references
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(minifiedCards));
    console.log(`Success! ${minifiedCards.length} cards saved to ${OUTPUT_PATH}`);
    
  } catch (error) {
    console.error("Failed to fetch Scryfall data:", error.message);
  }
}

fetchAndMinifyCards();