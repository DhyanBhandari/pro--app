// Full-screen loading overlay with glassmorphism
// Shows loading spinner with animated background

/**
 * LoadingOverlay Component - Phase 1
 * 
 * A full-screen loading overlay with glassmorphism background effect
 * and animated loading indicators. Used for async operations.
 * 
 * @param visible Show/hide the overlay
 * @param message Custom loading message
 * @param onCancel Optional cancel callback
 * @param blur Enable blur effect
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/themes';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  onCancel?: () => void;
  blur?: boolean;
}

const { width, height } = Dimensions.get('window');

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  onCancel,
  blur = true,
}) => {
  console.log('[LoadingOverlay] Visible:', visible, 'Message:', message);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    if (visible) {
      console.log('[LoadingOverlay] Showing overlay');
      opacity.value = withTiming(1, { duration: theme.animations.timing.normal });
      scale.value = withTiming(1, {
        duration: theme.animations.timing.normal,
        easing: theme.animations.easing.glass,
      });
      
      // Start continuous animations
      rotation.value = withRepeat(
        withTiming(360, {
          duration: theme.animations.timing.verySlow * 3,
          easing: Easing.linear,
        }),
        -1,
        false
      );
      
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: theme.animations.timing.slow }),
          withTiming(1, { duration: theme.animations.timing.slow })
        ),
        -1,
        true
      );
    } else {
      console.log('[LoadingOverlay] Hiding overlay');
      opacity.value = withTiming(0, { duration: theme.animations.timing.fast });
      scale.value = withTiming(0.8, { duration: theme.animations.timing.fast });
    }
  }, [visible]);

  const handleCancel = () => {
    if (onCancel) {
      console.log('[LoadingOverlay] Cancel pressed');
      onCancel();
    }
  };

  if (!visible) return null;

  // Note: BlurView temporarily replaced with regular View for compatibility
  // TODO: Re-enable BlurView when expo-blur is properly configured

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <View style={styles.background}>
          <Animated.View style={[styles.content, contentStyle]}>
            <View style={[styles.loadingCard, theme.glassmorphism.card.elevated]}>
              <Animated.View style={[styles.loaderContainer, pulseStyle]}>
                <View style={styles.customLoader}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.neon.blue}
                  />
                  <View style={[styles.glowRing, { borderColor: theme.colors.neon.blue }]} />
                  <View style={[styles.glowRing, styles.glowRingDelay, { borderColor: theme.colors.neon.pink }]} />
                </View>
              </Animated.View>
              
              <Text style={styles.message}>{message}</Text>
              
              {onCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background.primary + 'E6', // 90% opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    minWidth: width * 0.7,
    maxWidth: width * 0.9,
  },
  loaderContainer: {
    marginBottom: 24,
  },
  customLoader: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    opacity: 0.6,
  },
  glowRingDelay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  message: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  cancelText: {
    ...theme.typography.styles.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});