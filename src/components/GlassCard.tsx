// Reusable glassmorphism card component
// Provides consistent frosted glass effect container

/**
 * GlassCard Component - Phase 1
 * 
 * A reusable container component that applies glassmorphism styling
 * with customizable blur effects, transparency, and padding.
 * 
 * @param children React nodes to render inside the card
 * @param variant Style variant (primary, secondary, elevated)
 * @param style Additional custom styling
 * @param blur Enable/disable blur effect (iOS only)
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { theme } from '@/themes';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'elevated';
  style?: ViewStyle;
  blur?: boolean;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'primary',
  style,
  blur = false,
  padding = 20,
}) => {
  console.log('[GlassCard] Rendering with variant:', variant);

  const glassStyle = theme.glassmorphism.card[variant];
  const containerStyle = [glassStyle, { padding }, style];

  // Note: BlurView temporarily replaced with regular View for compatibility
  // TODO: Re-enable BlurView when expo-blur is properly configured
  
  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional custom styles can be added here if needed
});