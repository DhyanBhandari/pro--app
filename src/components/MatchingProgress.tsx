import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';
import { MatchingProcess } from '@/types/matching.types';

interface MatchingProgressProps {
    process: MatchingProcess;
}

const STEPS = [
    {
        key: 'parsing',
        title: 'Analyzing Query',
        description: 'AI is understanding your request...',
        icon: '🔍',
        color: theme.colors.neon.blue,
    },
    {
        key: 'searching',
        title: 'Finding Candidates',
        description: 'Searching through our database...',
        icon: '🔎',
        color: theme.colors.neon.purple,
    },
    {
        key: 'matching',
        title: 'ML Matching',
        description: 'Advanced algorithms are scoring matches...',
        icon: '🎯',
        color: theme.colors.neon.green,
    },
    {
        key: 'completed',
        title: 'Results Ready',
        description: 'Found the best matches for you!',
        icon: '✨',
        color: theme.colors.neon.pink,
    },
];

export const MatchingProgress: React.FC<MatchingProgressProps> = ({ process }) => {
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // Start rotation animation
        const rotateAnimation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        pulseAnimation.start();
        rotateAnimation.start();

        return () => {
            pulseAnimation.stop();
            rotateAnimation.stop();
        };
    }, []);

    useEffect(() => {
        const currentStepIndex = STEPS.findIndex(step => step.key === process.status);
        const progress = currentStepIndex >= 0 ? (currentStepIndex + 1) / STEPS.length : 0;
        
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [process.status]);

    const getCurrentStep = () => {
        return STEPS.find(step => step.key === process.status) || STEPS[0];
    };

    const currentStep = getCurrentStep();
    const currentStepIndex = STEPS.findIndex(step => step.key === process.status);

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1],
    });

    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
    });

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.glass.primary, theme.colors.glass.secondary]}
                style={styles.gradient}
            />

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            },
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {Math.round((currentStepIndex + 1) / STEPS.length * 100)}%
                </Text>
            </View>

            {/* Current Step */}
            <View style={styles.currentStepContainer}>
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            transform: [
                                { scale: pulseScale },
                                { rotate: process.status === 'matching' ? rotate : '0deg' }
                            ],
                            opacity: pulseOpacity,
                            backgroundColor: currentStep.color + '20',
                            borderColor: currentStep.color,
                        },
                    ]}
                >
                    <Text style={styles.stepIcon}>{currentStep.icon}</Text>
                </Animated.View>

                <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: currentStep.color }]}>
                        {currentStep.title}
                    </Text>
                    <Text style={styles.stepDescription}>
                        {currentStep.description}
                    </Text>
                </View>
            </View>

            {/* Steps Timeline */}
            <View style={styles.timelineContainer}>
                {STEPS.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                        <View key={step.key} style={styles.timelineStep}>
                            <View
                                style={[
                                    styles.timelineIcon,
                                    {
                                        backgroundColor: isActive ? step.color : theme.colors.glass.secondary,
                                        borderColor: isActive ? step.color : theme.colors.glass.border,
                                        borderWidth: isCurrent ? 2 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.timelineIconText,
                                        { opacity: isActive ? 1 : 0.5 }
                                    ]}
                                >
                                    {step.icon}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.timelineLabel,
                                    { 
                                        color: isActive ? theme.colors.text.primary : theme.colors.text.tertiary,
                                        fontWeight: isCurrent ? 'bold' : 'normal',
                                    }
                                ]}
                            >
                                {step.title}
                            </Text>
                            
                            {index < STEPS.length - 1 && (
                                <View
                                    style={[
                                        styles.timelineLine,
                                        {
                                            backgroundColor: isActive ? step.color : theme.colors.glass.border,
                                        }
                                    ]}
                                />
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Processing Stats */}
            {process.processing_stats && (
                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>Processing Statistics</Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {process.processing_stats.parsing_time_ms}ms
                            </Text>
                            <Text style={styles.statLabel}>Parsing</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {process.processing_stats.matching_time_ms}ms
                            </Text>
                            <Text style={styles.statLabel}>Matching</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {process.processing_stats.total_candidates}
                            </Text>
                            <Text style={styles.statLabel}>Candidates</Text>
                        </View>
                        
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {process.processing_stats.filtered_results}
                            </Text>
                            <Text style={styles.statLabel}>Results</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Query Info */}
            <View style={styles.queryContainer}>
                <Text style={styles.queryLabel}>Searching for:</Text>
                <Text style={styles.queryText}>{process.query.query}</Text>
                {process.query.location && (
                    <Text style={styles.locationText}>📍 {process.query.location}</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        overflow: 'hidden',
        position: 'relative',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 3,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.neon.blue,
        borderRadius: 3,
    },
    progressText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        fontWeight: 'bold',
        minWidth: 35,
        textAlign: 'right',
    },
    currentStepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepIcon: {
        fontSize: 24,
    },
    stepInfo: {
        flex: 1,
    },
    stepTitle: {
        ...theme.typography.styles.h4,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    stepDescription: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    timelineContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    timelineIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    timelineIconText: {
        fontSize: 14,
    },
    timelineLabel: {
        ...theme.typography.styles.caption,
        flex: 1,
    },
    timelineLine: {
        position: 'absolute',
        left: 16,
        top: 32,
        width: 1,
        height: 16,
    },
    statsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
    },
    statsTitle: {
        ...theme.typography.styles.h5,
        color: theme.colors.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        ...theme.typography.styles.h4,
        color: theme.colors.neon.blue,
        fontWeight: 'bold',
    },
    statLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    queryContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
    },
    queryLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    queryText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    locationText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
});