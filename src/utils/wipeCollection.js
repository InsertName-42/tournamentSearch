/**
 * Written by Theo Justman 6/2/26 
 * src/utils/wipeCollection.js
 * Automated Batch Purge Tool for Appwrite
 */
require('dotenv').config();

const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey('standard_4325aa7afd346b0d4a872f4e40b43a5bc168fe00211bb9d7c05944f19de311a5541f4e47ed3aee4df382078291d8ebfbc9fd0ec6839146a56d1465393934612edda993ae166accb7a1c633335db2cd6fffa635e867185d1b9c3c79f2a48ad33b4fe9c4b3cbdf29c45ae4421e0cd4d1efc43a4a6cc3d9f42d9540a4c6da44b256');

const databases = new sdk.Databases(client);

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_CARDS_COLLECTION_ID;

async function wipeAllCards() {
    console.log("⚠️ Initializing database purge loop...");
    let runPurge = true;
    let totalPurged = 0;

    try {
        while (runPurge) {
            //Fetch a batch of 100 documents (Appwrite's max limit per request)
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    sdk.Query.limit(100),
                    sdk.Query.select(['$id']) //Only request IDs to minimize payload bandwidth
                ]
            );

            const documents = response.documents;

            if (documents.length === 0) {
                console.log("Collection is completely empty. Purge complete!");
                runPurge = false;
                break;
            }

            console.log(`Deleting batch of ${documents.length} entries...`);

            //Promise.all to fire off the deletion requests in parallel
            await Promise.all(
                documents.map(async (doc) => {
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
                })
            );

            totalPurged += documents.length;
            console.log(`🗑Total records successfully purged so far: ${totalPurged}`);
        }
    } catch (error) {
        console.error("Purge operation halted due to a server error:", error.message);
    }
}

wipeAllCards();