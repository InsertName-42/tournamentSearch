import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";

//Environment variable keep sensitive data out of github
const API_URL = "https://topdeck.gg/api/v2/tournaments";
const API_KEY = process.env.EXPO_PUBLIC_TOPDECK_API_KEY;
const FORMATS = ["Standard", "Modern", "Vintage", "Pauper"];

/**
 * RandomDeck Screen
 * Fetches a random tournament deck within a 90 day window based on format
 */
export default function RandomDeck() {
  const [deckData, setDeckData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("Modern");

  /**
   * DATA FETCHING
   * useCallback ensures the function doesn't change unless 
   * selectedFormat changes, preventing unnecessary effect triggers.
   */
  const fetchRandomDeck = useCallback(async (format = selectedFormat) => {
    setLoading(true);
    setDeckData(null);

    //TIME CALCULATION:
    const now = Math.floor(Date.now() / 1000);
    const secondsInDay = 86400;
    const endTime = now - (30 * secondsInDay);
    const startTime = endTime - (90 * secondsInDay);

    try {
      //POST request to TopDeck to get tournament summaries and decklists
      const { data } = await axios.post(API_URL, {
        start: startTime,
        end: endTime,
        game: "Magic: The Gathering",
        format: format,
        columns: ["name", "decklist"],
        participantMin: 5,            //Only show tournaments with at least 5 players
      }, {
        headers: { Authorization: API_KEY }
      });

      if (data && data.length > 0) {
        /**
         * RANDOM SELECTION PROCESS:
         * Filter out any tournaments that don't actually have deck objects attached.
         */
        const validTournaments = data.filter(t => t.standings && t.standings.some(p => p.deckObj));
        
        if (validTournaments.length > 0) {
          //Pick one tournament from the list at random
          const randomTourney = validTournaments[Math.floor(Math.random() * validTournaments.length)];
          //Pick one player from that tournament who has a valid deck list
          const playersWithDecks = randomTourney.standings.filter(p => p.deckObj);
          const player = playersWithDecks[Math.floor(Math.random() * playersWithDecks.length)];
          
          //Store the processed results
          setDeckData({
            player: player.name || "Unknown Player",
            tournament: randomTourney.tournamentName,
            sections: player.deckObj,
            date: new Date(randomTourney.startDate * 1000).toLocaleDateString()
          });
        } else {
          console.warn("Found tournaments, but no deck objects were attached.");
        }
      }
    } catch (err) {
      console.error("Fetch Random Deck Error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFormat]);

  //Initial load: Fetch a deck when screen opened
  useEffect(() => {
    fetchRandomDeck();
  }, []);

  /**
   * RENDER LOGIC:
   * Maps through the deck sections (Mainboard/Sideboard)
   */
  const renderDeckSections = () => {
    if (!deckData?.sections) return null;
    
    //Don't show noncard metadata
    const IGNORED_KEYS = ["Metadata", "metadata", "game", "format", "importedFrom"];

    return Object.entries(deckData.sections)
      .filter(([sectionName]) => !IGNORED_KEYS.includes(sectionName))
      .map(([sectionName, cards]) => (
        <View key={sectionName} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{sectionName}</Text>
          {/* List every card name and its count within this section */}
          {Object.entries(cards).map(([cardName, info]) => (
            <View key={cardName} style={styles.cardRow}>
              <Text style={styles.cardCount}>{info.count}</Text> 
              <Text style={styles.cardName}>{cardName}</Text>
            </View>
          ))}
        </View>
      ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toggle between formats */}
      <View style={styles.selectorContainer}>
        {FORMATS.map(f => (
          <Pressable 
            key={f} 
            onPress={() => { setSelectedFormat(f); fetchRandomDeck(f); }}
            style={[styles.formatBtn, selectedFormat === f && styles.formatBtnActive]}
          >
            <Text style={[styles.formatBtnText, selectedFormat === f && styles.formatBtnTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover Decks</Text>
          <Text style={styles.subtitle}>Randomly sourcing recent lists</Text>
        </View>
        {/* Manual refresh */}
        <Pressable onPress={() => fetchRandomDeck()} disabled={loading} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>{loading ? "..." : "New Deck"}</Text>
        </Pressable>
      </View>

      {/* Dynamic content: Shows loader, the deck, or an empty state message */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Scouring Tournaments...</Text>
        </View>
      ) : deckData ? (
        <View style={styles.deckCard}>
          <View style={styles.deckInfo}>
            <Text style={styles.playerName}>{deckData.player}</Text>
            <Text style={styles.tourneyName}>{deckData.tournament} • {deckData.date}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {renderDeckSections()}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No decks found for this format.</Text>
        </View>
      )}

      {/* External link to the data source provider (required by api). */}
      <Pressable onPress={() => Linking.openURL("https://topdeck.gg")} style={styles.footer}>
        <Text style={styles.attribution}>
          Data provided by <Text style={styles.link}>TopDeck.gg</Text>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selectorContainer: { flexDirection: "row", justifyContent: "center", padding: 10, gap: 8 },
  formatBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db" },
  formatBtnActive: { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" },
  formatBtnText: { fontSize: 12, color: "#4b5563" },
  formatBtnTextActive: { color: "#fff", fontWeight: "bold" },
  header: { width: "90%", alignSelf: 'center', flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 15 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  refreshBtn: { backgroundColor: "#111827", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  refreshBtnText: { color: "#fff", fontWeight: "600" },
  deckCard: { width: "92%", alignSelf: 'center', flex: 1, backgroundColor: "#fff", borderRadius: 16, elevation: 4, marginBottom: 10, overflow: 'hidden' },
  deckInfo: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", backgroundColor: '#fff' },
  playerName: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  tourneyName: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  scrollContent: { padding: 16 },
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#ede9fe", paddingBottom: 4 },
  cardRow: { flexDirection: "row", marginBottom: 6, alignItems: "center" },
  cardCount: { width: 30, fontSize: 14, fontWeight: "600", color: "#4b5563" },
  cardName: { fontSize: 14, color: "#1f2937" },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 14 },
  emptyText: { color: '#9ca3af' },
  footer: { padding: 15, alignItems: 'center' },
  attribution: { fontSize: 10, color: "#9ca3af" },
  link: { textDecorationLine: "underline", color: "#8b5cf6" },
});