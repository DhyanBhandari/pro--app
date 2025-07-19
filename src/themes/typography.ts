// Typography system for consistent text styling
// Defines font sizes, weights, and text styles

/**
 * Typography System - Phase 1
 * 
 * Comprehensive typography system with modern font scaling
 * and consistent text styles across the application.
 * 
 * @scales Font size scales from xs to 4xl
 * @weights Font weight variations
 * @lineHeights Optimized line heights for readability
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    light: '300' as TextStyle['fontWeight'],
    normal: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Text styles
  styles: {
    h1: {
      fontSize: 36,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 43,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 30,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 29,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 20,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 22,
    },
    bodyLarge: {
      fontSize: 18,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 25,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 18,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 20,
      letterSpacing: 0.5,
    },
  },
} as const;

export type TypographyTheme = typeof typography;