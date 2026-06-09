import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../src/context/AuthContext';

function AuthScreen() {
    const [mode, setMode] = useState('login'); //'login' | 'register'
    const [submitting, setSubmitting] = useState(false);

    //Store the backend error message
    const [authError, setAuthError] = useState(null);

    const { login, register } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data) => {
        setSubmitting(true);
        setAuthError(null); //Clear previous errors when a new attempt starts

        try {
            if (mode === 'login') {
                await login(data.email, data.password);
            } else {
                await register(data.email, data.password, data.name);
            }
        } catch (err) {
            setAuthError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const switchMode = () => {
        setMode((prev) => (prev === 'login' ? 'register' : 'login'));
        setAuthError(null); //Clear errors when toggling modes
        reset();
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>Datamine</Text>
                    <Text style={styles.tagline}>
                        {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
                    </Text>
                </View>

                {/* Mode Toggle Tabs */}
                <View style={styles.tabRow}>
                    <Pressable
                        onPress={() => { setMode('login'); setAuthError(null); reset(); }}
                        style={[styles.tab, mode === 'login' && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                            Log In
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => { setMode('register'); setAuthError(null); reset(); }}
                        style={[styles.tab, mode === 'register' && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                            Register
                        </Text>
                    </Pressable>
                </View>

                {/* Form Card */}
                <View style={styles.card}>

                    {/* NEW ELEMENT: Visual Banner Error Block */}
                    {authError && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorBannerText}>{authError}</Text>
                        </View>
                    )}

                    {/* Name field — only shown in register mode */}
                    {mode === 'register' && (
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Display Name</Text>
                            <Controller
                                control={control}
                                name="name"
                                rules={{ required: 'Name is required' }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.name && styles.inputError]}
                                        placeholder="Your name"
                                        placeholderTextColor="#9ca3af"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        autoCapitalize="words"
                                    />
                                )}
                            />
                            {errors.name && (
                                <Text style={styles.errorText}>{errors.name.message}</Text>
                            )}
                        </View>
                    )}

                    {/* Email field */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email</Text>
                        <Controller
                            control={control}
                            name="email"
                            rules={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Enter a valid email address',
                                },
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={[styles.input, errors.email && styles.inputError]}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#9ca3af"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            )}
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email.message}</Text>
                        )}
                    </View>

                    {/* Password field */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Password</Text>
                        <Controller
                            control={control}
                            name="password"
                            rules={{
                                required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters',
                                },
                            }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <TextInput
                                    style={[styles.input, errors.password && styles.inputError]}
                                    placeholder="••••••••"
                                    placeholderTextColor="#9ca3af"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    secureTextEntry
                                    autoCapitalize="none"
                                />
                            )}
                        />
                        {errors.password && (
                            <Text style={styles.errorText}>{errors.password.message}</Text>
                        )}
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit(onSubmit, (invalidFields) => {
                            console.log("❌ Form Validation Failed:", invalidFields);
                            setAuthError("Please fix the validation errors below.");
                        })}
                        disabled={submitting}
                        style={({ pressed }) => [
                            styles.submitBtn,
                            pressed && styles.submitBtnPressed,
                            submitting && styles.submitBtnDisabled,
                        ]}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>
                                {mode === 'login' ? 'Log In' : 'Create Account'}
                            </Text>
                        )}
                    </Pressable>
                </View>

                {/* Switch mode link */}
                <Pressable onPress={switchMode} style={styles.switchRow}>
                    <Text style={styles.switchText}>
                        {mode === 'login'
                            ? "Don't have an account? "
                            : 'Already have an account? '}
                        <Text style={styles.switchLink}>
                            {mode === 'login' ? 'Register' : 'Log In'}
                        </Text>
                    </Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#111827' },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    header: { alignItems: 'center', marginBottom: 36 },
    logo: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    tagline: { fontSize: 15, color: '#6b7280', marginTop: 6 },
    tabRow: { flexDirection: 'row', backgroundColor: '#1f2937', borderRadius: 10, padding: 4, marginBottom: 24 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    tabActive: { backgroundColor: '#8b5cf6' },
    tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
    tabTextActive: { color: '#fff' },
    card: { backgroundColor: '#1f2937', borderRadius: 16, padding: 24, gap: 4 },

    errorBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    errorBannerText: {
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#d1d5db', marginBottom: 6 },
    input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#f9fafb' },
    inputError: { borderColor: '#ef4444' },
    errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
    submitBtn: { backgroundColor: '#8b5cf6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnPressed: { opacity: 0.8 },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    switchRow: { alignItems: 'center', marginTop: 20 },
    switchText: { fontSize: 14, color: '#6b7280' },
    switchLink: { color: '#8b5cf6', fontWeight: '600' },
});

export default AuthScreen;