import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { CardContext } from '../src/context/CardContext';
import { useTournamentMetrics } from '../src/hooks/useTournamentMetrics';

/**
 * This component displays specific details for a single Magic card.
 * It receives the 'cardName' via the URL and finds the matching data.
 */
export default function CardDetail() {
  //useLocalSearchParams pulls the 'cardName' variable passed from the Gallery screen URL
  const { cardName, format } = useLocalSearchParams(); 
  
  //Access the cards, loaded in our CardProvider
  const { allCards } = useContext(CardContext);
  
  //Allows navigation
  const router = useRouter();
  
  /**
   * 1. DATA LOOKUP
   * Search the local card list to find the one matching the name from the URL.
   * useMemo ensures we don't re run this search unless allCards or cardName changes.
   */
  const card = useMemo(() => 
    allCards.find(c => c.name === cardName), 
    [cardName, allCards]
  );

  /**
   * 2. TOURNAMENT DATA
   * Get 'metrics' (total counts) and 'rawData' (the actual tournament lists).
   */
  const { rawData, metrics } = useTournamentMetrics(format || 'Modern'); 

  /**
   * 3. DECK AGGREGATION
   * Find every instance where this card was played by a specific player in a specific tournament.
   */
  const appearances = useMemo(() => {
    //If data isn't loaded yet, return an empty array
    if (!rawData || !cardName) return [];
    const foundDecks = [];
    
    //Tournaments -> Standings -> Deck Objects
    rawData.forEach((tourney, tIdx) => {
      tourney.standings?.forEach((player, pIdx) => {
        if (player.deckObj) {
          //Check if the card exists in any part of the deck (Mainboard or Sideboard)
          const isInDeck = Object.values(player.deckObj).some(section => 
            typeof section === 'object' && 
            Object.keys(section).some(name => name.toLowerCase() === cardName.toLowerCase())
          );
          
          if (isInDeck) {
            foundDecks.push({
              //ID is a combination of multiple values to prevent repeats
              id: `${tourney.tournamentName}-${player.name || 'Unknown'}-${tIdx}-${pIdx}`,
              player: player.name || 'Unknown Player',
              tournament: tourney.tournamentName,
              deckObj: player.deckObj, //Full deck object to pass it to the next screen
              count: player.deckObj.mainboard?.[cardName]?.count || 
                     player.deckObj.sideboard?.[cardName]?.count || '?'
            });
          }
        }
      });
    });
    return foundDecks;
  }, [rawData, cardName]);

  //Loading state if the card isn't found in the local database yet
  if (!card) return <View style={styles.center}><Text>Searching for {cardName}...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      {/* Image component that caches the card art to the phone's disk */}
      <Image 
        source={{ uri: card.image_uri }} 
        style={styles.fullArt} 
        contentFit="contain" 
        cachePolicy="disk"
      />
      
      {/* General Card Information Section */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>{card.name}</Text>
        <Text style={styles.type}>{card.type_line}</Text>
        
        {/* Stat Box */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Tournament Frequency</Text>
          <Text style={styles.statValue}>{metrics[cardName] || 0} Total Copies</Text>
        </View>
      </View>

      {/* Recent Appearances */}
      <View style={styles.deckSection}>
        <Text style={styles.sectionTitle}>Recent Tournament Decks</Text>
        {appearances.map((item) => (
          //Pressable allows the user to click a player's name to see their whole deck
          <Pressable 
            key={item.id} 
            style={styles.deckRow}
            onPress={() => router.push({
              pathname: "/deckDisplay",
              //Stringify the deck object to pass it through the URL search params
              params: { deckData: JSON.stringify(item.deckObj) }
            })}
          >
            <View>
              <Text style={styles.playerName}>{item.player}</Text>
              <Text style={styles.tourneyName}>{item.tournament}</Text>
            </View>
            <Text style={styles.cardCount}>x{item.count} ➔</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullArt: { width: '100%', height: 400, marginTop: 20 },
  infoSection: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  type: { fontSize: 16, color: '#6b7280', marginBottom: 15 },
  statBox: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 12 },
  statLabel: { fontSize: 12, color: '#4b5563', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#8b5cf6' },
  deckSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  deckRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderColor: '#f3f4f6' 
  },
  playerName: { fontWeight: '600', color: '#1f2937' },
  tourneyName: { fontSize: 12, color: '#9ca3af' },
  cardCount: { fontWeight: 'bold', color: '#8b5cf6' }
});