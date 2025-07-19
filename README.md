# Connect App - Phase 1

A React Native mobile application with glassmorphism design system and futuristic animations. This is Phase 1 focusing on foundation, authentication UI, and onboarding flow.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## 📱 Phase 1 Features

### ✅ Completed Features

- **Glassmorphism Design System**: Complete theme system with colors, typography, and glass effects
- **Authentication Flow**: Login and registration screens with validation
- **Onboarding**: 3-screen swipeable onboarding experience
- **Splash Screen**: Animated logo with authentication check
- **Form Validation**: Real-time validation with error handling
- **Animations**: Smooth transitions using react-native-reanimated
- **Mock Authentication**: Working login/register with local storage

### 🎨 Design System

- **Colors**: Dark theme with neon accents (#00D4FF, #FF00E5, #00FF88)
- **Glass Effects**: Frosted glass containers with blur and transparency
- **Typography**: Scalable font system with consistent styling
- **Animations**: Predefined animation presets for smooth interactions

### 🔐 Authentication

- **Login**: Email/password with demo credentials
- **Register**: Full registration form with password strength indicator
- **Validation**: Real-time form validation with helpful error messages
- **Storage**: Secure local storage using AsyncStorage

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GlassCard.tsx   # Glassmorphism container
│   ├── NeonButton.tsx  # Animated button with glow
│   ├── AnimatedInput.tsx # Form input with animations
│   └── LoadingOverlay.tsx # Full-screen loading
├── screens/            # Application screens
│   ├── SplashScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
├── navigation/         # Navigation configuration
│   ├── RootNavigator.tsx
│   └── AuthNavigator.tsx
├── services/           # Business logic & API calls
│   ├── AuthService.ts
│   ├── StorageService.ts
│   └── ValidationService.ts
├── themes/             # Design system
│   ├── colors.ts
│   ├── typography.ts
│   ├── glassmorphism.ts
│   └── animations.ts
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── assets/             # Images, animations, etc.
```

## 🧪 Demo Credentials

For testing the authentication flow:

```
Email: test@example.com
Password: Test123!
```

## 📋 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
npm test           # Run tests (when implemented)
```

## 🔧 Development

### Prerequisites

- Node.js 16+
- Expo CLI
- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Follow Expo CLI instructions to run on device/simulator

## 🎯 Phase 1 Scope

This phase focuses on:
- ✅ Project foundation and architecture
- ✅ Glassmorphism design system
- ✅ Authentication UI and validation
- ✅ Onboarding experience
- ✅ Navigation structure
- ✅ Mock authentication service

## 🚧 Known Limitations

- Authentication is mock-only (no real backend)
- Social login buttons are UI placeholders
- Main app screens are placeholders
- No biometric authentication yet
- Limited error handling for edge cases

## 📚 Documentation

- See `DEVELOPER_GUIDE_PHASE_1.md` for detailed development guide
- Check component documentation in source files
- Review type definitions in `src/types/`

## 🔮 Future Phases

- **Phase 2**: Backend integration and real authentication
- **Phase 3**: Core app features and functionality  
- **Phase 4**: Advanced features and optimization
- **Phase 5**: Production deployment and testing

## 🤝 Contributing

This is a Phase 1 prototype. For improvements:
1. Follow existing code patterns
2. Maintain glassmorphism design consistency
3. Add proper TypeScript types
4. Include developer documentation
5. Test on multiple devices

## 📄 License

Prototype project - Phase 1 development version.

---

**Built with ❤️ using React Native, Expo, and Glassmorphism Design**