/**
 * app/(tabs)/deckbuilder.jsx
 * User Deck Manager & Structured Object Workspace with Dynamic Format Picker
 */
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Pressable,
    FlatList,
    Modal,
    TouchableWithoutFeedback
} from 'react-native';
import { ID, Query } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import { databases } from '../../src/lib/appwrite';
import { useAuth } from '../../src/context/AuthContext';
import { useCards } from '../../src/context/CardContext';

//List of supported formats
const VALID_FORMATS = ['Modern', 'Noble', 'Standard', 'Pauper', 'Vintage'];

export default function DeckbuilderScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { cards: globalDatabaseCards } = useCards();

    //Navigation View Controller State: 'index' | 'editor'
    const [viewMode, setViewMode] = useState('index');

    //Dashboard Index States
    const [userDecks, setUserDecks] = useState([]);
    const [loadingDecks, setLoadingDecks] = useState(false);

    //Active Workspace Editor States
    const [deckId, setDeckId] = useState(null);
    const [deckName, setDeckName] = useState('New Deck Workspace');
    const [selectedFormat, setSelectedFormat] = useState('Modern'); // Default fallback target
    const [formatPickerOpen, setFormatPickerOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    //Each zone is an array of objects: { rawText: String, count: Number, name: String }
    const [mainboard, setMainboard] = useState([{ rawText: '', count: 1, name: '' }]);
    const [sideboard, setSideboard] = useState([{ rawText: '', count: 1, name: '' }]);
    const [maybeboard, setMaybeboard] = useState([{ rawText: '', count: 1, name: '' }]);

    //Load user decks upon layout entry
    useEffect(() => {
        if (user && viewMode === 'index') {
            fetchUserDecks();
        }
    }, [user, viewMode]);

    const fetchUserDecks = async () => {
        setLoadingDecks(true);
        try {
            const response = await databases.listDocuments(
                process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.EXPO_PUBLIC_APPWRITE_DECKS_COLLECTION_ID,
                [Query.equal('userId', user.$id), Query.orderDesc('$createdAt')]
            );
            setUserDecks(response.documents);
        } catch (error) {
            console.error('Failed to fetch user decks:', error);
        } finally {
            setLoadingDecks(false);
        }
    };

    const handleCreateNewDeck = () => {
        setDeckId(null);
        setDeckName('New Deck Workspace');
        setSelectedFormat('Modern');
        setMainboard([{ rawText: '', count: 1, name: '' }]);
        setSideboard([{ rawText: '', count: 1, name: '' }]);
        setMaybeboard([{ rawText: '', count: 1, name: '' }]);
        setViewMode('editor');
    };

    const handleEditDeckSelect = (deckDoc) => {
        setDeckId(deckDoc.$id);
        setDeckName(deckDoc.deckName);
        setSelectedFormat(deckDoc.format || 'Modern');
        setMainboard(JSON.parse(deckDoc.mainboard || '[{"rawText":"","count":1,"name":""}]'));
        setSideboard(JSON.parse(deckDoc.sideboard || '[{"rawText":"","count":1,"name":""}]'));
        setMaybeboard(JSON.parse(deckDoc.maybeboard || '[{"rawText":"","count":1,"name":""}]'));
        setViewMode('editor');
    };

    //Card Row Utility Functions
    const handleRowExpansion = (zone, index) => {
        let list = zone === 'mainboard' ? mainboard : zone === 'sideboard' ? sideboard : maybeboard;
        let setter = zone === 'mainboard' ? setMainboard : zone === 'sideboard' ? setSideboard : setMaybeboard;
        const updated = [...list];
        updated.splice(index + 1, 0, { rawText: '', count: 1, name: '' });
        setter(updated);
    };

    const updateRowText = (zone, index, val) => {
        let list = zone === 'mainboard' ? mainboard : zone === 'sideboard' ? sideboard : maybeboard;
        let setter = zone === 'mainboard' ? setMainboard : zone === 'sideboard' ? setSideboard : setMaybeboard;
        const updated = [...list];

        const dynamicQuantityMatch = val.match(/^(\d+)\s+(.*)/);
        let count = 1;
        let name = val.trim();

        if (dynamicQuantityMatch) {
            count = parseInt(dynamicQuantityMatch[1], 10);
            name = dynamicQuantityMatch[2].trim();
        }

        updated[index] = {
            rawText: val,
            count: count,
            name: name
        };
        setter(updated);
    };

    const handleRemoveRow = (zone, index) => {
        let list = zone === 'mainboard' ? mainboard : zone === 'sideboard' ? sideboard : maybeboard;
        let setter = zone === 'mainboard' ? setMainboard : zone === 'sideboard' ? setSideboard : setMaybeboard;
        if (list.length === 1) {
            setter([{ rawText: '', count: 1, name: '' }]);
            return;
        }
        setter(list.filter((_, i) => i !== index));
    };

    const calculateDeckColors = () => {
        const combinedObjects = [...mainboard, ...sideboard, ...maybeboard];
        const uniqueColors = new Set();

        combinedObjects.forEach(cardObj => {
            if (!cardObj.name || cardObj.name.trim() === '') return;

            const match = globalDatabaseCards?.find(c => c.name.toLowerCase() === cardObj.name.toLowerCase());
            if (match && Array.isArray(match.colors)) {
                match.colors.forEach(col => uniqueColors.add(col.toUpperCase()));
            }
        });

        return Array.from(uniqueColors);
    };

    const handleSaveDeck = async () => {
        if (!user) {
            Alert.alert('Session Terminated', 'An active login context is required to synchronize workspaces.');
            return;
        }
        setSaving(true);
        try {
            const calculatedColors = calculateDeckColors();

            const cleanMain = mainboard.filter(c => c.rawText.trim() !== '');
            const cleanSide = sideboard.filter(c => c.rawText.trim() !== '');
            const cleanMaybe = maybeboard.filter(c => c.rawText.trim() !== '');

            const payload = {
                userId: user.$id,
                deckName: deckName || 'Untitled Deck Workspace',
                format: selectedFormat,
                mainboard: JSON.stringify(cleanMain.length ? cleanMain : [{ rawText: '', count: 1, name: '' }]),
                sideboard: JSON.stringify(cleanSide.length ? cleanSide : [{ rawText: '', count: 1, name: '' }]),
                maybeboard: JSON.stringify(cleanMaybe.length ? cleanMaybe : [{ rawText: '', count: 1, name: '' }]),
                colors: calculatedColors
            };

            if (deckId) {
                await databases.updateDocument(
                    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.EXPO_PUBLIC_APPWRITE_DECKS_COLLECTION_ID,
                    deckId,
                    payload
                );
            } else {
                const doc = await databases.createDocument(
                    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.EXPO_PUBLIC_APPWRITE_DECKS_COLLECTION_ID,
                    ID.unique(),
                    payload
                );
                setDeckId(doc.$id);
            }

            Alert.alert('Workspace Synced', 'Deck entries successfully committed to remote ledger tracking arrays.');
            setViewMode('index');
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Sync Dropped', 'Failed to push configuration arrays to backend database.');
        } finally {
            setSaving(false);
        }
    };

    const handleCardRowNavigation = (cardObj) => {
        if (!cardObj.name || cardObj.name.trim() === '') return;
        router.push({
            pathname: `/cardDetail/${encodeURIComponent(cardObj.name)}`,
            params: { format: selectedFormat }
        });
    };

    //All Decks List
    if (viewMode === 'index') {
        return (
            <View style={styles.indexContainer}>
                <View style={styles.indexHeader}>
                    <View style={styles.titleBlock}>
                        <Text style={styles.indexTitle}>Deck Manager</Text>
                    </View>
                    <TouchableOpacity style={styles.createBtn} onPress={handleCreateNewDeck}>
                        <Text style={styles.createBtnText}>+ New Deck</Text>
                    </TouchableOpacity>
                </View>

                {loadingDecks ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                    </View>
                ) : (
                    <FlatList
                        data={userDecks}
                        keyExtractor={(item) => item.$id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No saved deck configurations recorded under this profile token.</Text>
                        }
                        renderItem={({ item }) => (
                            <Pressable style={styles.deckCard} onPress={() => handleEditDeckSelect(item)}>
                                <View style={styles.deckInfoRow}>
                                    <View style={styles.cardHeaderInfo}>
                                        <Text style={styles.deckCardName}>{item.deckName}</Text>
                                        <Text style={styles.deckCardFormatTag}>{item.format || 'Modern'}</Text>
                                    </View>
                                    <Text style={styles.arrowIcon}>➔</Text>
                                </View>
                                <View style={styles.colorBadgeRow}>
                                    {item.colors && item.colors.length > 0 ? (
                                        item.colors.map((c, i) => (
                                            <View key={i} style={styles.colorBadge}>
                                                <Text style={styles.colorBadgeText}>{c}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.colorlessText}>Colorless / Empty</Text>
                                    )}
                                </View>
                            </Pressable>
                        )}
                    />
                )}
            </View>
        );
    }

    //Individual Deck Workspace Editor
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setViewMode('index')}>
                    <Text style={styles.backBtnText}>✕ Cancel</Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.deckNameInput}
                    value={deckName}
                    onChangeText={setDeckName}
                    placeholder="Deck Name"
                    placeholderTextColor="#9ca3af"
                />

                <TouchableOpacity
                    style={styles.formatSelectorBtn}
                    onPress={() => setFormatPickerOpen(true)}
                >
                    <Text style={styles.formatSelectorBtnText}>{selectedFormat} ▾</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDeck} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.workspaceScroll} keyboardShouldPersistTaps="handled">
                {/* Mainboard Zone */}
                <View style={styles.zoneContainer}>
                    <Text style={styles.zoneTitle}>Mainboard</Text>
                    {mainboard.map((cardObj, index) => (
                        <View key={`mainboard-${index}`} style={styles.cardRow}>
                            <TextInput
                                style={styles.rowInput}
                                placeholder="e.g., 4 Lightning Bolt"
                                placeholderTextColor="#6b7280"
                                value={cardObj.rawText}
                                onChangeText={(txt) => updateRowText('mainboard', index, txt)}
                                onSubmitEditing={() => handleRowExpansion('mainboard', index)}
                                blurOnSubmit={false}
                                returnKeyType="next"
                            />
                            {cardObj.name.trim() !== '' && (
                                <Pressable style={styles.viewCardLink} onPress={() => handleCardRowNavigation(cardObj)}>
                                    <Text style={styles.viewCardLinkText}>👁️</Text>
                                </Pressable>
                            )}
                            <TouchableOpacity style={styles.rowActionBtn} onPress={() => handleRemoveRow('mainboard', index)}>
                                <Text style={styles.actionBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Sideboard Zone */}
                <View style={styles.zoneContainer}>
                    <Text style={styles.zoneTitle}>Sideboard</Text>
                    {sideboard.map((cardObj, index) => (
                        <View key={`sideboard-${index}`} style={styles.cardRow}>
                            <TextInput
                                style={styles.rowInput}
                                placeholder="e.g., 2 Spell Pierce"
                                placeholderTextColor="#6b7280"
                                value={cardObj.rawText}
                                onChangeText={(txt) => updateRowText('sideboard', index, txt)}
                                onSubmitEditing={() => handleRowExpansion('sideboard', index)}
                                blurOnSubmit={false}
                                returnKeyType="next"
                            />
                            {cardObj.name.trim() !== '' && (
                                <Pressable style={styles.viewCardLink} onPress={() => handleCardRowNavigation(cardObj)}>
                                    <Text style={styles.viewCardLinkText}>👁️</Text>
                                </Pressable>
                            )}
                            <TouchableOpacity style={styles.rowActionBtn} onPress={() => handleRemoveRow('sideboard', index)}>
                                <Text style={styles.actionBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Maybeboard Zone */}
                <View style={styles.zoneContainer}>
                    <Text style={styles.zoneTitle}>Maybeboard</Text>
                    {maybeboard.map((cardObj, index) => (
                        <View key={`maybeboard-${index}`} style={styles.cardRow}>
                            <TextInput
                                style={styles.rowInput}
                                placeholder="e.g., 1 Sol Ring"
                                placeholderTextColor="#6b7280"
                                value={cardObj.rawText}
                                onChangeText={(txt) => updateRowText('maybeboard', index, txt)}
                                onSubmitEditing={() => handleRowExpansion('maybeboard', index)}
                                blurOnSubmit={false}
                                returnKeyType="next"
                            />
                            {cardObj.name.trim() !== '' && (
                                <Pressable style={styles.viewCardLink} onPress={() => handleCardRowNavigation(cardObj)}>
                                    <Text style={styles.viewCardLinkText}>👁️</Text>
                                </Pressable>
                            )}
                            <TouchableOpacity style={styles.rowActionBtn} onPress={() => handleRemoveRow('maybeboard', index)}>
                                <Text style={styles.actionBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <Modal
                visible={formatPickerOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFormatPickerOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFormatPickerOpen(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerDropdownContainer}>
                            <Text style={styles.pickerLabel}>Target Format Engine</Text>
                            <View style={styles.divider} />
                            {VALID_FORMATS.map((fmt) => (
                                <TouchableOpacity
                                    key={fmt}
                                    style={[
                                        styles.pickerItem,
                                        selectedFormat === fmt && styles.pickerItemActive
                                    ]}
                                    onPress={() => {
                                        setSelectedFormat(fmt);
                                        setFormatPickerOpen(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.pickerItemText,
                                        selectedFormat === fmt && styles.pickerItemTextActive
                                    ]}>
                                        {fmt} {selectedFormat === fmt ? '✓' : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    indexContainer: { flex: 1, backgroundColor: '#111827', paddingTop: Platform.OS === 'ios' ? 60 : 20 },
    indexHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
    titleBlock: { flex: 1 },
    indexTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    createBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 24, paddingBottom: 40 },
    emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
    deckCard: { backgroundColor: '#1f2937', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#374151' },
    deckInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardHeaderInfo: { gap: 2 },
    deckCardName: { fontSize: 17, fontWeight: '700', color: '#f9fafb' },
    deckCardFormatTag: { fontSize: 11, fontWeight: '600', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 0.5 },
    arrowIcon: { color: '#8b5cf6', fontWeight: 'bold', fontSize: 16 },
    colorBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    colorBadge: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#4b5563', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 },
    colorBadgeText: { color: '#d1d5db', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
    colorlessText: { color: '#4b5563', fontSize: 12, fontStyle: 'italic' },

    //Workspace Panels
    container: { flex: 1, backgroundColor: '#111827' },
    header: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1f2937', paddingTop: Platform.OS === 'ios' ? 50 : 16 },
    backBtn: { marginRight: 8 },
    backBtnText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
    deckNameInput: { fontSize: 14, color: '#fff', fontWeight: '700', flex: 1, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#111827', borderRadius: 8, borderWidth: 1, borderColor: '#4b5563', marginRight: 6 },

    //Format Toolbar Styles
    formatSelectorBtn: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#8b5cf6', marginRight: 8 },
    formatSelectorBtnText: { color: '#8b5cf6', fontSize: 13, fontWeight: '700' },

    saveBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    workspaceScroll: { flex: 1, padding: 12 },
    zoneContainer: { marginBottom: 20, backgroundColor: '#1f2937', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#374151' },
    zoneTitle: { color: '#8b5cf6', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    rowInput: { flex: 1, backgroundColor: '#111827', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14, borderWidth: 1, borderColor: '#374151' },
    viewCardLink: { padding: 12, marginLeft: 6, backgroundColor: '#374151', borderRadius: 8 },
    viewCardLinkText: { fontSize: 14 },
    rowActionBtn: { padding: 12, marginLeft: 6, backgroundColor: '#3f1d1d', borderRadius: 8, borderWidth: 1, borderColor: '#7f1d1d' },
    actionBtnText: { color: '#fca5a5', fontWeight: 'bold', fontSize: 14 },

    //Dropdown Overlay Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerDropdownContainer: { width: 260, backgroundColor: '#1f2937', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#374151', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
    pickerLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 },
    divider: { height: 1, backgroundColor: '#374151', marginBottom: 6 },
    pickerItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 2 },
    pickerItemActive: { backgroundColor: '#374151' },
    pickerItemText: { color: '#d1d5db', fontSize: 15, fontWeight: '600' },
    pickerItemTextActive: { color: '#8b5cf6', fontWeight: '700' }
});