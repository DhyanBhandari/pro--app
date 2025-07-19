// Animated neon button with glassmorphism styling
// Features press animations and haptic feedback

/**
 * NeonButton Component - Phase 1
 * 
 * An interactive button with neon glow effects, glassmorphism styling,
 * and smooth press animations. Includes haptic feedback for enhanced UX.
 * 
 * @param title Button text
 * @param onPress Callback function when pressed
 * @param variant Style variant (primary, secondary, outlined)
 * @param disabled Disable button interactions
 * @param loading Show loading state
 * @param glowColor Custom glow color
 */

import React from 'react';
import {
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined';
  disabled?: boolean;
  loading?: boolean;
  glowColor?: string;
  style?: ViewStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  glowColor = theme.colors.neon.blue,
  style,
}) => {
  console.log('[NeonButton] Rendering button:', title, 'variant:', variant);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    console.log('[NeonButton] Press in:', title);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    scale.value = withSpring(0.95, theme.animations.spring.snappy);
    glowOpacity.value = withTiming(0.6, { duration: theme.animations.timing.fast });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    console.log('[NeonButton] Press out:', title);
    scale.value = withSpring(1, theme.animations.spring.gentle);
    glowOpacity.value = withTiming(0.3, { duration: theme.animations.timing.normal });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    console.log('[NeonButton] Pressed:', title);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      ...theme.glassmorphism.button.primary,
      shadowColor: glowColor,
    };

    if (variant === 'outlined') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderColor: glowColor,
        borderWidth: 2,
      };
    }

    if (variant === 'secondary') {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.glass.secondary,
      };
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = {
      ...theme.typography.styles.button,
      color: theme.colors.text.primary,
      textAlign: 'center' as const,
    };

    if (variant === 'outlined') {
      return {
        ...baseStyle,
        color: glowColor,
      };
    }

    return baseStyle;
  };

  const buttonStyle = [
    styles.button,
    getButtonStyle(),
    disabled && styles.disabled,
    style,
  ];

  if (variant === 'primary' && !disabled) {
    return (
      <AnimatedTouchableOpacity
        style={[animatedStyle, glowStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[glowColor, theme.colors.glass.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={buttonStyle}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.primary} />
          ) : (
            <Text style={getTextStyle()}>{title}</Text>
          )}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedTouchableOpacity
      style={[animatedStyle, glowStyle, buttonStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text.primary} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
});