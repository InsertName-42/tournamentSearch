/**
 * Written by Theo Justman 3/13/26 
 * Single card detail view for tournament search results, accessed by tapping on a card in the results list.
 */
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';

//Point these hooks directly to your database
import { useCards } from '../../src/context/CardContext';
import { useTournamentMetrics } from '../../src/hooks/useTournamentMetrics';

export default function CardDetail() {
    const { cardName: rawCardName, format } = useLocalSearchParams();
    const router = useRouter();

    const { cards: databaseCards, queryCardsFromDatabase, searchLoading } = useCards();
    const [localFetchLoading, setLocalFetchLoading] = useState(false);

    //Dynamic Parameter Decoder for Safe Native Cross-Platform Matching
    const cardName = useMemo(() => {
        if (!rawCardName) return "";
        return decodeURIComponent(rawCardName);
    }, [rawCardName]);

    //Tournament Metrics Lookup Pipeline
    const { rawData, metrics } = useTournamentMetrics(format || 'Modern');

    //Split card names
    const cleanCardName = useMemo(() =>
        cardName ? cardName.split(" // ")[0].trim() : "",
        [cardName]
    );

    /**
     * CACHE DATA LOOKUP
     */
    const card = useMemo(() => {
        if (!databaseCards || !cardName) return null;
        return databaseCards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
    }, [cardName, databaseCards]);

    /**
     * FETCH GUARD
     */
    useEffect(() => {
        if (!card && cardName && !searchLoading && !localFetchLoading) {
            console.log(`📡 Detail cache miss: Fetching target document [${cardName}] from cloud...`);
            setLocalFetchLoading(true);
            queryCardsFromDatabase(cardName, format || 'Modern')
                .catch(err => console.log("Failed to load explicit card profile line:", err.message))
                .finally(() => setLocalFetchLoading(false));
        }
    }, [card, cardName]);

    /**
     * DECK LIST RECENT APPEARANCES
     */
    const appearances = useMemo(() => {
        if (!rawData || !cleanCardName) return [];
        const foundDecks = [];

        rawData.forEach((tourney, tIdx) => {
            tourney.standings?.forEach((player, pIdx) => {
                if (player.deckObj) {
                    const isInDeck = Object.values(player.deckObj).some(section =>
                        typeof section === 'object' &&
                        Object.keys(section).some(name => name.toLowerCase() === cleanCardName.toLowerCase())
                    );

                    if (isInDeck) {
                        const mainCount = player.deckObj.mainboard?.[cardName]?.count || player.deckObj.mainboard?.[cleanCardName]?.count || 0;
                        const sideCount = player.deckObj.sideboard?.[cardName]?.count || player.deckObj.sideboard?.[cleanCardName]?.count || 0;

                        foundDecks.push({
                            id: `${tourney.tournamentName}-${player.name || 'Unknown'}-${tIdx}-${pIdx}`,
                            player: player.name || 'Unknown Player',
                            tournament: tourney.tournamentName,
                            deckObj: player.deckObj,
                            count: mainCount || sideCount || '?'
                        });
                    }
                }
            });
        });
        return foundDecks;
    }, [rawData, cardName, cleanCardName]);

    const isLoading = searchLoading || localFetchLoading || !card;
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingSubtitle}>Syncing profile data for {cardName || "Card"}...</Text>
            </View>
        );
    }

    //Fallback if image_uri isn't fully updated
    const cardArtUrl = card.image_uri || "https://cards.scryfall.io/large/front/0/c/0c082aa8-bf7f-47f3-baf8-43ad253fd7d7.jpg";

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Image
                source={{ uri: cardArtUrl }}
                style={styles.fullArt}
                contentFit="contain"
                cachePolicy="disk"
            />

            <View style={styles.infoSection}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{card.name}</Text>
                    {/* Renders color abbreviations */}
                    {card.colors && card.colors.length > 0 && (
                        <Text style={styles.colorIdentityBadge}>
                            {card.colors.join('')}
                        </Text>
                    )}
                </View>

                <Text style={styles.type}>{card.type_line}</Text>

                {/* Oracle Display Panel */}
                {card.oracle_text ? (
                    <View style={styles.oracleTextBox}>
                        <Text style={styles.oracleTextContent}>{card.oracle_text}</Text>
                    </View>
                ) : (
                    <View style={styles.oracleTextBox}>
                        <Text style={styles.oracleTextFallback}>No text or vanilla rules block available for this record profile.</Text>
                    </View>
                )}

                {/* Tournament Metrics Box */}
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Tournament Frequency</Text>
                    <Text style={styles.statValue}>
                        {metrics && (metrics[cardName] !== undefined ? metrics[cardName] : (metrics[cleanCardName] || 0))} Total Copies
                    </Text>
                </View>
            </View>

            <View style={styles.deckSection}>
                <Text style={styles.sectionTitle}>Recent Tournament Decks</Text>
                {appearances.length === 0 ? (
                    <Text style={styles.emptyText}>No recent matching tournament lists recorded for this format constraint.</Text>
                ) : (
                    appearances.map((item) => (
                        <Pressable
                            key={item.id}
                            style={styles.deckRow}
                            onPress={() => router.push({
                                pathname: "/deckDisplay",
                                params: { deckData: JSON.stringify(item.deckObj) }
                            })}
                        >
                            <View style={styles.deckMetaData}>
                                <Text style={styles.playerName}>{item.player}</Text>
                                <Text style={styles.tourneyName} numberOfLines={1}>{item.tournament}</Text>
                            </View>
                            <Text style={styles.cardCount}>x{item.count} ➔</Text>
                        </Pressable>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    scrollContent: { paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
    loadingSubtitle: { marginTop: 12, color: '#6b7280', fontSize: 14, fontWeight: '500' },
    fullArt: { width: '100%', height: 380, marginTop: 16 },
    infoSection: { paddingHorizontal: 20, paddingTop: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    title: { fontSize: 22, fontWeight: '800', color: '#111827', flex: 1 },
    colorIdentityBadge: { backgroundColor: '#e5e7eb', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, fontSize: 12, fontFamily: 'monospace', fontWeight: '700', color: '#4b5563', borderWidth: 1, borderColor: '#d1d5db' },
    type: { fontSize: 14, color: '#6b7280', marginBottom: 12, fontStyle: 'italic' },

    oracleTextBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    oracleTextContent: { fontSize: 14, color: '#1f2937', lineHeight: 22, fontWeight: '400' },
    oracleTextFallback: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },

    statBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
    statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#8b5cf6', marginTop: 2 },
    deckSection: { paddingHorizontal: 20, paddingTop: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    emptyText: { color: '#9ca3af', fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
    deckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 14, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
    deckMetaData: { flex: 1, paddingRight: 16 },
    playerName: { fontWeight: '600', color: '#1f2937', fontSize: 14 },
    tourneyName: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
    cardCount: { fontWeight: 'bold', color: '#8b5cf6', fontSize: 14 }
});