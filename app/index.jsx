/**
 * Written by Theo Justman 3/13/26 
 * Search view
 */
import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from "@shopify/flash-list";

import { useCards } from '../src/context/CardContext';
import { useTournamentMetrics } from '../src/hooks/useTournamentMetrics';
import { applyFilters } from '../src/utils/filterLogic';

import FilterBar from '../src/components/FilterBar';
import CardItem from '../src/components/CardItems';

export default function Gallery() {
    const router = useRouter();

    //Backend state management streams
    const { cards: databaseCards, searchLoading, queryCardsFromDatabase } = useCards();

    //Search Bar Input State
    const [searchQuery, setSearchQuery] = useState('');

    //Filter Layout Parameters
    const [format, setFormat] = useState('Modern');
    const [sortMode, setSortMode] = useState('MVP'); //'MVP' or 'Underplayed'
    const [filters, setFilters] = useState({ colors: [], type: '' });
    const [displayMode, setDisplayMode] = useState('text');

    //Pull active play rates 
    const { metrics, loading: metricsLoading } = useTournamentMetrics(format);

    //Database handler
    const handleSearchSubmit = async () => {
        try {
            console.log(`📡 Executing database search for query: "${searchQuery}" in format: ${format}`);
            await queryCardsFromDatabase(searchQuery, format);
        } catch (err) {
            console.log("Failed to query database cards on submit:", err.message);
        }
    };

    //Initial query automatically when the screen mounts + if the format filter changes
    useEffect(() => {
        console.log(`Gallery card fetch triggered for format: ${format}...`);
        queryCardsFromDatabase(searchQuery, format).catch(err =>
            console.log("Failed to load database cards on dependency change:", err.message)
        );
    }, [format]);

    const displayedCards = useMemo(() => {
        if (!databaseCards || databaseCards.length === 0) {
            console.log("Pipeline Alert: Database cards array is empty or unpopulated.");
            return [];
        }

        console.log(`Processing ${databaseCards.length} raw cards through the tournament pipeline...`);
        let processedSet = [];

        try {
            if (typeof applyFilters === 'function') {
                processedSet = applyFilters(databaseCards, filters, format);
            } else {
                processedSet = databaseCards;
            }
        } catch (filterError) {
            console.log("Pipeline Warning: applyFilters crashed. Falling back to raw records.", filterError.message);
            processedSet = databaseCards;
        }

        try {
            //Fallback to empty object if metrics is null/undefined to prevent crashes
            const safeMetrics = metrics || {};

            return [...processedSet].sort((a, b) => {
                const nameA = a?.name || "";
                const nameB = b?.name || "";

                //Clean out split card delimiters (" // ") to accurately align with 
                //external tournament aggregator schemas that log front-face profiles only.
                const cleanNameA = nameA.split(" // ")[0].trim();
                const cleanNameB = nameB.split(" // ")[0].trim();

                //Look up values against full strings first, falling back to clean single-face structures
                const countA = safeMetrics[nameA] !== undefined ? safeMetrics[nameA] : (safeMetrics[cleanNameA] || 0);
                const countB = safeMetrics[nameB] !== undefined ? safeMetrics[nameB] : (safeMetrics[cleanNameB] || 0);

                if (sortMode === 'MVP') {
                    //Calculation safeguard: If metrics haven't finished loading, avoid mis-sorting everything to 0
                    if (countB === countA) {
                        return cleanNameA.localeCompare(cleanNameB);
                    }
                    return countB - countA;
                } else {
                    //Underplayed sorting layer layout rules
                    if (countA === 0 && countB !== 0) return 1;
                    if (countB === 0 && countA !== 0) return -1;
                    if (countA === countB) return cleanNameA.localeCompare(cleanNameB);
                    return countA - countB;
                }
            });
        } catch (sortError) {
            console.log("Pipeline Warning: Sorting logic encountered an error.", sortError.message);
            return processedSet;
        }
    }, [databaseCards, metrics, filters, format, sortMode]);

    //Unified loading feedback display
    const showLoadingSpinner = metricsLoading || (searchLoading && displayedCards.length === 0);

    if (showLoadingSpinner) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FilterBar
                format={format}
                setFormat={setFormat}
                filters={filters}
                setFilters={setFilters}
                sortMode={sortMode}
                setSortMode={setSortMode}
            />

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search card text (e.g., Lightning Bolt)..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.toggleStrip}>
                <TouchableOpacity
                    style={[styles.toggleBlock, displayMode === 'text' && styles.toggleBlockActive]}
                    onPress={() => setDisplayMode('text')}
                >
                    <Text style={[styles.toggleText, displayMode === 'text' && styles.toggleTextActive]}>
                        📄 Classic Text List
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBlock, displayMode === 'image' && styles.toggleBlockActive]}
                    onPress={() => setDisplayMode('image')}
                >
                    <Text style={[styles.toggleText, displayMode === 'image' && styles.toggleTextActive]}>
                        🖼️ Visual Card Grid
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listWrapper}>
                <FlashList
                    key={displayMode}
                    data={displayedCards}
                    numColumns={displayMode === 'image' ? 2 : 1}
                    renderItem={({ item }) => {
                        const cardName = item.name || "";
                        const cleanName = cardName.split(" // ")[0].trim();
                        const finalPlayCount = metrics && (metrics[cardName] !== undefined ? metrics[cardName] : (metrics[cleanName] || 0));

                        return (
                            <Pressable
                                onPress={() => {
                                    console.log(`Native Route Request Dispatching for: ${item.name}`);

                                    //Escape special characters safely so names like "+2 Mace" pass across mobile routing safely.
                                    const dynamicUrlSegment = encodeURIComponent(item.name);

                                    router.push(`/cardDetail/${dynamicUrlSegment}`);
                                }}
                                style={({ pressed }) => [
                                    styles.pressableWrapper,
                                    displayMode === 'image' && styles.pressableGridWrapper,
                                    { opacity: pressed ? 0.6 : 1.0 }
                                ]}
                                pointerEvents="box-only"
                            >
                                <CardItem
                                    card={item}
                                    playCount={finalPlayCount}
                                    displayMode={displayMode}
                                />
                            </Pressable>
                        );
                    }}
                    estimatedItemSize={displayMode === 'image' ? 240 : 80}
                    keyExtractor={(item) => item.$id || item.name}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
    listWrapper: { flex: 1, paddingHorizontal: 4 },

    searchContainer: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
    searchInput: { flex: 1, height: 44, backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 14, color: '#1f2937', borderWidth: 1, borderColor: '#e5e7eb', fontSize: 14 },
    searchButton: { backgroundColor: '#8b5cf6', height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    searchButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

    toggleStrip: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: 12, marginBottom: 8, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
    toggleBlock: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
    toggleBlockActive: { backgroundColor: '#f3f4f6' },
    toggleText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
    toggleTextActive: { color: '#8b5cf6', fontWeight: '700' }
});