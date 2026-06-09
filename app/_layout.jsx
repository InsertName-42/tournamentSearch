/**
 * app/_layout.jsx
 * Root layout — updated for Datamine with:
 * 1. react-native-url-polyfill  (must be the very first import)
 * 2. AuthProvider               (wraps everything so all screens can read auth state)
 * 3. Auth-based redirect logic  (sends unauthenticated users to /(auth) safely)
 */

import 'react-native-url-polyfill/auto';

import { Stack, useRouter, useSegments } from 'expo-router';
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    Modal,
    TouchableWithoutFeedback,
    Platform,        
    TouchableOpacity  
} from 'react-native';
import { useEffect, useState, createContext, useContext } from 'react';
import { CardProvider } from '../src/context/CardContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

//Cntext to toggle the layout dropdown menu state from header buttons
const DropdownContext = createContext();

/**
 * NavigationGuard
 * Watches session states and redirects accordingly.
 */
function NavigationGuard({ children }) {
    const { user, authLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (authLoading) return;
        const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)/deckbuilder');
        }
    }, [user, authLoading, segments]);

    if (authLoading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return children;
}

/**
 * GlobalDropdownOverlay
 * Renders the floating dark overlay menu dynamically below the header pane.
 */
function GlobalDropdownOverlay({ children }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const { logout, user } = useAuth();
    const router = useRouter();

    const handleNavigate = (path) => {
        setMenuOpen(false);
        router.push(path);
    };

    const handleLogoutClick = async () => {
        setMenuOpen(false);
        await logout();
    };

    return (
        <DropdownContext.Provider value={{ menuOpen, setMenuOpen }}>
            {children}

            {/* Modal-driven floating context dropdown to ensure it overlays all native app screens */}
            <Modal
                transparent={true}
                visible={menuOpen && !!user}
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.dropdownMenu}>
                            <Text style={styles.userLabel} numberOfLines={1}>
                                {user?.email}
                            </Text>
                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleNavigate('/(tabs)/deckbuilder')}
                            >
                                <Text style={styles.menuItemText}>🃏 Deck Manager</Text>
                            </TouchableOpacity>

                            {/* Pointed matching destination segment path precisely to current active index root tab mapping context */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleNavigate('/')}
                            >
                                <Text style={styles.menuItemText}>🔍 Tournament Search</Text>
                            </TouchableOpacity>

                            {/* Integrated Discover Decks action track entry parameter link maps */}
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleNavigate('/random')}
                            >
                                <Text style={styles.menuItemText}>🎲 Discover Decks</Text>
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={[styles.menuItem, styles.logoutItem]}
                                onPress={handleLogoutClick}
                            >
                                <Text style={styles.logoutItemText}>🚪 Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </DropdownContext.Provider>
    );
}

/**
 * HeaderRightDropdownTrigger
 * Reusable icon element placed in the top right of screen stack headers.
 */
function HeaderRightDropdownTrigger() {
    const { setMenuOpen } = useContext(DropdownContext);
    const { user } = useAuth();

    if (!user) return null;

    return (
        <Pressable
            onPress={() => setMenuOpen(prev => !prev)}
            style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressedBtn]}
        >
            <Text style={styles.headerIconText}>☰</Text>
        </Pressable>
    );
}

export default function RootLayout() {
    const router = useRouter();

    return (
        <AuthProvider>
            <CardProvider>
                <NavigationGuard>
                    <GlobalDropdownOverlay>
                        <Stack
                            screenOptions={{
                                headerStyle: { backgroundColor: '#111827' },
                                headerTintColor: '#fff',
                                headerTitleStyle: { fontWeight: 'bold' },
                                headerRight: () => <HeaderRightDropdownTrigger />,
                                headerTitleAlign: 'center',
                            }}
                        >
                            <Stack.Screen
                                name="(auth)"
                                options={{ headerShown: false }}
                            />

                            {/* Disable double headers so tabs can style independently */}
                            <Stack.Screen
                                name="(tabs)"
                                options={{
                                    headerShown: false,
                                }}
                            />

                            <Stack.Screen
                                name="(tabs)/deckbuilder"
                                options={{ title: 'Deckbuilder' }}
                            />

                            <Stack.Screen
                                name="index"
                                options={{ title: 'Tournament Search' }}
                            />

                            {/* Match your dynamic folder directory parameters */}
                            <Stack.Screen
                                name="cardDetail/[cardName]"
                                options={{ title: 'Card Profile' }}
                            />

                            <Stack.Screen
                                name="deckDisplay"
                                options={{
                                    title: 'Deck Explorer',
                                    headerRight: () => (
                                        <View style={styles.combinedHeaderRight}>
                                            <Pressable
                                                onPress={() => router.push('/random')}
                                                style={({ pressed }) => [
                                                    styles.headerBtn,
                                                    { opacity: pressed ? 0.5 : 1 },
                                                ]}
                                            >
                                                <Text style={styles.headerBtnText}>Random</Text>
                                            </Pressable>
                                            <HeaderRightDropdownTrigger />
                                        </View>
                                    ),
                                }}
                            />

                            <Stack.Screen
                                name="random"
                                options={{ title: 'Discover Decks' }}
                            />
                        </Stack>
                    </GlobalDropdownOverlay>
                </NavigationGuard>
            </CardProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111827',
    },
    //Universal Action Buttons
    headerBtn: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 12,
    },
    headerBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    //Dropdown Header Component Styles
    headerIconBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 4,
    },
    headerIconText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    pressedBtn: {
        opacity: 0.6,
    },
    combinedHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    //Overlay Modal Menu System Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dropdownMenu: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 60, //Adjusts position dynamically below system headers
        right: 16,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 6,
        width: 220,
        borderWidth: 1,
        borderColor: '#374151',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    userLabel: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#374151',
        marginVertical: 4,
    },
    menuItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    menuItemText: {
        color: '#f3f4f6',
        fontSize: 14,
        fontWeight: '600',
    },
    logoutItem: {
        backgroundColor: '#3f1d1d',
    },
    logoutItemText: {
        color: '#fca5a5',
        fontSize: 14,
        fontWeight: '700',
    },
});