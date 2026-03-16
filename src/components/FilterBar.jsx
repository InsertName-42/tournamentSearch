import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

//Constants
const COLORS = ['W', 'U', 'B', 'R', 'G'];
const FORMATS = ['Standard', 'Modern', 'Pauper', 'Vintage'];

/**
 * FilterBar
 * Manages the interface for filtering the card list.
 * Receives its current values and functions as props from Gallery.
 */
const FilterBar = ({ format, setFormat, filters, setFilters, sortMode, setSortMode }) => {
  
  /**
   * COLOR Selector:
   * If a color is clicked, it's either added to the filter list or removed if it was already there.
   */
  const toggleColor = (color) => {
    //Copy of the colors array to maintain immutability
    let newColors = [...filters.colors];
    
    if (newColors.includes(color)) {
      //Remove color if already selected
      newColors = newColors.filter(c => c !== color);
    } else {
      //Add color if not selected
      newColors.push(color);
    }
    
    //Update Gallery state
    setFilters({ ...filters, colors: newColors });
  };

  return (
    <View style={styles.container}>
      
      {/* 
      FORMAT SELECTOR
      */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {FORMATS.map(f => (
          <Pressable 
            key={f} 
            onPress={() => setFormat(f)}
            style={[styles.chip, format === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, format === f && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* COLOR Buttons
          Renders buttons for each color. Styles applied based on if active.
      */}
      <View style={styles.row}>
        {COLORS.map(c => (
          <Pressable 
            key={c} 
            onPress={() => toggleColor(c)}
            //Dynamic Style: color background if selected
            style={[styles.colorCircle, filters.colors.includes(c) && styles[`color${c}`]]}
          >
            <Text style={styles.colorText}>{c}</Text>
          </Pressable>
        ))}
      </View>

      {/* SORT MODE 
          Button row to switch between 'MVP' and 'Underplayed'.
      */}
      <View style={styles.sortRow}>
        <Pressable 
          onPress={() => setSortMode('MVP')}
          style={[styles.sortBtn, sortMode === 'MVP' && styles.sortBtnActive]}
        >
          <Text style={[styles.sortBtnText, sortMode === 'MVP' && { color: '#fff' }]}>
            MVP (Most Played)
          </Text>
        </Pressable>
        
        <Pressable 
          onPress={() => setSortMode('Underplayed')}
          style={[styles.sortBtn, sortMode === 'Underplayed' && styles.sortBtnActive]}
        >
          <Text style={[styles.sortBtnText, sortMode === 'Underplayed' && { color: '#fff' }]}>
            Underplayed
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

//Styles
const styles = StyleSheet.create({
  container: { 
    padding: 10, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#ddd' 
  },
  row: { flexDirection: 'row', marginBottom: 10 },
  
  chip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 15, 
    backgroundColor: '#eee', 
    marginRight: 8 
  },
  chipActive: { backgroundColor: '#8b5cf6' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  
  colorCircle: { 
    width: 35, 
    height: 35, 
    borderRadius: 17.5, 
    backgroundColor: '#eee', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10 
  },
  colorText: { fontWeight: 'bold' },

  //Background colors for color buttons
  colorW: { backgroundColor: '#fffdd6'},
  colorU: { backgroundColor: '#3b82f6' },
  colorB: { backgroundColor: '#1f2937' },
  colorR: { backgroundColor: '#ef4444' },
  colorG: { backgroundColor: '#10b981' },

  sortRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sortBtn: { 
    flex: 1, 
    padding: 8, 
    alignItems: 'center', 
    borderRadius: 4, 
    backgroundColor: '#eee', 
    marginHorizontal: 2 
  },
  sortBtnActive: { backgroundColor: '#111827' },
  sortBtnText: { fontSize: 11, color: '#333', fontWeight: '600' }
});

export default FilterBar;