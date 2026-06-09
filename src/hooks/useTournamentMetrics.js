//Written by Theo Justman 6/2/26 
import { useState, useEffect } from 'react';
import axios from 'axios';

//API Configuration
const API_URL = "https://topdeck.gg/api/v2/tournaments";
const API_KEY = process.env.EXPO_PUBLIC_TOPDECK_API_KEY;

/**
 * This fetches tournament data and calculates how often each card appears.
 * {string} format - The format to fetch
 */
export const useTournamentMetrics = (format) => {
  //metrics: Keys are card names and values are total play counts
  const [metrics, setMetrics] = useState({});
  //rawData: Stores the full API response
  const [rawData, setRawData] = useState([]); 
  //loading: Tracks if loading is in progress
  const [loading, setLoading] = useState(true);
  /**
   * This effect runs every time the format changes.
   */
  useEffect(() => {
    const fetchAndAggregate = async () => {
      setLoading(true);
      setMetrics({}); 
      setRawData([]);
      try {
        //Calculate a 120-day window
        const now = Math.floor(Date.now() / 1000);
        const startTime = now - (120 * 86400); 
        const endTime = now;

        //POST request to the TopDeck API
        const { data } = await axios.post(API_URL, {
          start: startTime,
          end: endTime,
          game: "Magic: The Gathering",
          format: format,
          columns: ["name", "decklist"],
        }, { headers: { Authorization: API_KEY } });

        /**
         * Card frequencies.
         */
        const counts = {};
        data.forEach(tournament => {
          tournament.standings?.forEach(player => {
            //If the player submitted a valid deck object
            if (player.deckObj) {
              //Loop through deck sections (Mainboard, Sideboard)
              Object.values(player.deckObj).forEach(section => {
                //Check that the section is a card list and not a metadata string
                if (typeof section === 'object') {
                  //Iterate through every card in the section
                  Object.entries(section).forEach(([cardName, info]) => {
                    if (cardName) {
                    //Update the running total for this card name
                    counts[cardName] = (counts[cardName] || 0) + (info.count || 0);
                    }
                  });
                }
              });
            }
          });
        });

        //Update states with the processed data
        setMetrics(counts);
        setRawData(data);  
      } catch (error) {
        console.error("Aggregation Error:", error);
      } finally {
        //Loading spinner
        setLoading(false);
      }
    };

    fetchAndAggregate();
  }, [format]);

  //Return the data
  return { metrics, rawData, loading }; 
};