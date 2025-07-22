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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '@/themes';
import { useMatching } from '@/contexts/MatchingContext';
import { MainStackParamList } from '@/types/navigation.types';
import { MatchResult } from '@/types/matching.types';
import { MatchScoreCard } from '@/components/MatchScoreCard';

type MatchResultsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MatchResults'>;
type MatchResultsScreenRouteProp = RouteProp<MainStackParamList, 'MatchResults'>;

export const MatchResultsScreen: React.FC = () => {
    const navigation = useNavigation<MatchResultsScreenNavigationProp>();
    const route = useRoute<MatchResultsScreenRouteProp>();
    const { state, actions } = useMatching();
    const { intentId } = route.params;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'excellent' | 'good' | 'fair'>('all');

    const matches = state.current_process?.matches || [];
    const intentResult = state.current_process?.intent_result;

    useEffect(() => {
        if (!matches.length && !state.current_process) {
            Alert.alert(
                'No Results',
                'No match results found. Please try searching again.',
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

    const handleMatchPress = (match: MatchResult) => {
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

    const handleSaveMatch = (match: MatchResult) => {
        actions.saveMatch(match, 'Saved from search results');
        Alert.alert('Success', 'Match saved to your favorites!');
    };

    const getFilteredMatches = () => {
        if (selectedFilter === 'all') return matches;
        return matches.filter(match => match.match_quality === selectedFilter);
    };

    const filteredMatches = getFilteredMatches();

    const renderMatch = ({ item, index }: { item: MatchResult; index: number }) => (
        <View style={styles.matchContainer}>
            {/* Match Header */}
            <View style={styles.matchHeader}>
                <View style={styles.matchInfo}>
                    <Text style={styles.matchTitle}>{item.user_name}</Text>
                    <Text style={styles.matchQuery}>{item.raw_query}</Text>
                    
                    <View style={styles.matchMeta}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>
                                {item.category} • {item.post_type.toUpperCase()}
                            </Text>
                        </View>
                        
                        {item.location_name && (
                            <Text style={styles.locationText}>📍 {item.location_name}</Text>
                        )}
                        
                        {item.distance_km && (
                            <Text style={styles.distanceText}>
                                📏 {item.distance_km.toFixed(1)} km away
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.matchActions}>
                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={() => handleSaveMatch(item)}
                    >
                        <Text style={styles.saveButtonText}>💾</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Score Card */}
            <MatchScoreCard 
                scores={item.scores}
                onPress={() => handleMatchPress(item)}
                showBreakdown={false}
            />

            {/* Quick Stats */}
            <View style={styles.quickStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {Math.round(item.scores.combined_score * 100)}%
                    </Text>
                    <Text style={styles.statLabel}>Overall</Text>
                </View>
                
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {Math.round(item.scores.text_similarity * 100)}%
                    </Text>
                    <Text style={styles.statLabel}>Content</Text>
                </View>
                
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {Math.round(item.scores.location_score * 100)}%
                    </Text>
                    <Text style={styles.statLabel}>Location</Text>
                </View>
                
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.statLabel}>Posted</Text>
                </View>
            </View>

            {/* View Details Button */}
            <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => handleMatchPress(item)}
            >
                <Text style={styles.viewDetailsText}>View Full Details →</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Search Summary */}
            {intentResult && (
                <View style={styles.searchSummary}>
                    <Text style={styles.summaryTitle}>Your Search</Text>
                    <Text style={styles.summaryQuery}>{intentResult.raw_query}</Text>
                    <Text style={styles.summaryMeta}>
                        {intentResult.post_type.toUpperCase()} • {intentResult.category} • {matches.length} matches
                    </Text>
                </View>
            )}

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterTitle}>Filter by Quality:</Text>
                <View style={styles.filterButtons}>
                    {(['all', 'excellent', 'good', 'fair'] as const).map((filter) => (
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
                                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                {filter !== 'all' && ` (${matches.filter(m => m.match_quality === filter).length})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Results Count */}
            <Text style={styles.resultsCount}>
                Showing {filteredMatches.length} of {matches.length} matches
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Matches Found</Text>
            <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                    ? 'No matches found for your search. Try different keywords or check back later.'
                    : `No ${selectedFilter} quality matches found. Try adjusting the filter.`
                }
            </Text>
            <TouchableOpacity 
                style={styles.newSearchButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.newSearchButtonText}>Start New Search</Text>
            </TouchableOpacity>
        </View>
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Match Results</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.homeButton}>🏠</Text>
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
                        tintColor={theme.colors.neon.blue}
                        colors={[theme.colors.neon.blue]}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.glass.border,
    },
    backButton: {
        ...theme.typography.styles.body,
        color: theme.colors.neon.blue,
    },
    title: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
    },
    homeButton: {
        fontSize: 24,
    },
    listContent: {
        paddingBottom: 20,
    },
    headerContent: {
        paddingBottom: 20,
    },
    searchSummary: {
        margin: 20,
        padding: 20,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    summaryTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    summaryQuery: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: '500',
        marginBottom: 8,
    },
    summaryMeta: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    filterContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    filterTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    filterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.neon.blue + '20',
        borderColor: theme.colors.neon.blue,
    },
    filterButtonText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    filterButtonTextActive: {
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    resultsCount: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        marginBottom: 10,
    },
    matchContainer: {
        marginHorizontal: 20,
        marginVertical: 12,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        overflow: 'hidden',
    },
    matchHeader: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 16,
    },
    matchInfo: {
        flex: 1,
    },
    matchTitle: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    matchQuery: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    matchMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 4,
    },
    categoryText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        fontSize: 10,
    },
    locationText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        marginRight: 8,
        marginBottom: 4,
    },
    distanceText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        marginBottom: 4,
    },
    matchActions: {
        alignItems: 'center',
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.glass.secondary,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
    },
    quickStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
        backgroundColor: theme.colors.glass.secondary,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: 'bold',
    },
    statLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    viewDetailsButton: {
        backgroundColor: theme.colors.neon.blue + '20',
        borderWidth: 1,
        borderColor: theme.colors.neon.blue,
        padding: 16,
        alignItems: 'center',
    },
    viewDetailsText: {
        ...theme.typography.styles.body,
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    emptyText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    newSearchButton: {
        backgroundColor: theme.colors.neon.blue,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    newSearchButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
    },
});