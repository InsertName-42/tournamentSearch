import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://topdeck.gg/api/v2/tournaments";
const API_KEY = process.env.EXPO_PUBLIC_TOPDECK_API_KEY;
//Avaliable formats
const FORMATS = ["Standard", "Modern", "Vintage", "Pauper"];

export default function RandomDeck() {
  const [deckData, setDeckData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("Modern");
  const fetchRandomDeck = (format = selectedFormat) => {
    setLoading(true);
    setDeckData(null);

    //Determine a 90 day window ending 30 days ago
    const now = Math.floor(Date.now() / 1000);
    const secondsInDay = 86400;
    const endTime = now - (30 * secondsInDay);
    const startTime = endTime - (90 * secondsInDay);

    //API call
    axios.post(API_URL, {
      start: startTime,
      end: endTime,
      game: "Magic: The Gathering",
      format: format,
      columns: ["name", "decklist"],
      participantMin: 5,
    }, {
      headers: { Authorization: API_KEY }
    })
    .then(({ data }) => {
      if (data && data.length > 0) {
        //Use only standings with decks
        const validTournaments = data.filter(t => t.standings && t.standings.some(p => p.deckObj));
        
        //Get a random deck and its tournament and player info
        if (validTournaments.length > 0) {
          const randomTourney = validTournaments[Math.floor(Math.random() * validTournaments.length)];
          const playersWithDecks = randomTourney.standings.filter(p => p.deckObj);
          const player = playersWithDecks[Math.floor(Math.random() * playersWithDecks.length)];
          
          setDeckData({
            player: player.name,
            tournament: randomTourney.tournamentName,
            sections: player.deckObj,
            date: new Date(randomTourney.startDate * 1000).toLocaleDateString()
          });
          //Error handling
        } else {
          alert("Found tournaments, but no decks were available.");
        }
      } else {
        alert("No tournaments found within search period.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("API error occurred while fetching decks.");
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRandomDeck();
  }, []);

  //Renders the data collected from the API, excluding non card info
  const renderDeckSections = () => {
  if (!deckData?.sections) return null;

  const IGNORED_KEYS = ["Metadata", "metadata", "game", "format", "importedFrom"];

  return Object.entries(deckData.sections)
    .filter(([sectionName]) => !IGNORED_KEYS.includes(sectionName))
    .map(([sectionName, cards]) => (
      <View key={sectionName} style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{sectionName}</Text>
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

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover Decks</Text>
          <Text style={styles.subtitle}>Searching: 30d ago to 120d ago</Text>
        </View>
        <Pressable onPress={() => fetchRandomDeck()} disabled={loading} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>{loading ? "..." : "Search"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 50 }} />
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
        <View style={styles.emptyState}><Text>Select a format to begin.</Text></View>
      )}

<Pressable 
  onPress={() => Linking.openURL("https://topdeck.gg")}
  style={styles.footer}
>
  <Text style={styles.attribution}>
    Data provided by <Text style={styles.link}>TopDeck.gg</Text>
  </Text></Pressable></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", alignItems: "center" },
  selectorContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", padding: 10, gap: 8 },
  formatBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db" },
  formatBtnActive: { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" },
  formatBtnText: { fontSize: 12, color: "#4b5563" },
  formatBtnTextActive: { color: "#fff", fontWeight: "bold" },
  header: { width: "90%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 15 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  refreshBtn: { backgroundColor: "#111827", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  refreshBtnText: { color: "#fff", fontWeight: "600" },
  deckCard: { width: "92%", flex: 1, backgroundColor: "#fff", borderRadius: 16, elevation: 4, marginBottom: 10 },
  deckInfo: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  playerName: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  tourneyName: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  scrollContent: { padding: 16 },
  sectionContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#ede9fe" },
  cardRow: { flexDirection: "row", marginBottom: 4, alignItems: "center" },
  cardCount: { width: 30, fontSize: 14, fontWeight: "600", color: "#4b5563" },
  cardName: { fontSize: 14, color: "#1f2937" },
  emptyState: { flex: 1, justifyContent: 'center' },
  attribution: { fontSize: 10, color: "#9ca3af", marginBottom: 10 },
  link: { textDecorationLine: "underline", color: "#6366f1"},
});