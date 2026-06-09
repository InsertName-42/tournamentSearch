/**
 * src/context/CardContext.jsx
 * Advanced Tokenized Search Engine for Datamine
 */
import React, { createContext, useState, useContext } from 'react';
import { Client, Databases, Query } from 'react-native-appwrite';

const CardContext = createContext();

const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

export const CardProvider = ({ children }) => {
    const [cards, setCards] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
    const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_CARDS_COLLECTION_ID;

    const queryCardsFromDatabase = async (searchText, formatFilter = 'Modern') => {
        setSearchLoading(true);
        setSearchError(null);

        try {
            const queries = [];

            //Format Eligibility Filter
            if (formatFilter) {
                const formatKey = `legalities_${formatFilter.toLowerCase()}`;
                queries.push(Query.equal(formatKey, 'legal'));
            }

            //Syntax Parser Logic
            if (searchText && searchText.trim().length > 0) {
                let remainingText = searchText;
                const oracleMatches = [];

                //Extract the contents inside o:"..." blocks
                const oracleRegex = /o:"([^"]+)"/gi;
                let match;

                while ((match = oracleRegex.exec(searchText)) !== null) {
                    oracleMatches.push(match[1].trim());
                }

                //Clean the remaining text to remove the parsed o:"..." tags
                remainingText = remainingText.replace(oracleRegex, '').replace(/\s+/g, ' ').trim();

                //Build Appwrite query rules for each o: token
                oracleMatches.forEach(oracleText => {
                    queries.push(Query.contains('oracle_text', oracleText));
                });

                //Anything left outside of an o: tag represents part of the card's name
                if (remainingText.length > 0) {
                    queries.push(Query.contains('name', remainingText));
                }
            } else {
                //Default fallback if query box is cleared
                queries.push(Query.orderAsc('name'));
            }

            queries.push(Query.limit(50000));

            console.log(`📡 Dispatching Syntax Query Tree to Appwrite against: "${searchText}"`);

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                queries
            );

            setCards(response.documents);
            return response.documents;

        } catch (error) {
            console.error("❌ Syntax engine query rejected by Appwrite:", error.message);
            setSearchError(error.message);
            throw error;
        } finally {
            setSearchLoading(false);
        }
    };

    return (
        <CardContext.Provider value={{ cards, searchLoading, searchError, queryCardsFromDatabase }}>
            {children}
        </CardContext.Provider>
    );
};

export const useCards = () => useContext(CardContext);