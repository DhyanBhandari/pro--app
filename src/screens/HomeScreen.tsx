import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '@/themes';
import { useMatching } from '@/contexts/MatchingContext';
import { MainStackParamList } from '@/types/navigation.types';
import { apiService } from '@/services';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'>;

const searchSuggestions = [
    "Looking for iPhone 13 in Bangalore under 50k",
    "Need laptop repair service in Mumbai",
    "Selling MacBook Pro 2021 in good condition",
    "Looking for travel buddy to Goa this weekend",
    "Offering web development services",
    "Need help with React Native app development",
];

const quickActions = [
    { id: 'buy', label: '🛍️ Looking to Buy', type: 'demand' },
    { id: 'sell', label: '💼 Want to Sell', type: 'supply' },
    { id: 'service', label: '🔧 Need Service', type: 'demand' },
    { id: 'offer', label: '💡 Offer Service', type: 'supply' },
];

const categories = [
    { id: 'product', label: '📱 Products', icon: '📱' },
    { id: 'service', label: '🔧 Services', icon: '🔧' },
    { id: 'social', label: '👥 Social', icon: '👥' },
    { id: 'travel', label: '✈️ Travel', icon: '✈️' },
];

export const HomeScreen: React.FC = () => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { state, actions } = useMatching();

    useEffect(() => {
        // Monitor matching process status
        if (state.current_process?.status === 'completed' && state.current_process.matches.length > 0) {
            navigation.navigate('MatchResults', { intentId: state.current_process.intent_result?.intent_id || '' });
        } else if (state.current_process?.status === 'error') {
            setIsProcessing(false);
            Alert.alert('Search Error', state.current_process.error || 'Something went wrong');
        }
    }, [state.current_process?.status, navigation]);

    const handleSearch = async () => {
        if (!input.trim() || isProcessing) return;

        setIsProcessing(true);
        const query = input.trim();
        setInput('');

        try {
            await actions.startSearch(query);
            navigation.navigate('Matching', { query });
        } catch (error) {
            setIsProcessing(false);
            Alert.alert('Error', 'Failed to start search. Please try again.');
        }
    };

    const handleSuggestionPress = (suggestion: string) => {
        setInput(suggestion);
    };

    const handleQuickAction = (action: any) => {
        const templates = {
            demand: {
                buy: "Looking for ",
                service: "Need help with "
            },
            supply: {
                sell: "Selling ",
                offer: "Offering "
            }
        };
        
        const template = templates[action.type as keyof typeof templates][action.id as 'buy' | 'sell' | 'service' | 'offer'];
        setInput(template);
    };

    const testConnection = async () => {
        try {
            Alert.alert('Testing Connection', 'Checking backend connectivity...');
            const result = await apiService.testConnection();
            
            if (result.success) {
                Alert.alert(
                    'Connection Success! ✅', 
                    `${result.message}\n\nBackend is accessible and responding correctly.`,
                    [{ text: 'Great!', style: 'default' }]
                );
            } else {
                Alert.alert(
                    'Connection Failed ❌', 
                    `${result.message}\n\nPlease check:\n• Backend server is running\n• Your device is on the same network\n• Firewall/antivirus settings`,
                    [
                        { text: 'Retry', onPress: testConnection },
                        { text: 'OK', style: 'cancel' }
                    ]
                );
            }
        } catch (error) {
            Alert.alert(
                'Test Error', 
                `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [{ text: 'OK', style: 'cancel' }]
            );
        }
    };

    const renderRecentSearch = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.recentSearchItem}
            onPress={() => handleSuggestionPress(item.query)}
        >
            <Text style={styles.recentSearchText}>{item.query}</Text>
            <Text style={styles.recentSearchTime}>
                {new Date(item.timestamp).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Background */}
            <LinearGradient
                colors={theme.colors.gradients.background}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.logo}>🌐 Connect</Text>
                    <TouchableOpacity style={styles.testButton} onPress={testConnection}>
                        <Text style={styles.testButtonText}>🔧 Test</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Find what you need, offer what you have</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Main Search Input */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchWrapper}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="What are you looking for? e.g., iPhone 13, laptop repair..."
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={input}
                                onChangeText={setInput}
                                multiline
                                textAlignVertical="top"
                                onSubmitEditing={handleSearch}
                                editable={!isProcessing}
                            />
                            <TouchableOpacity 
                                onPress={handleSearch} 
                                style={[styles.searchButton, isProcessing && styles.searchButtonDisabled]}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color={theme.colors.text.primary} />
                                ) : (
                                    <Text style={styles.searchButtonText}>🔍</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        
                        {/* Search Status */}
                        {state.current_process && (
                            <View style={styles.statusContainer}>
                                <Text style={styles.statusText}>
                                    {state.current_process.status === 'parsing' && '🔍 Analyzing your request...'}
                                    {state.current_process.status === 'searching' && '🔎 Finding matches...'}
                                    {state.current_process.status === 'matching' && '🎯 Matching with ML...'}
                                    {state.current_process.status === 'completed' && '✅ Search completed!'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <View style={styles.quickActions}>
                            {quickActions.map((action) => (
                                <TouchableOpacity
                                    key={action.id}
                                    style={styles.quickActionButton}
                                    onPress={() => handleQuickAction(action)}
                                >
                                    <Text style={styles.quickActionText}>{action.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Categories */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Browse Categories</Text>
                        <View style={styles.categories}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={styles.categoryButton}
                                    onPress={() => setInput(`Looking for ${category.id} in `)}
                                >
                                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                                    <Text style={styles.categoryLabel}>{category.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Search Suggestions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popular Searches</Text>
                        {searchSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionButton}
                                onPress={() => handleSuggestionPress(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Recent Searches */}
                    {state.recent_searches.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Searches</Text>
                            <FlatList
                                data={state.recent_searches.slice(0, 5)}
                                renderItem={renderRecentSearch}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.glass.border,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    logo: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    testButton: {
        position: 'absolute',
        right: 0,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    testButtonText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        fontSize: 10,
    },
    subtitle: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: 4,
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    searchContainer: {
        marginTop: 20,
        marginBottom: 30,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        padding: 4,
    },
    searchInput: {
        flex: 1,
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        padding: 16,
        maxHeight: 120,
        minHeight: 50,
    },
    searchButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.neon.blue,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
    },
    searchButtonDisabled: {
        backgroundColor: theme.colors.glass.secondary,
    },
    searchButtonText: {
        fontSize: 20,
    },
    statusContainer: {
        marginTop: 10,
        padding: 12,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
    },
    statusText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickActionButton: {
        width: '48%',
        padding: 16,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        marginBottom: 12,
        alignItems: 'center',
    },
    quickActionText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    categories: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryButton: {
        width: '48%',
        padding: 20,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        marginBottom: 12,
        alignItems: 'center',
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    categoryLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    suggestionButton: {
        padding: 16,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        marginBottom: 8,
    },
    suggestionText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    recentSearchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        marginBottom: 8,
    },
    recentSearchText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: 12,
    },
    recentSearchTime: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
});