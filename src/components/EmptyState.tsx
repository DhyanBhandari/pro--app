import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
    secondaryActionText?: string;
    onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '🔍',
    title,
    message,
    actionText,
    onAction,
    secondaryActionText,
    onSecondaryAction,
}) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.glass.primary, theme.colors.glass.secondary]}
                style={styles.gradient}
            />
            
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            {onAction && actionText && (
                <TouchableOpacity style={styles.primaryButton} onPress={onAction}>
                    <Text style={styles.primaryButtonText}>{actionText}</Text>
                </TouchableOpacity>
            )}
            
            {onSecondaryAction && secondaryActionText && (
                <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryAction}>
                    <Text style={styles.secondaryButtonText}>{secondaryActionText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Predefined empty states for common scenarios
export const NoMatchesFound: React.FC<{ onNewSearch?: () => void; onAdjustFilters?: () => void }> = ({
    onNewSearch,
    onAdjustFilters,
}) => (
    <EmptyState
        icon="🎯"
        title="No Matches Found"
        message="We couldn't find any matches for your search. Try adjusting your keywords or check back later for new listings."
        actionText="Start New Search"
        onAction={onNewSearch}
        secondaryActionText="Adjust Filters"
        onSecondaryAction={onAdjustFilters}
    />
);

export const SearchInProgress: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => (
    <EmptyState
        icon="⏳"
        title="Searching..."
        message="Our AI is finding the best matches for you. This may take a few moments."
        actionText="Cancel Search"
        onAction={onCancel}
    />
);

export const NoRecentSearches: React.FC<{ onStartSearch?: () => void }> = ({ onStartSearch }) => (
    <EmptyState
        icon="🔍"
        title="No Recent Searches"
        message="Your search history will appear here once you start using Connect's smart search feature."
        actionText="Start Your First Search"
        onAction={onStartSearch}
    />
);

export const NoSavedMatches: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => (
    <EmptyState
        icon="💾"
        title="No Saved Matches"
        message="Bookmark your favorite matches to access them quickly later. They'll appear here once you save them."
        actionText="Explore Matches"
        onAction={onExplore}
    />
);

export const SearchError: React.FC<{ onRetry?: () => void; onGoHome?: () => void }> = ({ 
    onRetry, 
    onGoHome 
}) => (
    <EmptyState
        icon="⚠️"
        title="Search Failed"
        message="Something went wrong while searching. Please check your connection and try again."
        actionText="Retry Search"
        onAction={onRetry}
        secondaryActionText="Go Home"
        onSecondaryAction={onGoHome}
    />
);

export const OfflineState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
    <EmptyState
        icon="📡"
        title="No Internet Connection"
        message="Connect requires an internet connection to search for matches. Please check your connection and try again."
        actionText="Try Again"
        onAction={onRetry}
    />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        margin: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        position: 'relative',
        minHeight: 300,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    icon: {
        fontSize: 64,
        marginBottom: 24,
    },
    title: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        maxWidth: 280,
    },
    primaryButton: {
        backgroundColor: theme.colors.neon.blue,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginBottom: 16,
        minWidth: 200,
    },
    primaryButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.background.primary,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
        paddingVertical: 14,
        paddingHorizontal: 32,
        minWidth: 200,
    },
    secondaryButtonText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        fontWeight: '500',
        textAlign: 'center',
    },
});