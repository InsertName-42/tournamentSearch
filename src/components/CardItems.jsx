import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image'; // High-performance alternative to standard React Native Image

/*
 * CardItem Component
 * A single row in the main Gallery list.
 * {Object} card - The card data object (id, name, image_uri, etc.)
 * {Number} playCount - The frequency this card appears in tournament data
 */
const CardItem = ({ card, playCount }) => {
  return (
    //Put image and text side-by-side
    <View style={styles.cardRow}>
      
      {/* EXPO-IMAGE: 
      Used to handle 30,000 images at once
          - contentFit="contain": Ensures the card art isn't cropped or stretched.
          - cachePolicy="disk": Saves the image to the phone's storage so it can load instantly
      */}
      <Image
        style={styles.art}
        source={{ uri: card.image_uri }}
        contentFit="contain"
        cachePolicy="disk"
      />

      {/* Holds the name and the tournament stats */}
      <View style={styles.info}>
        {/* Card title from Scryfall */}
        <Text style={styles.name}>{card.name}</Text>
        
        {/* Play count. Calculated by useTournamentMetrics hook */}
        <Text style={styles.metric}>Tournament Plays: {playCount}</Text>
      </View>
    </View>
  );
};

//Styling for card rows
const styles = StyleSheet.create({
  cardRow: { 
    flexDirection: 'row',       
    padding: 10, 
    borderBottomWidth: 1, 
    borderColor: '#eee',        //Divider line between cards
    backgroundColor: '#fff' 
  },
  art: { 
    width: 50,                  
    height: 70, 
    borderRadius: 4             
  },
  info: { 
    marginLeft: 12, 
    justifyContent: 'center'    
  },
  name: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#1f2937' 
  },
  metric: { 
    color: '#8b5cf6',           
    fontSize: 12, 
    fontWeight: '600',
    marginTop: 4
  }
});

export default CardItem;