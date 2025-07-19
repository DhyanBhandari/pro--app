// Animation configurations for smooth transitions
// Defines timing, easing, and animation presets

/**
 * Animation System - Phase 1
 * 
 * Centralized animation configurations using react-native-reanimated.
 * Provides consistent timing, easing, and preset animations.
 * 
 * @timing Animation duration constants
 * @easing Easing curve definitions
 * @presets Common animation configurations
 */

import { Easing } from 'react-native-reanimated';

export const animations = {
  // Timing constants
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  // Easing curves
  easing: {
    // Standard easing curves
    easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
    easeOut: Easing.bezier(0, 0, 0.2, 1),
    easeIn: Easing.bezier(0.4, 0, 1, 1),
    
    // Bouncy animations
    bounce: Easing.bounce,
    elastic: Easing.elastic(1.3),
    
    // Custom curves for glassmorphism
    glass: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    neon: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  },

  // Animation presets
  presets: {
    // Fade animations
    fadeIn: {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    },
    fadeOut: {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 1, 1),
    },

    // Scale animations
    scaleIn: {
      duration: 250,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    },
    scaleOut: {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 1, 1),
    },

    // Slide animations
    slideUp: {
      duration: 400,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    },
    slideDown: {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    },

    // Button press animation
    buttonPress: {
      duration: 150,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    },

    // Neon glow animation
    neonGlow: {
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.6, 1),
    },

    // Glass ripple effect
    glassRipple: {
      duration: 600,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    },

    // Screen transitions
    screenTransition: {
      duration: 350,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    },

    // Loading animations
    loading: {
      duration: 1200,
      easing: Easing.bezier(0.4, 0, 0.6, 1),
    },
  },

  // Spring configurations
  spring: {
    gentle: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    },
    bouncy: {
      damping: 8,
      stiffness: 100,
      mass: 1,
    },
    snappy: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
  },
} as const;

export type AnimationTheme = typeof animations;