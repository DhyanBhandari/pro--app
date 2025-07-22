import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Slider,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';
import { SearchFilter } from '@/types/matching.types';

interface FilterPanelProps {
    visible: boolean;
    onClose: () => void;
    filters: SearchFilter;
    onFiltersChange: (filters: Partial<SearchFilter>) => void;
    onApply: () => void;
    onReset: () => void;
}

const CATEGORIES = [
    { id: 'product', label: 'Products', icon: '📱' },
    { id: 'service', label: 'Services', icon: '🔧' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'general', label: 'General', icon: '📋' },
];

const SORT_OPTIONS = [
    { id: 'relevance', label: 'Relevance', icon: '🎯' },
    { id: 'distance', label: 'Distance', icon: '📍' },
    { id: 'recency', label: 'Most Recent', icon: '🕐' },
    { id: 'score', label: 'Match Score', icon: '⭐' },
];

const QUALITY_LEVELS = [
    { id: 'excellent', label: 'Excellent', color: theme.colors.status.success },
    { id: 'good', label: 'Good', color: theme.colors.neon.blue },
    { id: 'fair', label: 'Fair', color: theme.colors.status.warning },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
    visible,
    onClose,
    filters,
    onFiltersChange,
    onApply,
    onReset,
}) => {
    const [localFilters, setLocalFilters] = useState<SearchFilter>(filters);

    const updateFilter = (key: keyof SearchFilter, value: any) => {
        const updatedFilters = { ...localFilters, [key]: value };
        setLocalFilters(updatedFilters);
        onFiltersChange({ [key]: value });
    };

    const toggleCategory = (categoryId: string) => {
        const currentCategories = localFilters.category || [];
        const updatedCategories = currentCategories.includes(categoryId)
            ? currentCategories.filter(id => id !== categoryId)
            : [...currentCategories, categoryId];
        
        updateFilter('category', updatedCategories);
    };

    const toggleQuality = (qualityId: string) => {
        const currentQualities = localFilters.match_quality || [];
        const updatedQualities = currentQualities.includes(qualityId as any)
            ? currentQualities.filter(id => id !== qualityId)
            : [...currentQualities, qualityId as any];
        
        updateFilter('match_quality', updatedQualities);
    };

    const handleReset = () => {
        const resetFilters: SearchFilter = {
            max_results: 20,
            sort_by: 'relevance',
            min_score: 0.3,
        };
        setLocalFilters(resetFilters);
        onReset();
    };

    const handleApply = () => {
        onApply();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <LinearGradient
                    colors={theme.colors.gradients.background}
                    style={StyleSheet.absoluteFill}
                />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Filters</Text>
                    <TouchableOpacity onPress={handleReset}>
                        <Text style={styles.resetButton}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Post Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Post Type</Text>
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    !localFilters.post_type && styles.toggleButtonActive
                                ]}
                                onPress={() => updateFilter('post_type', undefined)}
                            >
                                <Text style={[
                                    styles.toggleButtonText,
                                    !localFilters.post_type && styles.toggleButtonTextActive
                                ]}>All</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    localFilters.post_type === 'demand' && styles.toggleButtonActive
                                ]}
                                onPress={() => updateFilter('post_type', 'demand')}
                            >
                                <Text style={[
                                    styles.toggleButtonText,
                                    localFilters.post_type === 'demand' && styles.toggleButtonTextActive
                                ]}>🔍 Looking For</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    localFilters.post_type === 'supply' && styles.toggleButtonActive
                                ]}
                                onPress={() => updateFilter('post_type', 'supply')}
                            >
                                <Text style={[
                                    styles.toggleButtonText,
                                    localFilters.post_type === 'supply' && styles.toggleButtonTextActive
                                ]}>💼 Offering</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Categories */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Categories</Text>
                        <View style={styles.chipGroup}>
                            {CATEGORIES.map((category) => {
                                const isSelected = localFilters.category?.includes(category.id) || false;
                                return (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.chip,
                                            isSelected && styles.chipSelected
                                        ]}
                                        onPress={() => toggleCategory(category.id)}
                                    >
                                        <Text style={styles.chipIcon}>{category.icon}</Text>
                                        <Text style={[
                                            styles.chipText,
                                            isSelected && styles.chipTextSelected
                                        ]}>{category.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Match Quality */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Match Quality</Text>
                        <View style={styles.chipGroup}>
                            {QUALITY_LEVELS.map((quality) => {
                                const isSelected = localFilters.match_quality?.includes(quality.id as any) || false;
                                return (
                                    <TouchableOpacity
                                        key={quality.id}
                                        style={[
                                            styles.chip,
                                            isSelected && { ...styles.chipSelected, borderColor: quality.color }
                                        ]}
                                        onPress={() => toggleQuality(quality.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            isSelected && { ...styles.chipTextSelected, color: quality.color }
                                        ]}>{quality.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Minimum Score */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Minimum Match Score: {Math.round((localFilters.min_score || 0) * 100)}%
                        </Text>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={1}
                                value={localFilters.min_score || 0}
                                onValueChange={(value) => updateFilter('min_score', value)}
                                minimumTrackTintColor={theme.colors.neon.blue}
                                maximumTrackTintColor={theme.colors.glass.border}
                                thumbStyle={styles.sliderThumb}
                            />
                            <View style={styles.sliderLabels}>
                                <Text style={styles.sliderLabel}>0%</Text>
                                <Text style={styles.sliderLabel}>50%</Text>
                                <Text style={styles.sliderLabel}>100%</Text>
                            </View>
                        </View>
                    </View>

                    {/* Sort Order */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sort By</Text>
                        <View style={styles.radioGroup}>
                            {SORT_OPTIONS.map((option) => {
                                const isSelected = localFilters.sort_by === option.id;
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={styles.radioOption}
                                        onPress={() => updateFilter('sort_by', option.id)}
                                    >
                                        <View style={[
                                            styles.radioButton,
                                            isSelected && styles.radioButtonSelected
                                        ]}>
                                            {isSelected && <View style={styles.radioButtonInner} />}
                                        </View>
                                        <Text style={styles.radioIcon}>{option.icon}</Text>
                                        <Text style={[
                                            styles.radioText,
                                            isSelected && styles.radioTextSelected
                                        ]}>{option.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Max Results */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Max Results: {localFilters.max_results || 20}
                        </Text>
                        <View style={styles.buttonGroup}>
                            {[10, 20, 50, 100].map((count) => {
                                const isSelected = localFilters.max_results === count;
                                return (
                                    <TouchableOpacity
                                        key={count}
                                        style={[
                                            styles.countButton,
                                            isSelected && styles.countButtonSelected
                                        ]}
                                        onPress={() => updateFilter('max_results', count)}
                                    >
                                        <Text style={[
                                            styles.countButtonText,
                                            isSelected && styles.countButtonTextSelected
                                        ]}>{count}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
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
    closeButton: {
        fontSize: 18,
        color: theme.colors.text.secondary,
        padding: 4,
    },
    title: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
    },
    resetButton: {
        ...theme.typography.styles.body,
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginVertical: 20,
    },
    sectionTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleButton: {
        flex: 1,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingVertical: 12,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.neon.blue + '20',
        borderColor: theme.colors.neon.blue,
    },
    toggleButtonText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    toggleButtonTextActive: {
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    chipSelected: {
        backgroundColor: theme.colors.neon.blue + '20',
        borderColor: theme.colors.neon.blue,
    },
    chipIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    chipText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    chipTextSelected: {
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    sliderContainer: {
        paddingVertical: 10,
    },
    slider: {
        width: '100%',
        height: 20,
    },
    sliderThumb: {
        backgroundColor: theme.colors.neon.blue,
        width: 20,
        height: 20,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sliderLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
    radioGroup: {
        gap: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.glass.border,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: theme.colors.neon.blue,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.neon.blue,
    },
    radioIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    radioText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    radioTextSelected: {
        color: theme.colors.text.primary,
        fontWeight: 'bold',
    },
    countButton: {
        flex: 1,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingVertical: 12,
        alignItems: 'center',
    },
    countButtonSelected: {
        backgroundColor: theme.colors.neon.blue + '20',
        borderColor: theme.colors.neon.blue,
    },
    countButtonText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
    },
    countButtonTextSelected: {
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
    },
    applyButton: {
        backgroundColor: theme.colors.neon.blue,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    applyButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});