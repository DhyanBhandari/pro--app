import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';
import { IntentSearchResult } from '@/types/matching.types';

interface SearchResultCardProps {
    result: IntentSearchResult;
    onPress?: () => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onPress }) => {
    const getIntentIcon = (intent: string) => {
        switch (intent) {
            case 'demand': return '🔍';
            case 'supply': return '💼';
            default: return '❓';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'product': return '📱';
            case 'service': return '🔧';
            case 'social': return '👥';
            case 'travel': return '✈️';
            default: return '📋';
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return theme.colors.status.success;
        if (confidence >= 0.6) return theme.colors.status.warning;
        return theme.colors.status.error;
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={[theme.colors.glass.primary, theme.colors.glass.secondary]}
                style={styles.gradient}
            />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.intentBadge}>
                    <Text style={styles.intentIcon}>{getIntentIcon(result.post_type)}</Text>
                    <Text style={styles.intentType}>{result.post_type.toUpperCase()}</Text>
                </View>
                
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryIcon}>{getCategoryIcon(result.category)}</Text>
                    <Text style={styles.categoryText}>{result.category}</Text>
                </View>
            </View>

            {/* Query */}
            <Text style={styles.query}>{result.raw_query}</Text>

            {/* NLP Analysis */}
            {result.parsed_data && (
                <View style={styles.analysisContainer}>
                    <Text style={styles.analysisTitle}>AI Analysis:</Text>
                    
                    {/* Keywords */}
                    {result.parsed_data.keywords && result.parsed_data.keywords.length > 0 && (
                        <View style={styles.tagsContainer}>
                            <Text style={styles.tagLabel}>Keywords:</Text>
                            <View style={styles.tags}>
                                {result.parsed_data.keywords.slice(0, 3).map((keyword: string, index: number) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{keyword}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Locations */}
                    {result.parsed_data.locations && result.parsed_data.locations.length > 0 && (
                        <View style={styles.tagsContainer}>
                            <Text style={styles.tagLabel}>📍 Location:</Text>
                            <View style={styles.tags}>
                                {result.parsed_data.locations.slice(0, 2).map((location: string, index: number) => (
                                    <View key={index} style={[styles.tag, styles.locationTag]}>
                                        <Text style={styles.tagText}>{location}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Prices */}
                    {result.parsed_data.prices && result.parsed_data.prices.length > 0 && (
                        <View style={styles.tagsContainer}>
                            <Text style={styles.tagLabel}>💰 Price:</Text>
                            <View style={styles.tags}>
                                {result.parsed_data.prices.slice(0, 2).map((price: string, index: number) => (
                                    <View key={index} style={[styles.tag, styles.priceTag]}>
                                        <Text style={styles.tagText}>{price}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Confidence */}
                    <View style={styles.confidenceContainer}>
                        <Text style={styles.confidenceLabel}>Confidence:</Text>
                        <View style={styles.confidenceBar}>
                            <View 
                                style={[
                                    styles.confidenceFill, 
                                    { 
                                        width: `${(result.parsed_data.confidence || 0) * 100}%`,
                                        backgroundColor: getConfidenceColor(result.parsed_data.confidence || 0)
                                    }
                                ]} 
                            />
                        </View>
                        <Text style={[styles.confidenceText, { color: getConfidenceColor(result.parsed_data.confidence || 0) }]}>
                            {Math.round((result.parsed_data.confidence || 0) * 100)}%
                        </Text>
                    </View>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                {result.location_name && (
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.locationText}>{result.location_name}</Text>
                    </View>
                )}
                
                {result.processing_time_ms && (
                    <Text style={styles.processingTime}>
                        Processed in {result.processing_time_ms}ms
                    </Text>
                )}

                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: result.is_active ? theme.colors.status.success : theme.colors.status.error }]} />
                    <Text style={styles.statusText}>{result.is_active ? 'Active' : 'Inactive'}</Text>
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    intentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.neon.blue + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.neon.blue,
    },
    intentIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    intentType: {
        ...theme.typography.styles.caption,
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.glass.secondary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    categoryIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    categoryText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    query: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        marginHorizontal: 16,
        marginBottom: 16,
        fontWeight: '500',
    },
    analysisContainer: {
        backgroundColor: theme.colors.glass.secondary,
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    analysisTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    tagsContainer: {
        marginBottom: 12,
    },
    tagLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        marginBottom: 6,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: theme.colors.glass.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    locationTag: {
        borderColor: theme.colors.neon.green,
        backgroundColor: theme.colors.neon.green + '20',
    },
    priceTag: {
        borderColor: theme.colors.neon.orange,
        backgroundColor: theme.colors.neon.orange + '20',
    },
    tagText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        fontSize: 12,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    confidenceLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        marginRight: 8,
        width: 70,
    },
    confidenceBar: {
        flex: 1,
        height: 4,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 2,
        marginRight: 8,
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        borderRadius: 2,
    },
    confidenceText: {
        ...theme.typography.styles.caption,
        fontWeight: 'bold',
        minWidth: 35,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexWrap: 'wrap',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    locationText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    processingTime: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        fontSize: 10,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        fontSize: 10,
    },
});