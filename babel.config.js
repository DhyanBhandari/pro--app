// babel.config.js
// Babel configuration for Expo React Native project with custom aliases and plugins

/**
 * Connect App - Phase 1
 * 
 * A React Native Expo application with glassmorphism design system
 * featuring authentication flow, onboarding, and futuristic animations.
 * 
 * @author Developer
 * @version 1.0.0
 * @phase 1 - Foundation & Authentication UI
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/navigation': './src/navigation',
            '@/services': './src/services',
            '@/themes': './src/themes',
            '@/utils': './src/utils',
            '@/types': './src/types',
            '@/assets': './src/assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
