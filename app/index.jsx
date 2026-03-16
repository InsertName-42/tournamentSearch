import React, { useState, useMemo, useContext } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from "@shopify/flash-list";
import { CardContext } from '../src/context/CardContext';
import { useTournamentMetrics } from '../src/hooks/useTournamentMetrics';
import { applyFilters } from '../src/utils/filterLogic';

//Prebuilt Components
import FilterBar from '../src/components/FilterBar';
import CardItem from '../src/components/CardItems';

/**
 * This is the main landing page that displays the searchable card database.
 * Combines the data from both sources.
 */
export default function Gallery() {
  const router = useRouter(); 
  
  //Pulls the card list and data-ready status from the Context
  const { allCards, isDataReady } = useContext(CardContext);
  
  /**
   * STATE MANAGEMENT
   * Tracks the currently selected display settings
   */
  const [format, setFormat] = useState('Modern');
  const [sortMode, setSortMode] = useState('MVP');
  const [filters, setFilters] = useState({ colors: [], type: '' });

  //Fetches play-counts (metrics) whenever the format changes
  const { metrics, loading } = useTournamentMetrics(format);

  /**
   * Data Implimentation-
   * useMemo ensures we only re-filter and re-sort when a filter or sort changes
   */
  const displayedCards = useMemo(() => {
    //If the 15MB JSON isn't loaded yet, show nothing
    if (!isDataReady || !allCards) return [];

    //FILTERING: Reduces 30,000 cards down to a smaller set based on color/type
    const filtered = applyFilters(allCards, filters, format);

    //SORTING: Organizes the filtered cards based on their tournament play rates
    return filtered.sort((a, b) => {
      const countA = metrics[a.name] || 0;
      const countB = metrics[b.name] || 0;

      if (sortMode === 'MVP') {
        //Sorts from highest play count to lowest
        return countB - countA;
      } else {
        //'Underplayed': sort ascending with 1
        if (countA === 0) return 1;
        if (countB === 0) return -1;
        return countA - countB;
      }
    });
  }, [allCards, isDataReady, metrics, filters, format, sortMode]);

  //Shows screen spinner if data is loading and there are no cards to show
  if (loading && displayedCards.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter UI: Pass state and setter functions as props */}
      <FilterBar 
        format={format} 
        setFormat={setFormat} 
        filters={filters} 
        setFilters={setFilters} 
        sortMode={sortMode}
        setSortMode={setSortMode}
      />
      
      {/*
          FLASH LIST:'recycles' views to handle 30,000 items with minimal memory usage.
      */}
      <FlashList
        data={displayedCards}
        renderItem={({ item }) => (
          //Pressable makes each card row interactive
          <Pressable 
            onPress={() => router.push({
              pathname: "/cardDetailScreen",
              params: { cardName: item.name } //Pass card name to the detail screen
            })}
            //Slightly transparent when pressed
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <CardItem 
              card={item} 
              playCount={metrics[item.name] || 0} 
            />
          </Pressable>
        )}
        //Calculate scrollbar height before rendering
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