import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
//This Context Provider allows every screen to access the card database
import { CardProvider } from '../src/context/CardContext';

/**
 * This is the top-level wrapper for the entire application.
 * It defines how different screens transition and provides a shared UI (header)
 */
export default function RootLayout() {
  //Allows navigation through router.push to create navigational onpressable elements
  const router = useRouter();

  return (
    //Everything is wrapped in the cardprovider so data only need load once
    <CardProvider>
      <Stack
        screenOptions={{
          //Header styling
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#fff',                    
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* 
          Use name (matches filename) to add properties to a screen
        */}
        
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Tournament Search',
          }} 
        />

        <Stack.Screen 
          name="cardDetailScreen" 
          options={{ title: 'Card Details' }} 
        />

        <Stack.Screen 
          name="deckDisplay" 
          options={{ 
            title: 'Deck Explorer',
            //Random deck button
            headerRight: () => (
              <Pressable 
                onPress={() => router.push('/random')}
                style={({ pressed }) => [
                  styles.headerBtn,
                  //Button dims slightly when tapped
                  { opacity: pressed ? 0.5 : 1 }
                ]}
              >
                <Text style={styles.headerBtnText}>Random</Text>
              </Pressable>
            ), 
          }} 
        />

        <Stack.Screen 
          name="random" 
          options={{ title: 'Discover Decks' }} 
        />
      </Stack>
    </CardProvider>
  );
}

//Header styling
const styles = StyleSheet.create({
  headerBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  headerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});