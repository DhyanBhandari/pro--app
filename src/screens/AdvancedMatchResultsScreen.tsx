import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/themes';
import { useMatching } from '@/contexts/MatchingContext';
import { MainStackParamList } from '@/types/navigation.types';
import { MatchResult } from '@/types/matching.types';
import AdvancedMatchCard from '@/components/AdvancedMatchCard';
import GlassCard from '@/components/GlassCard';

type MatchResultsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MatchResults'>;
type MatchResultsScreenRouteProp = RouteProp<MainStackParamList, 'MatchResults'>;

interface AdvancedMatch extends MatchResult {
    scores?: {
        semantic: number;
        location: number;
        parameters: number;
        price: number;
    };
    parsed_data?: any;
}

export const AdvancedMatchResultsScreen: React.FC = () => {
    const navigation = useNavigation<MatchResultsScreenNavigationProp>();
    const route = useRoute<MatchResultsScreenRouteProp>();
    const { state, actions } = useMatching();
    const { intentId } = route.params;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [sortBy, setSortBy] = useState<'score' | 'distance' | 'recent'>('score');

    const matches = state.current_process?.matches || [];
    const intentResult = state.current_process?.intent_result;

    useEffect(() => {
        if (!matches.length && !state.current_process) {
            // Show live intent saved message
            Alert.alert(
                'Intent Saved',
                'No immediate matches found, but your intent has been saved for 5 days. You\'ll be notified when matching items appear!',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
            );
        }
    }, [matches.length, navigation]);

    const handleRefresh = async () => {
        if (!state.current_search) return;
        
        setIsRefreshing(true);
        try {
            await actions.retrySearch();
        } catch (error) {
            Alert.alert('Error', 'Failed to refresh results');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleMatchPress = (match: AdvancedMatch) => {
        actions.recordInteraction({
            match_id: match.intent_id,
            action: 'viewed',
            timestamp: new Date().toISOString(),
        });

        navigation.navigate('MatchDetails', { 
            matchId: match.intent_id, 
            match 
        });
    };

    const getFilteredMatches = () => {
        let filtered = matches as AdvancedMatch[];
        
        // Filter by score threshold
        if (selectedFilter !== 'all') {
            const thresholds = { high: 0.85, medium: 0.70, low: 0.50 };
            const minScore = thresholds[selectedFilter];
            filtered = filtered.filter(m => m.combined_score >= minScore);
        }

        // Sort matches
        switch (sortBy) {
            case 'score':
                return filtered.sort((a, b) => b.combined_score - a.combined_score);
            case 'distance':
                return filtered.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
            case 'recent':
                return filtered.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            default:
                return filtered;
        }
    };

    const filteredMatches = getFilteredMatches();

    const renderMatch = ({ item }: { item: AdvancedMatch }) => (
        <AdvancedMatchCard 
            match={item}
            onPress={() => handleMatchPress(item)}
        />
    );

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Search Summary */}
            {intentResult && (
                <GlassCard style={styles.searchSummary}>
                    <View style={styles.summaryHeader}>
                        <MaterialIcons 
                            name="search" 
                            size={24} 
                            color={theme.colors.primary} 
                        />
                        <Text style={styles.summaryTitle}>Your Search Intent</Text>
                    </View>
                    <Text style={styles.summaryQuery}>{intentResult.raw_query}</Text>
                    
                    {/* Parsed Parameters */}
                    {intentResult.parsed_data && (
                        <View style={styles.parsedParams}>
                            <Text style={styles.paramLabel}>Detected:</Text>
                            <View style={styles.paramTags}>
                                <ParamTag 
                                    label={intentResult.parsed_data.intent || intentResult.post_type} 
                                    type="intent" 
                                />
                                <ParamTag 
                                    label={intentResult.parsed_data.category || intentResult.category} 
                                    type="category" 
                                />
                                {intentResult.parsed_data.brand && (
                                    <ParamTag label={intentResult.parsed_data.brand} type="brand" />
                                )}
                                {intentResult.parsed_data.budget && (
                                    <ParamTag label={`₹${intentResult.parsed_data.budget}`} type="price" />
                                )}
                            </View>
                        </View>
                    )}
                    
                    <View style={styles.summaryStats}>
                        <StatItem 
                            icon="search" 
                            value={matches.length.toString()} 
                            label="Total Matches" 
                        />
                        <StatItem 
                            icon="star" 
                            value={`${Math.round(matches.filter((m: AdvancedMatch) => 
                                m.combined_score >= 0.85).length)}`} 
                            label="High Quality" 
                        />
                        <StatItem 
                            icon="location-on" 
                            value={`${Math.round(matches.filter((m: AdvancedMatch) => 
                                m.distance_km && m.distance_km < 10).length)}`} 
                            label="Nearby" 
                        />
                    </View>
                </GlassCard>
            )}

            {/* Filter and Sort Controls */}
            <View style={styles.controlsContainer}>
                {/* Filter Section */}
                <View style={styles.filterSection}>
                    <Text style={styles.sectionTitle}>Filter by Match Quality</Text>
                    <View style={styles.filterButtons}>
                        {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterButton,
                                    selectedFilter === filter && styles.filterButtonActive
                                ]}
                                onPress={() => setSelectedFilter(filter)}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    selectedFilter === filter && styles.filterButtonTextActive
                                ]}>
                                    {filter === 'all' ? 'All' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} (${
                                        filter === 'high' ? '≥85%' :
                                        filter === 'medium' ? '≥70%' : '≥50%'
                                    })`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Sort Section */}
                <View style={styles.sortSection}>
                    <Text style={styles.sectionTitle}>Sort by</Text>
                    <View style={styles.sortButtons}>
                        {(['score', 'distance', 'recent'] as const).map((sort) => (
                            <TouchableOpacity
                                key={sort}
                                style={[
                                    styles.sortButton,
                                    sortBy === sort && styles.sortButtonActive
                                ]}
                                onPress={() => setSortBy(sort)}
                            >
                                <MaterialIcons 
                                    name={
                                        sort === 'score' ? 'star' :
                                        sort === 'distance' ? 'location-on' : 'schedule'
                                    } 
                                    size={16} 
                                    color={sortBy === sort ? theme.colors.background : theme.colors.secondary} 
                                />
                                <Text style={[
                                    styles.sortButtonText,
                                    sortBy === sort && styles.sortButtonTextActive
                                ]}>
                                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Results Count */}
            <Text style={styles.resultsCount}>
                Showing {filteredMatches.length} of {matches.length} matches
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <GlassCard style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color={theme.colors.secondary} />
            <Text style={styles.emptyTitle}>No Matches Found</Text>
            <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                    ? 'Your search intent has been saved. We\'ll notify you when matching items appear!'
                    : `No ${selectedFilter} quality matches found. Try adjusting the filter.`
                }
            </Text>
            
            <View style={styles.emptyActions}>
                <TouchableOpacity 
                    style={styles.newSearchButton}
                    onPress={() => navigation.navigate('Home')}
                >
                    <MaterialIcons name="search" size={20} color={theme.colors.background} />
                    <Text style={styles.newSearchButtonText}>New Search</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.notifyButton}
                    onPress={() => Alert.alert('Success', 'You\'ll be notified when new matches appear!')}
                >
                    <MaterialIcons name="notifications" size={20} color={theme.colors.primary} />
                    <Text style={styles.notifyButtonText}>Enable Notifications</Text>
                </TouchableOpacity>
            </View>
        </GlassCard>
    );

    if (state.isLoading && !matches.length) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <LinearGradient
                    colors={theme.colors.gradients.background}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Finding best matches...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Background */}
            <LinearGradient
                colors={theme.colors.gradients.background}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Match Results</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <MaterialIcons name="home" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Results List */}
            <FlatList
                data={filteredMatches}
                renderItem={renderMatch}
                keyExtractor={(item) => item.intent_id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            />
        </SafeAreaView>
    );
};

// Helper Components
const ParamTag: React.FC<{ label: string; type: string }> = ({ label, type }) => {
    const getColor = () => {
        switch (type) {
            case 'intent': return theme.colors.accent;
            case 'category': return theme.colors.primary;
            case 'brand': return theme.colors.secondary;
            case 'price': return theme.colors.success;
            default: return theme.colors.secondary;
        }
    };

    return (
        <View style={[styles.paramTag, { backgroundColor: getColor() + '20' }]}>
            <Text style={[styles.paramTagText, { color: getColor() }]}>{label}</Text>
        </View>
    );
};

const StatItem: React.FC<{ icon: string; value: string; label: string }> = ({ 
    icon, 
    value, 
    label 
}) => (
    <View style={styles.statItem}>
        <MaterialIcons name={icon} size={20} color={theme.colors.secondary} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '20',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    listContent: {
        paddingBottom: 20,
    },
    headerContent: {
        paddingBottom: 20,
    },
    searchSummary: {
        margin: 16,
        padding: 16,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: 8,
    },
    summaryQuery: {
        fontSize: 14,
        color: theme.colors.text,
        lineHeight: 20,
        marginBottom: 12,
    },
    parsedParams: {
        marginBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border + '20',
    },
    paramLabel: {
        fontSize: 12,
        color: theme.colors.secondary,
        marginBottom: 8,
    },
    paramTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    paramTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    paramTagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border + '20',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 4,
    },
    statLabel: {
        fontSize: 10,
        color: theme.colors.secondary,
        marginTop: 2,
    },
    controlsContainer: {
        paddingHorizontal: 16,
    },
    filterSection: {
        marginBottom: 16,
    },
    sortSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    filterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        backgroundColor: theme.colors.glass + '40',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border + '40',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterButtonText: {
        fontSize: 12,
        color: theme.colors.secondary,
    },
    filterButtonTextActive: {
        color: theme.colors.background,
        fontWeight: '600',
    },
    sortButtons: {
        flexDirection: 'row',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.glass + '40',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border + '40',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    sortButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    sortButtonText: {
        fontSize: 12,
        color: theme.colors.secondary,
        marginLeft: 6,
    },
    sortButtonTextActive: {
        color: theme.colors.background,
        fontWeight: '600',
    },
    resultsCount: {
        fontSize: 12,
        color: theme.colors.secondary,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        margin: 16,
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyActions: {
        flexDirection: 'row',
        gap: 12,
    },
    newSearchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    newSearchButtonText: {
        color: theme.colors.background,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    notifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.glass + '40',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    notifyButtonText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: theme.colors.secondary,
        marginTop: 12,
    },
});