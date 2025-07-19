// Color palette for glassmorphism theme
// Defines primary, secondary, and neon accent colors

/**
 * Color System - Phase 1
 * 
 * Comprehensive color palette for the glassmorphism design system.
 * Features dark backgrounds with neon accents and glass transparency layers.
 * 
 * @primary Dark background with depth layers
 * @accent Neon colors for highlights and interactions
 * @glass Transparent layers for glassmorphism effects
 */

export const colors = {
  // Background layers
  background: {
    primary: '#0A0A0A',
    secondary: '#1A1A1A',
    tertiary: '#2A2A2A',
  },

  // Glass transparency layers
  glass: {
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    tertiary: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  // Neon accent colors
  neon: {
    blue: '#00D4FF',
    pink: '#FF00E5',
    green: '#00FF88',
    purple: '#9D00FF',
    orange: '#FF6B00',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    placeholder: 'rgba(255, 255, 255, 0.3)',
  },

  // Status colors
  status: {
    success: '#00FF88',
    error: '#FF4444',
    warning: '#FFB800',
    info: '#00D4FF',
  },

  // Gradient combinations
  gradients: {
    primary: ['#00D4FF', '#FF00E5'],
    secondary: ['#FF00E5', '#00FF88'],
    tertiary: ['#00FF88', '#00D4FF'],
    background: ['#0A0A0A', '#1A1A1A'],
  },
} as const;

export type ColorTheme = typeof colors;