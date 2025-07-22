import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { theme } from '@/themes';
import { MainStackParamList } from '@/types/navigation.types';
import { MatchingProvider } from '@/contexts/MatchingContext';
import {
    HomeScreen,
    MatchingScreen,
    MatchResultsScreen,
    MatchDetailsScreen,
} from '@/screens';

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
    return (
        <MatchingProvider>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false,
                    cardStyle: {
                        backgroundColor: theme.colors.background.primary,
                    },
                    ...TransitionPresets.SlideFromRightIOS,
                }}
            >
                {/* Home/Search Screen */}
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        ...TransitionPresets.FadeFromBottomAndroid,
                    }}
                />

                {/* Matching Process Screen */}
                <Stack.Screen
                    name="Matching"
                    component={MatchingScreen}
                    options={{
                        ...TransitionPresets.SlideFromRightIOS,
                        gestureEnabled: false, // Prevent back gesture during matching
                    }}
                />

                {/* Match Results Screen */}
                <Stack.Screen
                    name="MatchResults"
                    component={MatchResultsScreen}
                    options={{
                        ...TransitionPresets.SlideFromRightIOS,
                    }}
                />

                {/* Match Details Screen */}
                <Stack.Screen
                    name="MatchDetails"
                    component={MatchDetailsScreen}
                    options={{
                        ...TransitionPresets.SlideFromRightIOS,
                    }}
                />

                {/* Search Screen (if needed as separate screen) */}
                <Stack.Screen
                    name="Search"
                    component={HomeScreen}
                    options={{
                        ...TransitionPresets.SlideFromRightIOS,
                    }}
                />

                {/* Future screens can be added here */}
                <Stack.Screen
                    name="Profile"
                    component={HomeScreen} // Placeholder
                    options={{
                        ...TransitionPresets.SlideFromRightIOS,
                    }}
                />

                <Stack.Screen
                    name="Settings"
                    component={HomeScreen} // Placeholder
                    options={{
                        ...TransitionPresets.SlideFromRightIOS,
                    }}
                />
            </Stack.Navigator>
        </MatchingProvider>
    );
};