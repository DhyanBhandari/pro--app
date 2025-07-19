// Animated input field with glassmorphism styling
// Features floating labels and focus animations

/**
 * AnimatedInput Component - Phase 1
 * 
 * A sophisticated input component with floating label animations,
 * glassmorphism styling, and focus state management.
 * 
 * @param label Input label text
 * @param value Current input value
 * @param onChangeText Callback for text changes
 * @param secureTextEntry Hide input text (for passwords)
 * @param placeholder Placeholder text
 * @param error Error message to display
 * @param icon Optional icon component
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/themes';

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  placeholder,
  error,
  icon,
  style,
  keyboardType = 'default',
}) => {
  console.log('[AnimatedInput] Rendering input:', label);

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const focusAnimation = useSharedValue(0);
  const labelAnimation = useSharedValue(value ? 1 : 0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: interpolate(
      focusAnimation.value,
      [0, 1],
      [
        theme.colors.glass.border as any,
        theme.colors.neon.blue as any,
      ]
    ),
    shadowOpacity: interpolate(focusAnimation.value, [0, 1], [0, 0.3]),
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(labelAnimation.value, [0, 1], [0, -28]),
      },
      {
        scale: interpolate(labelAnimation.value, [0, 1], [1, 0.85]),
      },
    ],
    color: interpolate(
      focusAnimation.value,
      [0, 1],
      [
        theme.colors.text.secondary as any,
        theme.colors.neon.blue as any,
      ]
    ),
  }));

  const handleFocus = () => {
    console.log('[AnimatedInput] Focus:', label);
    setIsFocused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    focusAnimation.value = withTiming(1, { duration: theme.animations.timing.normal });
    labelAnimation.value = withTiming(1, { duration: theme.animations.timing.normal });
  };

  const handleBlur = () => {
    console.log('[AnimatedInput] Blur:', label);
    setIsFocused(false);
    
    focusAnimation.value = withTiming(0, { duration: theme.animations.timing.normal });
    
    if (!value) {
      labelAnimation.value = withTiming(0, { duration: theme.animations.timing.normal });
    }
  };

  const handleTextChange = (text: string) => {
    console.log('[AnimatedInput] Text change:', label, text.length, 'characters');
    onChangeText(text);
    
    if (text && labelAnimation.value === 0) {
      labelAnimation.value = withTiming(1, { duration: theme.animations.timing.normal });
    } else if (!text && !isFocused) {
      labelAnimation.value = withTiming(0, { duration: theme.animations.timing.normal });
    }
  };

  const togglePasswordVisibility = () => {
    console.log('[AnimatedInput] Toggle password visibility');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPasswordVisible(!isPasswordVisible);
  };

  const containerStyle = [
    styles.container,
    theme.glassmorphism.input.container,
    isFocused && theme.glassmorphism.input.focused,
    error && styles.errorContainer,
    style,
  ];

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[containerStyle, animatedContainerStyle]}>
        <View style={styles.inputContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          
          <View style={styles.textContainer}>
            <Animated.Text style={[styles.label, animatedLabelStyle]}>
              {label}
            </Animated.Text>
            
            <TextInput
              style={[
                styles.input,
                icon && styles.inputWithIcon,
                secureTextEntry && styles.inputWithToggle,
              ]}
              value={value}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={secureTextEntry && !isPasswordVisible}
              placeholder={isFocused ? placeholder : ''}
              placeholderTextColor={theme.colors.text.placeholder}
              keyboardType={keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {secureTextEntry && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={togglePasswordVisibility}
            >
              <Text style={styles.toggleText}>
                {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 12,
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  input: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    paddingTop: 16,
    paddingBottom: 4,
    margin: 0,
    padding: 0,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithToggle: {
    paddingRight: 40,
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  toggleText: {
    fontSize: 18,
  },
  errorContainer: {
    borderColor: theme.colors.status.error,
  },
  errorText: {
    ...theme.typography.styles.caption,
    color: theme.colors.status.error,
    marginTop: 4,
    marginLeft: 16,
  },
});