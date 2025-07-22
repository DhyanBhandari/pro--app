import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';
import { MatchResult } from '@/types/matching.types';

interface MatchCardProps {
    match: MatchResult;
    onPress?: () => void;
    onSave?: () => void;
    onContact?: () => void;
    style?: any;
    animatedValue?: Animated.Value;
}

export const MatchCard: React.FC<MatchCardProps> = ({
    match,
    onPress,
    onSave,
    onContact,
    style,
    animatedValue,
}) => {
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
    const qualityColor = getQualityColor(match.match_quality);

    const animatedStyle = animatedValue ? {
        opacity: animatedValue,
        transform: [{
            translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
            }),
        }],
    } : {};

    return (
        <Animated.View style={[animatedStyle, style]}>
            <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
                <LinearGradient
                    colors={[theme.colors.glass.primary, theme.colors.glass.secondary]}
                    style={styles.gradient}
                />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {match.user_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{match.user_name}</Text>
                            
                            <View style={[styles.postTypeBadge, { backgroundColor: postTypeInfo.color + '20', borderColor: postTypeInfo.color }]}>
                                <Text style={styles.postTypeIcon}>{postTypeInfo.icon}</Text>
                                <Text style={[styles.postTypeText, { color: postTypeInfo.color }]}>
                                    {postTypeInfo.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Quality Badge */}
                    <View style={[styles.qualityBadge, { backgroundColor: qualityColor + '20', borderColor: qualityColor }]}>
                        <Text style={[styles.qualityText, { color: qualityColor }]}>
                            {Math.round(match.scores.combined_score * 100)}%
                        </Text>
                    </View>
                </View>

                {/* Query */}
                <Text style={styles.query} numberOfLines={2}>
                    {match.raw_query}
                </Text>

                {/* Match Info */}
                <View style={styles.matchInfo}>
                    <View style={styles.categoryContainer}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{match.category}</Text>
                        </View>
                        
                        {match.location_name && (
                            <Text style={styles.locationText}>
                                📍 {match.location_name}
                                {match.distance_km && ` • ${match.distance_km.toFixed(1)}km`}
                            </Text>
                        )}
                    </View>
                    
                    <Text style={styles.timeText}>
                        {new Date(match.created_at).toLocaleDateString()}
                    </Text>
                </View>

                {/* Score Bars */}
                <View style={styles.scoresContainer}>
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Content</Text>
                        <View style={styles.scoreBar}>
                            <View
                                style={[
                                    styles.scoreBarFill,
                                    {
                                        width: `${match.scores.text_similarity * 100}%`,
                                        backgroundColor: theme.colors.neon.blue,
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.scoreValue}>{Math.round(match.scores.text_similarity * 100)}%</Text>
                    </View>

                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Location</Text>
                        <View style={styles.scoreBar}>
                            <View
                                style={[
                                    styles.scoreBarFill,
                                    {
                                        width: `${match.scores.location_score * 100}%`,
                                        backgroundColor: theme.colors.neon.green,
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.scoreValue}>{Math.round(match.scores.location_score * 100)}%</Text>
                    </View>

                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Intent</Text>
                        <View style={styles.scoreBar}>
                            <View
                                style={[
                                    styles.scoreBarFill,
                                    {
                                        width: `${match.scores.intent_compatibility * 100}%`,
                                        backgroundColor: theme.colors.neon.purple,
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.scoreValue}>{Math.round(match.scores.intent_compatibility * 100)}%</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {onContact && (
                        <TouchableOpacity style={styles.actionButton} onPress={onContact}>
                            <Text style={styles.actionButtonText}>💬 Contact</Text>
                        </TouchableOpacity>
                    )}
                    
                    {onSave && (
                        <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={onSave}>
                            <Text style={[styles.actionButtonText, styles.saveButtonText]}>💾 Save</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={onPress}>
                        <Text style={[styles.actionButtonText, styles.viewButtonText]}>👁️ Details</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        overflow: 'hidden',
        position: 'relative',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.neon.blue,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        ...theme.typography.styles.body,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    postTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    postTypeIcon: {
        fontSize: 10,
        marginRight: 4,
    },
    postTypeText: {
        ...theme.typography.styles.caption,
        fontSize: 10,
        fontWeight: 'bold',
    },
    qualityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    qualityText: {
        ...theme.typography.styles.caption,
        fontWeight: 'bold',
        fontSize: 12,
    },
    query: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        marginHorizontal: 16,
        marginBottom: 12,
        lineHeight: 20,
    },
    matchInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    categoryContainer: {
        flex: 1,
    },
    categoryBadge: {
        backgroundColor: theme.colors.glass.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
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
        fontSize: 10,
    },
    timeText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        fontSize: 10,
    },
    scoresContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    scoreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scoreLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        width: 50,
        fontSize: 10,
    },
    scoreBar: {
        flex: 1,
        height: 4,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 2,
        overflow: 'hidden',
    },
    scoreBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    scoreValue: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        width: 32,
        textAlign: 'right',
        fontSize: 10,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    actionButton: {
        flex: 1,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingVertical: 10,
        alignItems: 'center',
    },
    saveButton: {
        borderColor: theme.colors.neon.pink,
        backgroundColor: theme.colors.neon.pink + '20',
    },
    viewButton: {
        borderColor: theme.colors.neon.blue,
        backgroundColor: theme.colors.neon.blue + '20',
    },
    actionButtonText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        fontSize: 11,
        fontWeight: '500',
    },
    saveButtonText: {
        color: theme.colors.neon.pink,
    },
    viewButtonText: {
        color: theme.colors.neon.blue,
    },
});