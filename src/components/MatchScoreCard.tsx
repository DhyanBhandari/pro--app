import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';
import { MatchScore } from '@/types/matching.types';

interface MatchScoreCardProps {
    scores: MatchScore;
    onPress?: () => void;
    showBreakdown?: boolean;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ 
    scores, 
    onPress, 
    showBreakdown = true 
}) => {
    const getScoreColor = (score: number): string => {
        if (score >= 0.8) return theme.colors.status.success;
        if (score >= 0.6) return theme.colors.neon.blue;
        if (score >= 0.4) return theme.colors.status.warning;
        return theme.colors.status.error;
    };

    const getQualityBadge = (score: number) => {
        if (score >= 0.8) return { label: 'Excellent', color: theme.colors.status.success, icon: '🌟' };
        if (score >= 0.6) return { label: 'Good', color: theme.colors.neon.blue, icon: '👍' };
        if (score >= 0.4) return { label: 'Fair', color: theme.colors.status.warning, icon: '👌' };
        return { label: 'Poor', color: theme.colors.status.error, icon: '⚠️' };
    };

    const quality = getQualityBadge(scores.combined_score);
    const mainScoreColor = getScoreColor(scores.combined_score);

    const scoreItems = [
        {
            key: 'text_similarity',
            label: 'Text Match',
            value: scores.text_similarity,
            icon: '📝',
            description: 'How well the content matches'
        },
        {
            key: 'feature_similarity',
            label: 'Profile Match',
            value: scores.feature_similarity,
            icon: '👤',
            description: 'User profile compatibility'
        },
        {
            key: 'location_score',
            label: 'Location',
            value: scores.location_score,
            icon: '📍',
            description: 'Geographic proximity'
        },
        {
            key: 'intent_compatibility',
            label: 'Intent',
            value: scores.intent_compatibility,
            icon: '🎯',
            description: 'Purpose alignment'
        },
        {
            key: 'temporal_compatibility',
            label: 'Timing',
            value: scores.temporal_compatibility,
            icon: '⏰',
            description: 'Time relevance'
        },
    ];

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={onPress} 
            activeOpacity={0.8}
            disabled={!onPress}
        >
            <LinearGradient
                colors={[theme.colors.glass.primary, theme.colors.glass.secondary]}
                style={styles.gradient}
            />

            {/* Main Score Display */}
            <View style={styles.mainScoreContainer}>
                <View style={styles.scoreCircle}>
                    <Text style={styles.qualityIcon}>{quality.icon}</Text>
                    <Text style={[styles.mainScore, { color: mainScoreColor }]}>
                        {Math.round(scores.combined_score * 100)}
                    </Text>
                    <Text style={styles.scorePercent}>%</Text>
                </View>
                
                <View style={styles.scoreInfo}>
                    <View style={[styles.qualityBadge, { backgroundColor: quality.color + '20', borderColor: quality.color }]}>
                        <Text style={[styles.qualityText, { color: quality.color }]}>
                            {quality.label} Match
                        </Text>
                    </View>
                    
                    <View style={styles.confidenceContainer}>
                        <Text style={styles.confidenceLabel}>Confidence:</Text>
                        <Text style={[styles.confidenceValue, { color: getScoreColor(scores.confidence_score) }]}>
                            {Math.round(scores.confidence_score * 100)}%
                        </Text>
                    </View>
                </View>
            </View>

            {/* Score Breakdown */}
            {showBreakdown && (
                <View style={styles.breakdownContainer}>
                    <Text style={styles.breakdownTitle}>Score Breakdown</Text>
                    
                    {scoreItems.map((item) => (
                        <View key={item.key} style={styles.scoreRow}>
                            <View style={styles.scoreRowLeft}>
                                <Text style={styles.scoreIcon}>{item.icon}</Text>
                                <View style={styles.scoreLabels}>
                                    <Text style={styles.scoreLabel}>{item.label}</Text>
                                    <Text style={styles.scoreDescription}>{item.description}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.scoreRowRight}>
                                <View style={styles.scoreBarContainer}>
                                    <View style={styles.scoreBar}>
                                        <View
                                            style={[
                                                styles.scoreBarFill,
                                                {
                                                    width: `${item.value * 100}%`,
                                                    backgroundColor: getScoreColor(item.value),
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.scoreValue, { color: getScoreColor(item.value) }]}>
                                    {Math.round(item.value * 100)}%
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* ML Insights */}
            <View style={styles.insightsContainer}>
                <Text style={styles.insightsTitle}>🤖 AI Insights</Text>
                
                {scores.combined_score >= 0.8 && (
                    <Text style={styles.insightText}>
                        Excellent match! High compatibility across all factors.
                    </Text>
                )}
                
                {scores.combined_score >= 0.6 && scores.combined_score < 0.8 && (
                    <Text style={styles.insightText}>
                        Good match with strong {
                        scoreItems.reduce((best, item) => 
                            item.value > best.value ? item : best
                        ).label.toLowerCase()
                        } compatibility.
                    </Text>
                )}
                
                {scores.combined_score < 0.6 && (
                    <Text style={styles.insightText}>
                        Moderate match. Consider if {
                        scoreItems.reduce((worst, item) => 
                            item.value < worst.value ? item : worst
                        ).label.toLowerCase()
                        } requirements are flexible.
                    </Text>
                )}
                
                {scores.confidence_score < 0.5 && (
                    <Text style={styles.warningText}>
                        ⚠️ Low confidence - limited data for accurate matching
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
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
    mainScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.glass.secondary,
        borderWidth: 2,
        borderColor: theme.colors.glass.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        position: 'relative',
    },
    qualityIcon: {
        fontSize: 20,
        position: 'absolute',
        top: 15,
    },
    mainScore: {
        ...theme.typography.styles.h1,
        fontWeight: 'bold',
        fontSize: 32,
        lineHeight: 32,
    },
    scorePercent: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    scoreInfo: {
        flex: 1,
    },
    qualityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    qualityText: {
        ...theme.typography.styles.body,
        fontWeight: 'bold',
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confidenceLabel: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginRight: 8,
    },
    confidenceValue: {
        ...theme.typography.styles.body,
        fontWeight: 'bold',
    },
    breakdownContainer: {
        backgroundColor: theme.colors.glass.secondary,
        margin: 20,
        marginTop: 0,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    breakdownTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    scoreIcon: {
        fontSize: 20,
        marginRight: 12,
        width: 24,
        textAlign: 'center',
    },
    scoreLabels: {
        flex: 1,
    },
    scoreLabel: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    scoreDescription: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    scoreRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 100,
    },
    scoreBarContainer: {
        flex: 1,
        marginRight: 12,
    },
    scoreBar: {
        height: 6,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    scoreBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    scoreValue: {
        ...theme.typography.styles.caption,
        fontWeight: 'bold',
        minWidth: 35,
        textAlign: 'right',
    },
    insightsContainer: {
        backgroundColor: theme.colors.glass.tertiary,
        margin: 20,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    insightsTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    insightText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    warningText: {
        ...theme.typography.styles.caption,
        color: theme.colors.status.warning,
        marginTop: 8,
        fontStyle: 'italic',
    },
});