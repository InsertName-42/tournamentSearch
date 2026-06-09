/**
 * src/utils/seedCards.js
 * Standalone In-Place Image Patch Seeding Script for Node.js
 * Optimized for rate-limiting safety and security.
 */
/*
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import * as sdk from 'node-appwrite';

//Configuration Tweaks
const CHUNK_SIZE = 15;
const MS_BETWEEN_CHUNKS = 100;

const client = new sdk.Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

// Helper function to pause execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const seedCardsToAppwrite = async (localCardsArray) => {
    const dbId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
    const colId = process.env.EXPO_PUBLIC_APPWRITE_CARDS_COLLECTION_ID;

    if (!dbId || !colId || !process.env.APPWRITE_API_KEY) {
        console.error("Missing Config: Please check your root .env file setup entries (including APPWRITE_API_KEY).");
        return;
    }

    let totalProcessed = 0;
    let patchCount = 0;
    let errorCount = 0;
    const totalCards = localCardsArray.length;

    console.log(`Starting synchronization sequence for ${totalCards} cards...`);

    try {
        for (let i = 0; i < totalCards; i += CHUNK_SIZE) {
            const chunk = localCardsArray.slice(i, i + CHUNK_SIZE);

            await Promise.all(chunk.map(async (card) => {
                // Extract image URIs safely
                let cleanImageUri = "";
                if (card.image_uris && card.image_uris.normal) {
                    cleanImageUri = card.image_uris.normal;
                } else if (card.card_faces && card.card_faces[0]?.image_uris?.normal) {
                    cleanImageUri = card.card_faces[0].image_uris.normal;
                }

                // Clean Document ID mapping rules
                const safeDocId = card.id ? card.id.replace(/[^a-zA-Z0-9_\.\-]/g, '') : null;
                if (!safeDocId) return;

                try {
                    //Try to perform an in-place patch
                    await databases.updateDocument(dbId, colId, safeDocId, {
                        image_uri: cleanImageUri
                    });
                    patchCount++;
                } catch (docError) {
                    //Fallback block if the document doesn't exist yet
                    if (docError.code === 404) {
                        try {
                            const fullPayload = {
                                name: card.name || "Unknown Card",
                                type_line: card.type_line || "",
                                oracle_text: card.oracle_text || "",
                                image_uri: cleanImageUri,
                                legalities_noble: card.legalities?.noble || "not_legal",
                                legalities_modern: card.legalities?.modern || "not_legal",
                                legalities_standard: card.legalities?.standard || "not_legal",
                                legalities_pauper: card.legalities?.pauper || "not_legal",
                                legalities_vintage: card.legalities?.vintage || "not_legal",
                                colors: Array.isArray(card.colors) ? card.colors : []
                            };
                            await databases.createDocument(dbId, colId, safeDocId, fullPayload);
                            patchCount++;
                        } catch (createError) {
                            errorCount++;
                            console.error(`Failed to create missing card [${card.name}]:`, createError.message);
                        }
                    } else {
                        errorCount++;
                        console.error(`Patch rejected for card [${card.name}]:`, docError.message);
                    }
                }
            }));

            totalProcessed += chunk.length;
            const percent = ((totalProcessed / totalCards) * 100).toFixed(1);
            console.log(`Progress Sync: ${totalProcessed}/${totalCards} (${percent}%) | Successes: ${patchCount} | Failures: ${errorCount}`);

            // Throttle between chunks to protect your API quotas
            if (i + CHUNK_SIZE < totalCards) {
                await sleep(MS_BETWEEN_CHUNKS);
            }
        }

        console.log(`\Patch Routine Concluded Successfully!`);
        console.log(`Total Cards Successfully Synchronized: ${patchCount}`);
        console.log(`Total Synchronization Rejections: ${errorCount}\n`);
    } catch (error) {
        console.error("Patch engine processing encountered a fatal halt:", error);
    }
};

const runSelfTest = async () => {
    try {
        const dataPath = path.join(process.cwd(), 'assets', 'mtg-cards.json');
        if (!fs.existsSync(dataPath)) {
            console.error(`Seed Launcher Aborted: Could not find file target at: ${dataPath}`);
            return;
        }

        console.log("Reading local card resource data array file...");
        const rawJsonData = fs.readFileSync(dataPath, 'utf-8');
        const parsedCardArray = JSON.parse(rawJsonData);

        await seedCardsToAppwrite(parsedCardArray);
    } catch (err) {
        console.error("Initialization check tracker failed:", err.message);
    }
};

runSelfTest();
*/