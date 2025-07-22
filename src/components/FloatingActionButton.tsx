import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';

const { width, height } = Dimensions.get('window');

interface FloatingAction {
    id: string;
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
}

interface FloatingActionButtonProps {
    actions: FloatingAction[];
    primaryIcon?: string;
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    size?: 'small' | 'medium' | 'large';
}

const SIZES = {
    small: { main: 48, sub: 36 },
    medium: { main: 56, sub: 44 },
    large: { main: 64, sub: 52 },
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    actions,
    primaryIcon = '+',
    primaryColor = theme.colors.neon.blue,
    position = 'bottom-right',
    size = 'medium',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const animationValue = useRef(new Animated.Value(0)).current;
    const rotationValue = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        const rotateValue = isOpen ? 0 : 1;

        Animated.parallel([
            Animated.spring(animationValue, {
                toValue,
                useNativeDriver: true,
                tension: 80,
                friction: 5,
            }),
            Animated.timing(rotationValue, {
                toValue: rotateValue,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        setIsOpen(!isOpen);
    };

    const handleActionPress = (action: FloatingAction) => {
        toggleMenu();
        setTimeout(() => {
            action.onPress();
        }, 200);
    };

    const getPositionStyle = () => {
        const spacing = 20;
        switch (position) {
            case 'bottom-right':
                return { bottom: spacing, right: spacing };
            case 'bottom-left':
                return { bottom: spacing, left: spacing };
            case 'top-right':
                return { top: spacing + 50, right: spacing };
            case 'top-left':
                return { top: spacing + 50, left: spacing };
            default:
                return { bottom: spacing, right: spacing };
        }
    };

    const rotation = rotationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const buttonSize = SIZES[size];

    return (
        <View style={[styles.container, getPositionStyle()]}>
            {/* Sub Actions */}
            {actions.map((action, index) => {
                const translateY = animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(buttonSize.main + 10) * (index + 1)],
                });

                const opacity = animationValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                });

                const scale = animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                });

                return (
                    <Animated.View
                        key={action.id}
                        style={[
                            styles.subActionContainer,
                            {
                                transform: [
                                    { translateY },
                                    { scale },
                                ],
                                opacity,
                            },
                        ]}
                    >
                        <View style={styles.labelContainer}>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                        </View>
                        
                        <TouchableOpacity
                            style={[
                                styles.subActionButton,
                                {
                                    width: buttonSize.sub,
                                    height: buttonSize.sub,
                                    backgroundColor: action.color || theme.colors.glass.primary,
                                },
                            ]}
                            onPress={() => handleActionPress(action)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.subActionIcon}>{action.icon}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* Main Button */}
            <TouchableOpacity
                style={[
                    styles.mainButton,
                    {
                        width: buttonSize.main,
                        height: buttonSize.main,
                    },
                ]}
                onPress={toggleMenu}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[primaryColor, primaryColor + 'CC']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                
                <Animated.Text
                    style={[
                        styles.mainIcon,
                        {
                            transform: [{ rotate: rotation }],
                        },
                    ]}
                >
                    {primaryIcon}
                </Animated.Text>
            </TouchableOpacity>

            {/* Backdrop */}
            {isOpen && (
                <Animated.View
                    style={[
                        styles.backdrop,
                        {
                            opacity: animationValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                        },
                    ]}
                    pointerEvents={isOpen ? 'auto' : 'none'}
                >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={toggleMenu}
                        activeOpacity={1}
                    />
                </Animated.View>
            )}
        </View>
    );
};

// Predefined FAB configurations for common use cases
export const SearchFAB: React.FC<{
    onNewSearch: () => void;
    onSearchTips: () => void;
    onSavedMatches: () => void;
    onHistory: () => void;
}> = ({ onNewSearch, onSearchTips, onSavedMatches, onHistory }) => (
    <FloatingActionButton
        primaryIcon="🔍"
        primaryColor={theme.colors.neon.blue}
        actions={[
            {
                id: 'new-search',
                icon: '➕',
                label: 'New Search',
                onPress: onNewSearch,
                color: theme.colors.neon.green,
            },
            {
                id: 'tips',
                icon: '💡',
                label: 'Search Tips',
                onPress: onSearchTips,
                color: theme.colors.neon.orange,
            },
            {
                id: 'saved',
                icon: '💾',
                label: 'Saved Matches',
                onPress: onSavedMatches,
                color: theme.colors.neon.pink,
            },
            {
                id: 'history',
                icon: '📋',
                label: 'History',
                onPress: onHistory,
                color: theme.colors.neon.purple,
            },
        ]}
    />
);

export const MatchResultsFAB: React.FC<{
    onFilter: () => void;
    onSort: () => void;
    onRefresh: () => void;
    onShare: () => void;
}> = ({ onFilter, onSort, onRefresh, onShare }) => (
    <FloatingActionButton
        primaryIcon="⚙️"
        primaryColor={theme.colors.neon.purple}
        actions={[
            {
                id: 'filter',
                icon: '🔽',
                label: 'Filter',
                onPress: onFilter,
                color: theme.colors.neon.blue,
            },
            {
                id: 'sort',
                icon: '📊',
                label: 'Sort',
                onPress: onSort,
                color: theme.colors.neon.green,
            },
            {
                id: 'refresh',
                icon: '🔄',
                label: 'Refresh',
                onPress: onRefresh,
                color: theme.colors.neon.orange,
            },
            {
                id: 'share',
                icon: '📤',
                label: 'Share',
                onPress: onShare,
                color: theme.colors.neon.pink,
            },
        ]}
    />
);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: -height,
        left: -width,
        width: width * 2,
        height: height * 2,
        backgroundColor: theme.colors.background.primary,
        zIndex: -1,
    },
    subActionContainer: {
        position: 'absolute',
        alignItems: 'center',
        flexDirection: 'row',
    },
    labelContainer: {
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 12,
        maxWidth: 120,
    },
    actionLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.primary,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subActionButton: {
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        shadowColor: theme.colors.glass.shadow,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    subActionIcon: {
        fontSize: 20,
    },
    mainButton: {
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.glass.shadow,
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        overflow: 'hidden',
    },
    mainIcon: {
        fontSize: 24,
        color: theme.colors.text.primary,
        fontWeight: 'bold',
    },
});