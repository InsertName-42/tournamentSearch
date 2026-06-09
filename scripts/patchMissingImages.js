/**
 * scripts/patchMissingImages.js
 * Fixes missing card images in the local JSON by re-fetching from Scryfall for any cards that lack an image URI.
 */
require('dotenv').config();
const { Client, Databases } = require('node-appwrite');
const path = require('path');
const fs = require('fs');

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '6a26dcb7000a542060a4')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '6a26f98a0006efcce7cd';
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_CARDS_COLLECTION_ID || 'cards';
const DATA_PATH = path.resolve(process.cwd(), './assets/mtg-cards.json');

const CHUNK_SIZE = 15;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function patchMissingImages() {
    if (!fs.existsSync(DATA_PATH)) {
        console.error("❌ Aborted: mtg-cards.json is missing from your assets folder.");
        return;
    }

    const cards = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    console.log(`🔍 Loaded ${cards.length} local reference cards. Initiating missing image patch scanning...`);

    let patchedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < cards.length; i += CHUNK_SIZE) {
        const chunk = cards.slice(i, i + CHUNK_SIZE);

        await Promise.all(chunk.map(async (card) => {
            //Match how they exist in Appwrite
            const safeDocId = card.id ? card.id.replace(/[^a-zA-Z0-9_\.\-]/g, '') : null;
            if (!safeDocId) return;

            const localImageUri = card.image_uri || "";

            // If local doesn't have an image, skip it
            if (!localImageUri) {
                skippedCount++;
                return;
            }

            try {
                //Evaluate if the image is actually missing
                const remoteCard = await databases.getDocument(DATABASE_ID, COLLECTION_ID, safeDocId);

                if (!remoteCard.image_uri || remoteCard.image_uri.trim() === "") {
                    //Update only if image_uri field is currently blank
                    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, safeDocId, {
                        image_uri: localImageUri
                    });
                    patchedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                if (error.code === 404) {
                    //Document doesn't exist on remote DB at all
                    skippedCount++;
                } else {
                    errorCount++;
                    console.error(`Error verifying document [${card.name}]:`, error.message);
                }
            }
        }));

        const totalProcessed = Math.min(i + CHUNK_SIZE, cards.length);
        console.log(`Progress: ${totalProcessed}/${cards.length} scanned | Patched: ${patchedCount} | Skipped/Valid: ${skippedCount} | Errors: ${errorCount}`);

        //Pacing break between parallel batches
        await delay(150);
    }

    console.log(`\nImage repair sequence complete!`);
    console.log(`Successfully updated missing fields: ${patchedCount}`);
    console.log(`Skipped (Already valid or missing locally): ${skippedCount}`);
}

patchMissingImages();