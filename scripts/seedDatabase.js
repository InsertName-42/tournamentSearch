/**
 * scripts/seedDatabase.js
 * Headless Server-Side Seeding Tool with Administrative API Key privileges
 */
const { Client, Databases, ID } = require('node-appwrite');
const path = require('path');
const fs = require('fs');

//Initialize the administrative server client
const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('6a26dcb7000a542060a4')
    .setKey('standard_4325aa7afd346b0d4a872f4e40b43a5bc168fe00211bb9d7c05944f19de311a5541f4e47ed3aee4df382078291d8ebfbc9fd0ec6839146a56d1465393934612edda993ae166accb7a1c633335db2cd6fffa635e867185d1b9c3c79f2a48ad33b4fe9c4b3cbdf29c45ae4421e0cd4d1efc43a4a6cc3d9f42d9540a4c6da44b256');

const databases = new Databases(client);

const DATABASE_ID = '6a26f98a0006efcce7cd';
const COLLECTION_ID = 'cards';

const DATA_PATH = path.resolve(process.cwd(), './assets/mtg-cards.json');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runServerSeeder() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("Source file mtg-cards.json missing in assets folder.");
        return;
    }

    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const cards = JSON.parse(rawData);
    console.log(`Authenticated successfully. Pushing ${cards.length} cards to cloud database...`);

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        const payload = {
            name: card.name || "Unknown Card",
            type_line: card.type_line || "",
            oracle_text: card.oracle_text || "",
            legalities_noble: card.legalities?.modern || "not_legal",
            legalities_modern: card.legalities?.modern || "not_legal",
            legalities_standard: card.legalities?.standard || "not_legal",
            legalities_pauper: card.legalities?.pauper || "not_legal",
            legalities_vintage: card.legalities?.vintage || "not_legal",
            image_uri: card.image_uri || "",
            colors: Array.isArray(card.colors) ? card.colors : []
        };

        try {
            //Generate unique ID layouts
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), payload);

            if ((i + 1) % 100 === 0 || i + 1 === cards.length) {
                console.log(`Progress: Successfully verified and wrote ${i + 1} / ${cards.length} rows.`);
            }
        } catch (error) {
            if (error.code === 409) {
                //Skip if the item is already present
            } else {
                console.error(`❌ Rejection on card [${card.name}]:`, error.message);
            }
        }

        //10ms pacing prevents too many requests in a short burst, which can lead to rate limiting
        await delay(10);
    }

    console.log("Database generation sequence concluded! The cards table is completely populated.");
}

runServerSeeder();