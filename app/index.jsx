/**
 * Written by Theo Justman 3/13/26 
 * Search through Magic: the Gathering cards based on their tournament play rates.
 */
import React, { useState, useMemo, useContext } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from "@shopify/flash-list";

// Data & Logic Imports
import { CardContext } from '../src/context/CardContext';
import { useTournamentMetrics } from '../src/hooks/useTournamentMetrics';
import { applyFilters } from '../src/utils/filterLogic';

// Component Imports
import FilterBar from '../src/components/FilterBar';
import CardItem from '../src/components/CardItems';

export default function Gallery() {
  const router = useRouter(); 
  
  // Access the 30,000 cards from your Global Context
  const { allCards, isDataReady } = useContext(CardContext);
  
  // State for Filters
  const [format, setFormat] = useState('Modern');
  const [sortMode, setSortMode] = useState('MVP'); // 'MVP' or 'Underplayed'
  const [filters, setFilters] = useState({ colors: [], type: '' });

  // Get tournament data for the current format
  const { metrics, loading } = useTournamentMetrics(format);

  // The Filter/Sort Pipeline
  const displayedCards = useMemo(() => {
    if (!isDataReady || !allCards) return [];

    // 1. Narrow down cards (Color, Legality, Type)
    const filtered = applyFilters(allCards, filters, format);

    // 2. Sort the smaller result set using tournament metrics
    return filtered.sort((a, b) => {
      const countA = metrics[a.name] || 0;
      const countB = metrics[b.name] || 0;

      if (sortMode === 'MVP') {
        return countB - countA;
      } else {
        // Underplayed logic
        if (countA === 0) return 1;
        if (countB === 0) return -1;
        return countA - countB;
      }
    });
  }, [allCards, isDataReady, metrics, filters, format, sortMode]);

  if (loading && displayedCards.length === 0) {
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
      
      <FlashList
        data={displayedCards}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push({
              pathname: "/cardDetail",
              params: { cardName: item.name }
            })}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <CardItem 
              card={item} 
              playCount={metrics[item.name] || 0} 
            />
          </Pressable>
        )}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id || item.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});