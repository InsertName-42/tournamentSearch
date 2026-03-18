/**
 * Written by Theo Justman 3/13/26 
 */
import React, { createContext, useState, useEffect } from 'react';
//Import the JSON file generated fetchCards
import rawCardData from '../../assets/mtg-cards.json';

/**
 * CardContext
 * Creates the Context object that components will use to "tune in" to card data 
 */
export const CardContext = createContext();

/**
 * CardProvider Component
 * Wrapper that sits at the very top of the app (in _layout.jsx).
 */
export const CardProvider = ({ children }) => {
  //allCards: The array holding the slimmed-down card objects
  const [allCards, setAllCards] = useState([]);
  
  //isDataReady: A flag used to tell the app when the JSON is fully loaded 
  const [isDataReady, setIsDataReady] = useState(false);

  /**
   * useEffect with an empty array means data is only loaded when the app first launches.
   */
  useEffect(() => {
    setAllCards(rawCardData);
    
    //Signal to the rest of the app that it is now safe to start accessing card data
    setIsDataReady(true);
  }, []);

  return (
    /**
     * CardContext.Provider
     * The data we share globally.
     * {children} represents all the screens (from _layout.jsx).
     */
    <CardContext.Provider value={{ allCards, isDataReady }}>
      {children}
    </CardContext.Provider>
  );
};