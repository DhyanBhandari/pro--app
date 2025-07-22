import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '@/themes';
import { useMatching } from '@/contexts/MatchingContext';
import { MainStackParamList } from '@/types/navigation.types';
import { MatchingProgress } from '@/components/MatchingProgress';
import { SearchResultCard } from '@/components/SearchResultCard';

type MatchingScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Matching'>;
type MatchingScreenRouteProp = RouteProp<MainStackParamList, 'Matching'>;

export const MatchingScreen: React.FC = () => {
    const navigation = useNavigation<MatchingScreenNavigationProp>();
    const route = useRoute<MatchingScreenRouteProp>();
    const { state } = useMatching();
    const { query } = route.params;

    useEffect(() => {
        // Monitor process completion
        if (state.current_process?.status === 'completed') {
            if (state.current_process.matches.length > 0) {
                // Navigate to results after a short delay to show completion
                const timer = setTimeout(() => {
                    navigation.replace('MatchResults', { 
                        intentId: state.current_process?.intent_result?.intent_id || '' 
                    });
                }, 1500);

                return () => clearTimeout(timer);
            } else {
                // No matches found
                Alert.alert(
                    'No Matches Found',
                    'We couldn\'t find any matches for your query. Try adjusting your search terms or check back later.',
                    [
                        { text: 'Try Again', onPress: () => navigation.goBack() },
                        { text: 'Go Home', onPress: () => navigation.navigate('Home') },
                    ]
                );
            }
        } else if (state.current_process?.status === 'error') {
            Alert.alert(
                'Search Error',
                state.current_process.error || 'Something went wrong while searching.',
                [
                    { text: 'Try Again', onPress: () => navigation.goBack() },
                    { text: 'Go Home', onPress: () => navigation.navigate('Home') },
                ]
            );
        }
    }, [state.current_process?.status, navigation]);

    const handleCancel = () => {
        Alert.alert(
            'Cancel Search',
            'Are you sure you want to cancel the current search?',
            [
                { text: 'Continue Searching', style: 'cancel' },
                { text: 'Cancel Search', onPress: () => navigation.goBack() },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Background */}
            <LinearGradient
                colors={theme.colors.gradients.background}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🔍 Smart Search</Text>
                <Text style={styles.subtitle}>AI-powered matching in progress</Text>
            </View>

            {/* Progress Section */}
            <View style={styles.content}>
                {state.current_process ? (
                    <>
                        <MatchingProgress process={state.current_process} />
                        
                        {/* Intent Result Card */}
                        {state.current_process.intent_result && (
                            <View style={styles.resultSection}>
                                <Text style={styles.sectionTitle}>✨ Query Analysis Complete</Text>
                                <SearchResultCard 
                                    result={state.current_process.intent_result}
                                />
                            </View>
                        )}

                        {/* Real-time Updates */}
                        {state.current_process.status === 'matching' && (
                            <View style={styles.updatesContainer}>
                                <Text style={styles.updatesTitle}>Live Updates:</Text>
                                <View style={styles.updateItem}>
                                    <Text style={styles.updateText}>
                                        🧠 Neural networks analyzing compatibility...
                                    </Text>
                                </View>
                                <View style={styles.updateItem}>
                                    <Text style={styles.updateText}>
                                        📊 Computing similarity scores...
                                    </Text>
                                </View>
                                <View style={styles.updateItem}>
                                    <Text style={styles.updateText}>
                                        🎯 Ranking best matches...
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Completion Message */}
                        {state.current_process.status === 'completed' && (
                            <View style={styles.completionContainer}>
                                <Text style={styles.completionIcon}>🎉</Text>
                                <Text style={styles.completionTitle}>Search Complete!</Text>
                                <Text style={styles.completionText}>
                                    Found {state.current_process.matches.length} high-quality matches
                                </Text>
                                <Text style={styles.redirectText}>
                                    Redirecting to results...
                                </Text>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorTitle}>Search Not Started</Text>
                        <Text style={styles.errorText}>
                            Unable to find search process. Please try again.
                        </Text>
                    </View>
                )}
            </View>

            {/* Cancel Button */}
            {state.current_process && ['parsing', 'searching', 'matching'].includes(state.current_process.status) && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>Cancel Search</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.glass.border,
        alignItems: 'center',
    },
    title: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: 4,
    },
    content: {
        flex: 1,
        paddingVertical: 20,
    },
    resultSection: {
        marginTop: 20,
    },
    sectionTitle: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
        marginLeft: 20,
        marginBottom: 12,
    },
    updatesContainer: {
        margin: 20,
        padding: 20,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    updatesTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    updateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    updateText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    completionContainer: {
        margin: 20,
        padding: 30,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.neon.green,
        alignItems: 'center',
    },
    completionIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    completionTitle: {
        ...theme.typography.styles.h3,
        color: theme.colors.neon.green,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    completionText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    redirectText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    errorContainer: {
        margin: 20,
        padding: 30,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.status.error,
        alignItems: 'center',
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        ...theme.typography.styles.h3,
        color: theme.colors.status.error,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    errorText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
    },
    cancelButton: {
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.status.error,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.status.error,
        fontWeight: 'bold',
    },
});