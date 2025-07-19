# Developer Guide - Phase 1

Complete development guide for the Connect App Phase 1 implementation.

## 📖 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure Explained](#folder-structure-explained)
3. [Component Hierarchy](#component-hierarchy)
4. [Theme System](#theme-system)
5. [Navigation Flow](#navigation-flow)
6. [Authentication System](#authentication-system)
7. [Adding New Screens](#adding-new-screens)
8. [Customizing Themes](#customizing-themes)
9. [Debugging Tips](#debugging-tips)
10. [Best Practices](#best-practices)

## 🏗 Architecture Overview

The app follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │     Screens     │    │   Navigation    │
│   (UI Layer)    │    │  (View Layer)   │    │   (Routing)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │    Services     │    │     Themes      │    │     Types       │
         │ (Business Logic)│    │   (Styling)     │    │ (Type Safety)   │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Principles

- **Component Reusability**: All UI components are modular and reusable
- **Type Safety**: Full TypeScript coverage with strict typing
- **Theme Consistency**: Centralized theming system for glassmorphism
- **Service Layer**: Business logic separated from UI components
- **Mock Data**: Phase 1 uses mock services for rapid prototyping

## 📁 Folder Structure Explained

### `/src/components/`
Reusable UI components with glassmorphism styling:

- **GlassCard.tsx**: Base container with glass effect
- **NeonButton.tsx**: Interactive button with glow animations
- **AnimatedInput.tsx**: Form input with floating labels
- **LoadingOverlay.tsx**: Full-screen loading with blur

### `/src/screens/`
Complete screen implementations:

- **SplashScreen.tsx**: App initialization and auth check
- **OnboardingScreen.tsx**: 3-screen swipeable introduction
- **LoginScreen.tsx**: Authentication form with validation
- **RegisterScreen.tsx**: Registration with password strength

### `/src/navigation/`
Navigation configuration and routing:

- **RootNavigator.tsx**: Main app flow coordinator
- **AuthNavigator.tsx**: Authentication stack navigator

### `/src/services/`
Business logic and data management:

- **AuthService.ts**: Authentication and user management
- **StorageService.ts**: Local data persistence wrapper
- **ValidationService.ts**: Form validation and rules

### `/src/themes/`
Design system and styling:

- **colors.ts**: Color palette and gradients
- **typography.ts**: Font sizes and text styles
- **glassmorphism.ts**: Glass effect style definitions
- **animations.ts**: Animation presets and timing

### `/src/types/`
TypeScript type definitions:

- **user.types.ts**: User data and authentication types
- **navigation.types.ts**: Navigation parameter types

### `/src/utils/`
Utility functions and constants:

- **constants.ts**: App-wide constants and configuration
- **helpers.ts**: Common utility functions

## 🧩 Component Hierarchy

```
App.tsx
└── RootNavigator
    ├── SplashScreen
    ├── OnboardingScreen
    │   ├── GlassCard
    │   ├── NeonButton
    │   └── Paginator (dots)
    ├── AuthNavigator
    │   ├── LoginScreen
    │   │   ├── GlassCard
    │   │   ├── AnimatedInput (×2)
    │   │   ├── NeonButton
    │   │   └── LoadingOverlay
    │   └── RegisterScreen
    │       ├── GlassCard
    │       ├── AnimatedInput (×5)
    │       ├── NeonButton
    │       └── LoadingOverlay
    └── MainScreen (placeholder)
```

## 🎨 Theme System

### Using the Theme

```typescript
import { theme } from '@/themes';

// Access colors
const primaryColor = theme.colors.neon.blue;
const glassStyle = theme.glassmorphism.card.primary;

// Apply animations
const animationConfig = theme.animations.presets.fadeIn;
```

### Color System

```typescript
// Background layers
theme.colors.background.primary    // #0A0A0A
theme.colors.background.secondary  // #1A1A1A

// Glass transparency
theme.colors.glass.primary         // rgba(255, 255, 255, 0.1)
theme.colors.glass.border          // rgba(255, 255, 255, 0.2)

// Neon accents
theme.colors.neon.blue             // #00D4FF
theme.colors.neon.pink             // #FF00E5
theme.colors.neon.green            // #00FF88
```

### Typography Scale

```typescript
// Font sizes
theme.typography.fontSize.xs       // 12
theme.typography.fontSize.base     // 16
theme.typography.fontSize['2xl']   // 24

// Text styles
theme.typography.styles.h1         // Large heading
theme.typography.styles.body       // Standard text
theme.typography.styles.caption    // Small text
```

## 🧭 Navigation Flow

```
Splash → Check Auth State
├── Authenticated → Main App
├── Onboarding Complete → Auth Stack
│   ├── Login → Main App (success)
│   ├── Register → Main App (success)
│   └── Forgot Password → Reset Flow
└── First Time → Onboarding
    └── Complete → Auth Stack
```

### Navigation Usage

```typescript
// Navigate to screen
navigation.navigate('Login');

// Replace current screen
navigation.replace('Main');

// Go back
navigation.goBack();

// Navigate with parameters
navigation.navigate('ForgotPassword', { email: 'user@example.com' });
```

## 🔐 Authentication System

### Mock Authentication

Phase 1 uses mock authentication for development:

```typescript
// Demo credentials
Email: test@example.com
Password: Test123!
```

### Service Usage

```typescript
import { authService } from '@/services';

// Login user
const response = await authService.login({ email, password });
if (response.success) {
  // Handle success
}

// Register user
const result = await authService.register(userData);

// Check current auth state
const authState = await authService.checkAuthState();
```

### Storage Integration

```typescript
import { storageService } from '@/services';

// Store data
await storageService.setItem('key', value);

// Retrieve data
const data = await storageService.getItem('key');

// Remove data
await storageService.removeItem('key');
```

## ➕ Adding New Screens

### 1. Create Screen Component

```typescript
// src/screens/NewScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '@/themes';

export const NewScreen: React.FC = () => {
  console.log('[NewScreen] Component mounted');
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <Text style={{ color: theme.colors.text.primary }}>New Screen</Text>
    </View>
  );
};
```

### 2. Add to Navigation Types

```typescript
// src/types/navigation.types.ts
export type RootStackParamList = {
  // ... existing screens
  NewScreen: { param1?: string };
};
```

### 3. Register in Navigator

```typescript
// src/navigation/RootNavigator.tsx
import { NewScreen } from '@/screens/NewScreen';

// Add to Stack.Navigator
<Stack.Screen
  name="NewScreen"
  component={NewScreen}
  options={{
    title: 'New Screen',
    ...theme.glassmorphism.navigation.header,
  }}
/>
```

### 4. Export from Barrel

```typescript
// src/screens/index.ts
export { NewScreen } from './NewScreen';
```

## 🎨 Customizing Themes

### Adding New Colors

```typescript
// src/themes/colors.ts
export const colors = {
  // ... existing colors
  neon: {
    // ... existing neon colors
    yellow: '#FFD700',
    purple: '#9D00FF',
  },
};
```

### Creating Custom Glass Styles

```typescript
// src/themes/glassmorphism.ts
export const glassmorphism = {
  // ... existing styles
  customCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,
};
```

### Adding Animation Presets

```typescript
// src/themes/animations.ts
export const animations = {
  presets: {
    // ... existing presets
    customSlide: {
      duration: 400,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    },
  },
};
```

## 🐛 Debugging Tips

### Console Logging

All components include debug logging:

```typescript
console.log('[ComponentName] Action description:', data);
```

Filter logs by component:
```bash
# Chrome DevTools Console
[AuthService]  # Filter by service
[LoginScreen]  # Filter by screen
```

### Common Issues

#### 1. Navigation Errors
```typescript
// Check navigation state
console.log(navigation.getState());

// Ensure screen is registered in navigator
// Verify parameter types match navigation types
```

#### 2. Animation Not Working
```typescript
// Check reanimated configuration
// Ensure animation values are initialized
// Verify timing and easing configurations
```

#### 3. Glass Effects Not Visible
```typescript
// Check background colors
// Verify border and shadow properties
// Ensure proper layering with elevation/zIndex
```

#### 4. Form Validation Issues
```typescript
// Check validation service
import { validationService } from '@/services';

const result = validationService.validateEmail(email);
console.log('[Debug] Validation result:', result);
```

### Performance Monitoring

```typescript
// Monitor component renders
React.useEffect(() => {
  console.log('[ComponentName] Rendered');
});

// Track navigation timing
navigation.addListener('focus', () => {
  console.log('[Navigation] Screen focused:', Date.now());
});
```

## ✅ Best Practices

### Code Structure

1. **Component Organization**
   ```typescript
   // File header with documentation
   // Imports (React, React Native, third-party, local)
   // Types and interfaces
   // Component implementation
   // Styles (StyleSheet.create)
   ```

2. **Naming Conventions**
   - Components: PascalCase (`GlassCard`)
   - Files: PascalCase for components (`GlassCard.tsx`)
   - Variables: camelCase (`isLoading`)
   - Constants: UPPER_SNAKE_CASE (`STORAGE_KEYS`)

3. **Import Organization**
   ```typescript
   // React imports
   import React from 'react';
   import { View, Text } from 'react-native';
   
   // Third-party imports
   import Animated from 'react-native-reanimated';
   
   // Local imports
   import { theme } from '@/themes';
   import { Component } from '@/components';
   ```

### Performance

1. **Optimize Animations**
   ```typescript
   // Use worklets for smooth animations
   const animatedStyle = useAnimatedStyle(() => {
     'worklet';
     return {
       opacity: opacity.value,
     };
   });
   ```

2. **Memoize Expensive Operations**
   ```typescript
   const expensiveValue = useMemo(() => {
     return heavyCalculation(props.data);
   }, [props.data]);
   ```

3. **Lazy Load Screens**
   ```typescript
   const LazyScreen = React.lazy(() => import('./HeavyScreen'));
   ```

### Accessibility

1. **Add Accessibility Labels**
   ```typescript
   <TouchableOpacity
     accessibilityLabel="Login button"
     accessibilityRole="button"
   >
     <Text>Login</Text>
   </TouchableOpacity>
   ```

2. **Support Screen Readers**
   ```typescript
   <Text
     accessibilityLabel="Password strength: Strong"
     accessibilityLiveRegion="polite"
   >
     Strong
   </Text>
   ```

### Error Handling

1. **Use Try-Catch Blocks**
   ```typescript
   try {
     const result = await apiCall();
     setData(result);
   } catch (error) {
     console.error('[Component] Error:', error);
     setError('Something went wrong');
   }
   ```

2. **Validate Props**
   ```typescript
   interface Props {
     title: string;
     onPress: () => void;
     disabled?: boolean;
   }
   
   const Component: React.FC<Props> = ({ title, onPress, disabled = false }) => {
     if (!title) {
       console.warn('[Component] Title is required');
       return null;
     }
     // ... component implementation
   };
   ```

---

## 🚀 Next Steps

1. **Test on Multiple Devices**: iPhone, Android, tablets
2. **Performance Optimization**: Profile animations and rendering
3. **Accessibility Testing**: Screen reader compatibility
4. **Error Boundary**: Add global error handling
5. **Prepare for Phase 2**: Backend integration planning

For questions or issues, check the console logs and component documentation in source files.