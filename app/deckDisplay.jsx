/**
 * Written by Theo Justman 3/13/26 
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/**
 * DeckDisplay Screen
 * This component is responsible for rendering a full decklist.
 * It receives a stringified deck object from the navigation parameters.
 */
export default function DeckDisplay() {
  //useLocalSearchParams retrieves the 'deckData' string passed from the cardDetail screen
  const { deckData: deckDataParam } = useLocalSearchParams();
  
  //Local state to hold the parsed deck object once it is converted back from a string
  const [deck, setDeck] = useState(null);

  /**
   * DATA PARSING
   * Use useEffect to handle the conversion of the deck data into json
   */
  useEffect(() => {
    if (deckDataParam) {
      try {
        //Convert to json
        setDeck(JSON.parse(deckDataParam));
      } catch (e) {
        //Error ifmalformed or corrupted
        console.error("Failed to parse deck data", e);
      }
    }
  }, [deckDataParam]);

  /**
   * Decks are structured into categories like 'mainboard' and 'sideboard'.
   * This iterates through those categories and builds  using them.
   */
  const renderSections = () => {
    if (!deck) return null;

    //Skip non-card data fields provided by the API
    const IGNORED_KEYS = ["Metadata", "metadata", "game", "format", "importedFrom"];

    //Object.entries converts the deck object into an array we can map through
    return Object.entries(deck)
      .filter(([sectionName]) => !IGNORED_KEYS.includes(sectionName))
      .map(([sectionName, cards]) => (
        <View key={sectionName} style={styles.sectionContainer}>
          {/* Display section heading */}
          <Text style={styles.sectionTitle}>{sectionName}</Text>
          
          {/* Iterates through the cards within this specific section */}
          {Object.entries(cards).map(([cardName, info]) => (
            <View key={cardName} style={styles.cardRow}>
              {/* Displays the quantity of the card */}
              <Text style={styles.cardCount}>{info.count}</Text>
              {/* Displays the name of the card */}
              <Text style={styles.cardName}>{cardName}</Text>
            </View>
          ))}
        </View>
      ));
  };

  //While the deck is still being parsed, show a loading spinner
  if (!deck) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Deck Explorer</Text>
        <Text style={styles.subtitle}>Viewing Meta List</Text>
      </View>
      
      {/* Card container that holds the formatted list */}
      <View style={styles.deckCard}>
        {renderSections()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loader: { flex: 1, justifyContent: 'center' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  deckCard: { 
    margin: 15, 
    padding: 20, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    elevation: 2 
  },
  sectionContainer: { marginBottom: 25 },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#8b5cf6', 
    textTransform: 'uppercase', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6',
    paddingBottom: 5,
    marginBottom: 10 
  },
  cardRow: { flexDirection: 'row', paddingVertical: 4 },
  cardCount: { width: 30, fontWeight: 'bold', color: '#4b5563' },
  cardName: { fontSize: 15, color: '#1f2937' }
});