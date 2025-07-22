import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '@/themes';
import { useMatching } from '@/contexts/MatchingContext';
import { MainStackParamList } from '@/types/navigation.types';
import { MatchResult } from '@/types/matching.types';
import { MatchScoreCard } from '@/components/MatchScoreCard';

type MatchDetailsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'MatchDetails'>;
type MatchDetailsScreenRouteProp = RouteProp<MainStackParamList, 'MatchDetails'>;

export const MatchDetailsScreen: React.FC = () => {
    const navigation = useNavigation<MatchDetailsScreenNavigationProp>();
    const route = useRoute<MatchDetailsScreenRouteProp>();
    const { actions } = useMatching();
    const { match } = route.params;

    const [isBookmarked, setIsBookmarked] = useState(false);

    const handleBookmark = () => {
        if (isBookmarked) {
            Alert.alert('Remove Bookmark', 'Remove this match from your saved items?', [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    onPress: () => {
                        setIsBookmarked(false);
                        actions.recordInteraction({
                            match_id: match.intent_id,
                            action: 'dismissed',
                            timestamp: new Date().toISOString(),
                        });
                    }
                },
            ]);
        } else {
            actions.saveMatch(match, 'Bookmarked from details view');
            setIsBookmarked(true);
            actions.recordInteraction({
                match_id: match.intent_id,
                action: 'liked',
                timestamp: new Date().toISOString(),
            });
            Alert.alert('Bookmarked!', 'This match has been saved to your favorites.');
        }
    };

    const handleContact = () => {
        Alert.alert(
            'Contact User',
            'How would you like to get in touch?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send Message', onPress: handleSendMessage },
                { text: 'View Profile', onPress: handleViewProfile },
            ]
        );

        actions.recordInteraction({
            match_id: match.intent_id,
            action: 'contacted',
            timestamp: new Date().toISOString(),
        });
    };

    const handleSendMessage = () => {
        // In a real app, this would open a messaging interface
        Alert.alert('Feature Coming Soon', 'Direct messaging will be available in the next update!');
    };

    const handleViewProfile = () => {
        // In a real app, this would navigate to user profile
        Alert.alert('Feature Coming Soon', 'User profiles will be available in the next update!');
    };

    const handleShare = () => {
        Alert.alert('Share Match', 'Share this match with others?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Copy Link', onPress: handleCopyLink },
            { text: 'Share App', onPress: handleShareApp },
        ]);
    };

    const handleCopyLink = () => {
        // In a real app, this would copy a deep link
        Alert.alert('Link Copied', 'Match link has been copied to clipboard!');
    };

    const handleShareApp = () => {
        // In a real app, this would use the Share API
        Alert.alert('Coming Soon', 'Sharing functionality will be available soon!');
    };

    const handleReport = () => {
        Alert.alert(
            'Report Match',
            'Is there an issue with this match?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Spam/Inappropriate', onPress: () => submitReport('spam') },
                { text: 'Misleading Info', onPress: () => submitReport('misleading') },
                { text: 'Other', onPress: () => submitReport('other') },
            ]
        );
    };

    const submitReport = (reason: string) => {
        actions.recordInteraction({
            match_id: match.intent_id,
            action: 'reported',
            timestamp: new Date().toISOString(),
            notes: `Reported for: ${reason}`,
        });
        Alert.alert('Reported', 'Thank you for your report. We\'ll review this match.');
    };

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return theme.colors.status.success;
            case 'good': return theme.colors.neon.blue;
            case 'fair': return theme.colors.status.warning;
            default: return theme.colors.status.error;
        }
    };

    const getPostTypeInfo = (postType: string) => {
        return postType === 'demand' 
            ? { icon: '🔍', label: 'Looking For', color: theme.colors.neon.blue }
            : { icon: '💼', label: 'Offering', color: theme.colors.neon.green };
    };

    const postTypeInfo = getPostTypeInfo(match.post_type);

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
                <Text style={styles.title}>Match Details</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Text style={styles.shareButton}>📤</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* User Header */}
                <View style={styles.userHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {match.user_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{match.user_name}</Text>
                        
                        <View style={styles.postTypeBadge} 
                              style={[styles.postTypeBadge, { backgroundColor: postTypeInfo.color + '20', borderColor: postTypeInfo.color }]}>
                            <Text style={styles.postTypeIcon}>{postTypeInfo.icon}</Text>
                            <Text style={[styles.postTypeText, { color: postTypeInfo.color }]}>
                                {postTypeInfo.label}
                            </Text>
                        </View>

                        {match.location_name && (
                            <View style={styles.locationContainer}>
                                <Text style={styles.locationIcon}>📍</Text>
                                <Text style={styles.locationText}>{match.location_name}</Text>
                                {match.distance_km && (
                                    <Text style={styles.distanceText}>
                                        • {match.distance_km.toFixed(1)} km away
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.qualityBadge} 
                          style={[styles.qualityBadge, { backgroundColor: getQualityColor(match.match_quality) + '20', borderColor: getQualityColor(match.match_quality) }]}>
                        <Text style={[styles.qualityText, { color: getQualityColor(match.match_quality) }]}>
                            {match.match_quality.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Query Display */}
                <View style={styles.queryContainer}>
                    <Text style={styles.queryTitle}>What they're looking for:</Text>
                    <Text style={styles.queryText}>{match.raw_query}</Text>
                    
                    <View style={styles.queryMeta}>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryText}>{match.category}</Text>
                        </View>
                        <Text style={styles.postedDate}>
                            Posted {new Date(match.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Match Score Details */}
                <Text style={styles.sectionTitle}>🎯 Match Analysis</Text>
                <MatchScoreCard scores={match.scores} showBreakdown={true} />

                {/* Compatibility Insights */}
                <View style={styles.insightsContainer}>
                    <Text style={styles.insightsTitle}>💡 Why This is a Good Match</Text>
                    
                    <View style={styles.insightsList}>
                        {match.scores.text_similarity >= 0.7 && (
                            <View style={styles.insightItem}>
                                <Text style={styles.insightIcon}>✅</Text>
                                <Text style={styles.insightText}>
                                    High content similarity - your needs align well
                                </Text>
                            </View>
                        )}
                        
                        {match.scores.location_score >= 0.8 && (
                            <View style={styles.insightItem}>
                                <Text style={styles.insightIcon}>📍</Text>
                                <Text style={styles.insightText}>
                                    Located nearby for easy coordination
                                </Text>
                            </View>
                        )}
                        
                        {match.scores.intent_compatibility >= 0.6 && (
                            <View style={styles.insightItem}>
                                <Text style={styles.insightIcon}>🎯</Text>
                                <Text style={styles.insightText}>
                                    Compatible intentions - {match.post_type === 'demand' ? 'both looking for similar things' : 'complementary needs'}
                                </Text>
                            </View>
                        )}
                        
                        {match.scores.temporal_compatibility >= 0.7 && (
                            <View style={styles.insightItem}>
                                <Text style={styles.insightIcon}>⏰</Text>
                                <Text style={styles.insightText}>
                                    Recent and relevant timing
                                </Text>
                            </View>
                        )}
                        
                        {match.scores.combined_score >= 0.8 && (
                            <View style={styles.insightItem}>
                                <Text style={styles.insightIcon}>⭐</Text>
                                <Text style={styles.insightText}>
                                    Exceptional overall compatibility score
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleContact}>
                        <Text style={styles.primaryButtonText}>💬 Contact User</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.secondaryActions}>
                        <TouchableOpacity 
                            style={[styles.secondaryButton, isBookmarked && styles.bookmarkedButton]} 
                            onPress={handleBookmark}
                        >
                            <Text style={[styles.secondaryButtonText, isBookmarked && styles.bookmarkedText]}>
                                {isBookmarked ? '❤️ Saved' : '🔖 Save'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                            <Text style={styles.secondaryButtonText}>📤 Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer Actions */}
                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
                        <Text style={styles.reportText}>⚠️ Report this match</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    shareButton: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.glass.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.glass.border,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.neon.blue,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        ...theme.typography.styles.h2,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    postTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },
    postTypeIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    postTypeText: {
        ...theme.typography.styles.caption,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    locationText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    distanceText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        marginLeft: 4,
    },
    qualityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    qualityText: {
        ...theme.typography.styles.caption,
        fontWeight: 'bold',
        fontSize: 10,
    },
    queryContainer: {
        margin: 20,
        padding: 20,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    queryTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    queryText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 16,
    },
    queryMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryTag: {
        backgroundColor: theme.colors.glass.secondary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
    },
    postedDate: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
    sectionTitle: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 10,
    },
    insightsContainer: {
        margin: 20,
        padding: 20,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    insightsTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    insightsList: {
        gap: 12,
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    insightIcon: {
        fontSize: 16,
        marginRight: 12,
        marginTop: 2,
    },
    insightText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        flex: 1,
        lineHeight: 20,
    },
    actionsContainer: {
        margin: 20,
        gap: 16,
    },
    primaryButton: {
        backgroundColor: theme.colors.neon.blue,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    primaryButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingVertical: 16,
        alignItems: 'center',
    },
    bookmarkedButton: {
        backgroundColor: theme.colors.neon.pink + '20',
        borderColor: theme.colors.neon.pink,
    },
    secondaryButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    bookmarkedText: {
        color: theme.colors.neon.pink,
    },
    footerActions: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 20,
    },
    reportButton: {
        padding: 12,
    },
    reportText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
});