/**
 * app/admin/seed.jsx
 * Doesn't really work with the free version of appwrite and is not activly used.
 */
import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { seedCardsToAppwrite } from '../../src/utils/seedCards';

let loadedCardData = null;

try {
    loadedCardData = require('../../assets/mtg-cards.json');
} catch (importError) {
    console.log("Structural Asset Path Resolution Failure: mtg-cards.json could not be loaded.");
}

export default function AdminSeedScreen() {
    const router = useRouter();
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [processedCount, setProcessedCount] = useState(0);
    const [logs, setLogs] = useState([]);

    const totalCards = useMemo(() => {
        if (!loadedCardData) return 0;
        return Array.isArray(loadedCardData) ? loadedCardData.length : 0;
    }, []);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
    };

    const handlePromptConfirmation = () => {
        if (!loadedCardData || totalCards === 0) {
            addLog("Sync aborted: local mtg-cards.json file resource asset is empty or missing.");
            return;
        }
        setStatus('confirming');
        addLog("Awaiting confirmation via on-screen administrative toggle panel...");
    };

    const executeSyncPipeline = async () => {
        console.log("Starting transmission pipeline streams directly...");
        setStatus('seeding');
        setProgress(0);
        setProcessedCount(0);
        addLog(`Initializing stream transfers... Chunks parsing against endpoint target configuration maps.`);

        try {
            await seedCardsToAppwrite(loadedCardData, (progressPercent) => {
                const currentPercent = Math.round(progressPercent * 100);
                setProgress(currentPercent);

                const activeCount = Math.min(Math.round(progressPercent * totalCards), totalCards);
                setProcessedCount(activeCount);
            });

            setStatus('completed');
            addLog("Cloud database sync successfully finalized.");
        } catch (err) {
            setStatus('failed');
            addLog(`System Exception Interruption: ${err.message}`);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Database Control Board', headerShown: true }} />

            {!loadedCardData && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>
                        CRITICAL: mtg-cards.json could not be loaded. Verify file placement in /assets/ and rebuild asset files.
                    </Text>
                </View>
            )}

            <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>System Diagnostics</Text>
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Local JSON Asset Status:</Text>
                    <Text style={[styles.metricValue, { color: loadedCardData ? '#10b981' : '#ef4444' }]}>
                        {loadedCardData ? 'RESOLVED & CACHED' : 'NOT FOUND'}
                    </Text>
                </View>
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Detected Card Records:</Text>
                    <Text style={styles.metricValue}>{totalCards.toLocaleString()}</Text>
                </View>
            </View>

            {/* Render Block based on active status tracks */}
            {status === 'idle' && (
                <TouchableOpacity
                    style={[styles.primaryButton, (!loadedCardData || totalCards === 0) && styles.disabledButton]}
                    onPress={handlePromptConfirmation}
                    disabled={!loadedCardData || totalCards === 0}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Begin Seeding Matrix</Text>
                </TouchableOpacity>
            )}

            {status === 'confirming' && (
                <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>
                        WARNING: Pushing {totalCards.toLocaleString()} elements requires substantial network bandwidth operations. Continue?
                    </Text>
                    <View style={styles.confirmRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStatus('idle'); addLog("Sync cancelled."); }}>
                            <Text style={styles.cancelBtnText}>Abort</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={executeSyncPipeline}>
                            <Text style={styles.confirmBtnText}>Confirm & Push Data</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {status === 'seeding' && (
                <View style={styles.progressSection}>
                    <ActivityIndicator size="large" color="#8b5cf6" style={{ marginBottom: 16 }} />
                    <Text style={styles.progressPercentage}>{progress}%</Text>
                    <Text style={styles.progressCounter}>
                        Pushed: {processedCount.toLocaleString()} / {totalCards.toLocaleString()}
                    </Text>
                    <View style={styles.barBackground}>
                        <View style={[styles.barFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            )}

            {status === 'completed' && (
                <View style={styles.successSection}>
                    <Text style={styles.successText}>🎉 Seeding Sequence Finalized Successfully!</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setStatus('idle')}>
                        <Text style={styles.buttonText}>Run Additional Patch Update</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.logContainer}>
                <Text style={styles.logHeaderTitle}>System Pipeline Output Logs</Text>
                <ScrollView style={styles.logScrollView} nestedScrollEnabled={true}>
                    {logs.length === 0 ? (
                        <Text style={styles.emptyLogText}>Awaiting action trigger matrix sequence...</Text>
                    ) : (
                        logs.map((log, index) => (
                            <Text key={index} style={styles.logLineText}>{log}</Text>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 16 },
    errorBanner: { backgroundColor: '#7f1d1d', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#f87171' },
    errorBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    summaryCard: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    cardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metricLabel: { color: '#9ca3af', fontSize: 14 },
    metricValue: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },
    primaryButton: { backgroundColor: '#8b5cf6', height: 52, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    disabledButton: { backgroundColor: '#374151', opacity: 0.5 },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    confirmBox: { backgroundColor: '#1e1b4b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#4338ca', marginBottom: 20 },
    confirmText: { color: '#e0e7ff', fontSize: 14, lineHeight: 20, marginBottom: 14, fontWeight: '600' },
    confirmRow: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, height: 44, backgroundColor: '#312e81', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: '#c7d2fe', fontWeight: '600' },
    confirmBtn: { flex: 2, height: 44, backgroundColor: '#4f46e5', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: '#ffffff', fontWeight: '700' },
    progressSection: { backgroundColor: '#1f2937', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
    progressPercentage: { color: '#ffffff', fontSize: 36, fontWeight: '800', marginBottom: 4 },
    progressCounter: { color: '#9ca3af', fontSize: 14, marginBottom: 16 },
    barBackground: { width: '100%', height: 8, backgroundColor: '#374151', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 4 },
    successSection: { backgroundColor: '#064e3b', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#047857' },
    successText: { color: '#a7f3d0', textAlign: 'center', fontWeight: 'bold', marginBottom: 12 },
    logContainer: { flex: 1, backgroundColor: '#030712', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
    logHeaderTitle: { color: '#6b7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
    logScrollView: { flex: 1 },
    emptyLogText: { color: '#4b5563', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 16 },
    logLineText: { color: '#10b981', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, marginBottom: 4 }
});