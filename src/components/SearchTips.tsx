import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';

interface SearchTip {
    icon: string;
    title: string;
    description: string;
    examples: string[];
}

const SEARCH_TIPS: SearchTip[] = [
    {
        icon: '🎯',
        title: 'Be Specific',
        description: 'Include specific details like brand, model, condition, or service type',
        examples: [
            'iPhone 13 Pro Max 256GB',
            'MacBook Pro 2021 M1 chip',
            'Web development with React',
        ]
    },
    {
        icon: '📍',
        title: 'Add Location',
        description: 'Mention your city or area for better local matches',
        examples: [
            'Laptop repair in Mumbai',
            'Guitar lessons in Bangalore',
            'Selling bike in Delhi NCR',
        ]
    },
    {
        icon: '💰',
        title: 'Include Price Range',
        description: 'Specify your budget or price expectations',
        examples: [
            'iPhone under 50k',
            'Web design service 10k-20k',
            'Selling for 15000',
        ]
    },
    {
        icon: '⏰',
        title: 'Time Preference',
        description: 'Mention urgency or preferred timeline',
        examples: [
            'Need immediately',
            'This weekend only',
            'Available next month',
        ]
    },
    {
        icon: '🔧',
        title: 'Service Details',
        description: 'For services, describe what you need done',
        examples: [
            'AC repair and maintenance',
            'Logo design for restaurant',
            'Math tutoring for class 10',
        ]
    },
    {
        icon: '📱',
        title: 'Product Condition',
        description: 'Specify condition for better matching',
        examples: [
            'Brand new in box',
            'Used but working fine',
            'Needs minor repair',
        ]
    }
];

interface SearchTipsProps {
    visible: boolean;
    onClose: () => void;
    onExampleSelect?: (example: string) => void;
}

export const SearchTips: React.FC<SearchTipsProps> = ({
    visible,
    onClose,
    onExampleSelect,
}) => {
    const [expandedTip, setExpandedTip] = useState<string | null>(null);

    const handleExamplePress = (example: string) => {
        onExampleSelect?.(example);
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
                    <Text style={styles.title}>Search Tips</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitle}>
                        Get better matches with these search tips
                    </Text>

                    {SEARCH_TIPS.map((tip, index) => (
                        <View key={index} style={styles.tipContainer}>
                            <TouchableOpacity
                                style={styles.tipHeader}
                                onPress={() => setExpandedTip(expandedTip === tip.title ? null : tip.title)}
                            >
                                <View style={styles.tipHeaderLeft}>
                                    <Text style={styles.tipIcon}>{tip.icon}</Text>
                                    <View style={styles.tipInfo}>
                                        <Text style={styles.tipTitle}>{tip.title}</Text>
                                        <Text style={styles.tipDescription}>{tip.description}</Text>
                                    </View>
                                </View>
                                <Text style={styles.expandIcon}>
                                    {expandedTip === tip.title ? '▼' : '▶'}
                                </Text>
                            </TouchableOpacity>

                            {expandedTip === tip.title && (
                                <View style={styles.examplesContainer}>
                                    <Text style={styles.examplesTitle}>Examples:</Text>
                                    {tip.examples.map((example, exampleIndex) => (
                                        <TouchableOpacity
                                            key={exampleIndex}
                                            style={styles.exampleButton}
                                            onPress={() => handleExamplePress(example)}
                                        >
                                            <Text style={styles.exampleText}>{example}</Text>
                                            <Text style={styles.useExampleText}>Tap to use</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}

                    {/* Additional Tips */}
                    <View style={styles.additionalTips}>
                        <Text style={styles.additionalTitle}>💡 Pro Tips</Text>
                        
                        <View style={styles.proTip}>
                            <Text style={styles.proTipTitle}>🚀 Smart Search</Text>
                            <Text style={styles.proTipText}>
                                Our AI understands natural language. Write like you're talking to a friend!
                            </Text>
                        </View>

                        <View style={styles.proTip}>
                            <Text style={styles.proTipTitle}>🔄 Try Variations</Text>
                            <Text style={styles.proTipText}>
                                If you don't find matches, try different words. "Mobile" vs "Phone" vs "Smartphone"
                            </Text>
                        </View>

                        <View style={styles.proTip}>
                            <Text style={styles.proTipTitle}>⭐ Quality Matters</Text>
                            <Text style={styles.proTipText}>
                                More details = better matches. Our ML gets smarter with more information!
                            </Text>
                        </View>

                        <View style={styles.proTip}>
                            <Text style={styles.proTipTitle}>🎯 Intent Clarity</Text>
                            <Text style={styles.proTipText}>
                                Start with "Looking for" or "Selling" to make your intent crystal clear
                            </Text>
                        </View>
                    </View>

                    {/* Quick Examples */}
                    <View style={styles.quickExamples}>
                        <Text style={styles.quickTitle}>⚡ Quick Examples</Text>
                        
                        {[
                            'Looking for iPhone 13 in Bangalore under 50k',
                            'Selling MacBook Pro 2021 excellent condition Delhi',
                            'Need web developer for e-commerce project 50k budget',
                            'Python tutor available online evenings',
                        ].map((example, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickExample}
                                onPress={() => handleExamplePress(example)}
                            >
                                <Text style={styles.quickExampleText}>{example}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
                        <Text style={styles.gotItButtonText}>Got it! Let's Search</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    subtitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginVertical: 20,
    },
    tipContainer: {
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        marginBottom: 12,
        overflow: 'hidden',
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    tipHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    tipIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    tipInfo: {
        flex: 1,
    },
    tipTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    tipDescription: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    expandIcon: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        marginLeft: 12,
    },
    examplesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: theme.colors.glass.secondary,
    },
    examplesTitle: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        marginBottom: 12,
        fontWeight: 'bold',
    },
    exampleButton: {
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exampleText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        flex: 1,
    },
    useExampleText: {
        ...theme.typography.styles.caption,
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    additionalTips: {
        marginTop: 20,
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        padding: 20,
        marginBottom: 20,
    },
    additionalTitle: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    proTip: {
        marginBottom: 16,
    },
    proTipTitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    proTipText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    quickExamples: {
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        padding: 20,
        marginBottom: 20,
    },
    quickTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    quickExample: {
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.neon.blue + '30',
    },
    quickExampleText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
    },
    gotItButton: {
        backgroundColor: theme.colors.neon.blue,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    gotItButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});