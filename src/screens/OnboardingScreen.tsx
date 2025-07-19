// Onboarding flow with swipeable screens
// Introduces app features with glassmorphism design

/**
 * OnboardingScreen Component - Phase 1
 * 
 * Three-screen onboarding flow with swipeable navigation,
 * animated content, and glassmorphism design elements.
 * 
 * @screens 3 onboarding screens with different content
 * @navigation Swipe gestures and skip/next buttons
 * @animations Slide transitions and content animations
 * @completion Marks onboarding as completed in storage
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { GlassCard, NeonButton } from '@/components';
import { theme } from '@/themes';
import { storageService } from '@/services';
import { RootStackParamList } from '@/types';
import { ONBOARDING_SCREENS, STORAGE_KEYS } from '@/utils';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

interface OnboardingItemProps {
  item: typeof ONBOARDING_SCREENS[0];
  index: number;
  scrollX: SharedValue<number>;
}

const OnboardingItem: React.FC<OnboardingItemProps> = ({ item, index, scrollX }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);
    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8]);
    const translateY = interpolate(scrollX.value, inputRange, [50, 0, 50]);

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <View style={styles.slideContainer}>
      <Animated.View style={[styles.slide, animatedStyle]}>
        {/* Illustration placeholder */}
        <View style={styles.illustrationContainer}>
          <GlassCard style={styles.illustrationCard} variant="elevated">
            <View style={styles.illustrationPlaceholder}>
              <LinearGradient
                colors={[theme.colors.neon.blue, theme.colors.neon.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustrationGradient}
              >
                <Text style={styles.illustrationIcon}>
                  {index === 0 ? '🌐' : index === 1 ? '🤖' : '🚀'}
                </Text>
              </LinearGradient>
            </View>
          </GlassCard>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

interface PaginatorProps {
  data: typeof ONBOARDING_SCREENS;
  scrollX: SharedValue<number>;
}

const Paginator: React.FC<PaginatorProps> = ({ data, scrollX }) => {
  return (
    <View style={styles.paginatorContainer}>
      {data.map((_, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8]);
          const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);

          return {
            width: dotWidth,
            opacity,
          };
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, animatedStyle]}
          />
        );
      })}
    </View>
  );
};

export const OnboardingScreen: React.FC = () => {
  console.log('[OnboardingScreen] Component mounted');
  
  const navigation = useNavigation<OnboardingNavigationProp>();
  const flatListRef = useRef<FlatList>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const handleScroll = (event: any) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    console.log('[OnboardingScreen] Current index:', newIndex);
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    console.log('[OnboardingScreen] Next pressed, current index:', currentIndex);
    
    if (currentIndex < ONBOARDING_SCREENS.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = async () => {
    console.log('[OnboardingScreen] Skip pressed');
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    console.log('[OnboardingScreen] Completing onboarding');
    
    try {
      // Mark onboarding as completed
      await storageService.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
      
      // Navigate to auth flow
      navigation.replace('Auth', { screen: 'Login' });
    } catch (error) {
      console.error('[OnboardingScreen] Error completing onboarding:', error);
      // Navigate anyway
      navigation.replace('Auth', { screen: 'Login' });
    }
  };

  const isLastSlide = currentIndex === ONBOARDING_SCREENS.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.background}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Skip button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Onboarding slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SCREENS}
        renderItem={({ item, index }) => (
          <OnboardingItem item={item} index={index} scrollX={scrollX} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Paginator */}
        <Paginator data={ONBOARDING_SCREENS} scrollX={scrollX} />

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          <NeonButton
            title={isLastSlide ? 'Get Started' : 'Next'}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
          />
          
          {!isLastSlide && (
            <TouchableOpacity style={styles.laterButton} onPress={handleSkip}>
              <Text style={styles.laterText}>Maybe Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    width,
    flex: 1,
    paddingHorizontal: 24,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationCard: {
    width: width * 0.7,
    height: width * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 300,
    maxHeight: 300,
  },
  illustrationPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  illustrationGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIcon: {
    fontSize: 80,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    maxWidth: width * 0.9,
  },
  title: {
    ...theme.typography.styles.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    alignItems: 'center',
  },
  paginatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.neon.blue,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  nextButton: {
    width: '100%',
  },
  laterButton: {
    paddingVertical: 12,
  },
  laterText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.tertiary,
  },
});