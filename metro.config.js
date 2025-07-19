const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for resolving the custom paths
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/screens': './src/screens',
  '@/navigation': './src/navigation',
  '@/services': './src/services',
  '@/themes': './src/themes',
  '@/utils': './src/utils',
  '@/types': './src/types',
  '@/assets': './src/assets',
};

module.exports = config;