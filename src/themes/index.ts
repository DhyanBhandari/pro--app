// Theme system barrel export
// Centralizes all theme-related exports

/**
 * Theme System Export - Phase 1
 * 
 * Barrel export for the complete theme system including colors,
 * typography, glassmorphism styles, and animations.
 * 
 * @usage import { theme } from '@/themes'
 */

import { colors, ColorTheme } from './colors';
import { typography, TypographyTheme } from './typography';
import { glassmorphism, GlassmorphismTheme } from './glassmorphism';
import { animations, AnimationTheme } from './animations';

export const theme = {
  colors,
  typography,
  glassmorphism,
  animations,
} as const;

export type Theme = {
  colors: ColorTheme;
  typography: TypographyTheme;
  glassmorphism: GlassmorphismTheme;
  animations: AnimationTheme;
};

export { colors, typography, glassmorphism, animations };
export type { ColorTheme, TypographyTheme, GlassmorphismTheme, AnimationTheme };