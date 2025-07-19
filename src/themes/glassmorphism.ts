// Glassmorphism style definitions
// Creates frosted glass effects with blur and transparency

/**
 * Glassmorphism Style System - Phase 1
 * 
 * Pre-defined glassmorphism styles for consistent frosted glass effects
 * throughout the application. Includes cards, overlays, and interactive elements.
 * 
 * @cards Different glass card variations
 * @overlays Full-screen glass overlays
 * @interactive Buttons and touchable elements
 */

import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const glassmorphism = {
  // Card variations
  card: {
    primary: {
      backgroundColor: colors.glass.primary,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.glass.border,
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    } as ViewStyle,

    secondary: {
      backgroundColor: colors.glass.secondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.glass.border,
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    } as ViewStyle,

    elevated: {
      backgroundColor: colors.glass.tertiary,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.glass.border,
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    } as ViewStyle,
  },

  // Overlay styles
  overlay: {
    modal: {
      backgroundColor: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(10px)',
    } as ViewStyle,

    loading: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(5px)',
    } as ViewStyle,
  },

  // Interactive elements
  button: {
    primary: {
      backgroundColor: colors.glass.primary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glass.border,
      shadowColor: colors.neon.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    } as ViewStyle,

    neon: {
      backgroundColor: 'rgba(0, 212, 255, 0.1)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neon.blue,
      shadowColor: colors.neon.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 8,
    } as ViewStyle,
  },

  // Input styles
  input: {
    container: {
      backgroundColor: colors.glass.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glass.border,
    } as ViewStyle,

    focused: {
      borderColor: colors.neon.blue,
      shadowColor: colors.neon.blue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    } as ViewStyle,
  },

  // Navigation styles
  navigation: {
    header: {
      backgroundColor: colors.glass.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.glass.border,
      shadowColor: colors.glass.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    } as ViewStyle,
  },
} as const;

export type GlassmorphismTheme = typeof glassmorphism;